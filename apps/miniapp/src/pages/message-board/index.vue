<script setup lang="ts">
import type { MiniappRumorPostItem, RumorTagOption } from '@gaoge/shared-types'

import { requestRumorPosts } from '@/api/rumor-post'
import { formatTime, navigateTo, Toast } from '@/utils'

defineOptions({
  name: 'RumorBoardPage',
})

const pageSize = 10

const initialized = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const loadFailed = ref(false)
const finished = ref(false)
const page = ref(1)
const activeTag = ref('')
const items = ref<MiniappRumorPostItem[]>([])
const tagOptions = ref<RumorTagOption[]>([])

const displayTagOptions = computed(() => [{ label: '全部', value: '' }, ...tagOptions.value])

async function loadPosts(options: { refresh?: boolean } = {}) {
  const { refresh = false } = options

  if (refresh) {
    if (loading.value) {
      return
    }
    loading.value = true
    page.value = 1
    finished.value = false
  } else {
    if (loading.value || loadingMore.value || finished.value) {
      return
    }
    loadingMore.value = true
  }

  try {
    loadFailed.value = false
    const response = await requestRumorPosts({
      page: page.value,
      pageSize,
      ...(activeTag.value ? { tag: activeTag.value } : {}),
    })

    tagOptions.value = response.tagOptions
    items.value = refresh ? response.list : [...items.value, ...response.list]
    initialized.value = true

    const reachedEnd = items.value.length >= response.total || response.list.length < pageSize
    finished.value = reachedEnd

    if (!reachedEnd) {
      page.value += 1
    }
  } catch (error) {
    console.error(error)
    loadFailed.value = true
    initialized.value = true
    Toast('加载流言板失败，请重试')
  } finally {
    if (refresh) {
      loading.value = false
      uni.stopPullDownRefresh()
    } else {
      loadingMore.value = false
    }
  }
}

function handleTagChange(value: string) {
  if (activeTag.value === value) {
    return
  }

  activeTag.value = value
  void loadPosts({ refresh: true })
}

function handleOpenSource(item: MiniappRumorPostItem) {
  if (!item.sourceUrl) {
    return
  }

  navigateTo(
    `/pages/common/webview/index?url=${encodeURIComponent(item.sourceUrl)}&title=${encodeURIComponent(item.sourceName)}`,
  )
}

function formatPublishedTime(value: string | null) {
  return formatTime(value, {
    format: 'MM-DD HH:mm',
    placeholder: '-',
  })
}

function formatRelativeTime(value: string | null) {
  return formatTime(value, {
    relative: true,
    placeholder: '',
  })
}

onLoad(() => {
  void loadPosts({ refresh: true })
})

onPullDownRefresh(() => {
  void loadPosts({ refresh: true })
})

onReachBottom(() => {
  void loadPosts()
})
</script>

<template>
  <view class="message-board-page bg-#F3F6FB min-h-screen">
    <view class="px-28 pb-36 pt-28">
      <view class="hero-card rounded-32 px-28 py-28">
        <text class="text-40 font-700 leading-56 color-#0F172A block">流言板</text>
        <text class="text-24 leading-38 color-#5B6B86 mt-12 block">
          最新转会、伤病、签约和比赛日更新，按标签快速筛选。
        </text>
      </view>

      <scroll-view scroll-x class="mt-20 w-full whitespace-nowrap">
        <view class="inline-flex gap-12 pr-28">
          <view
            v-for="item in displayTagOptions"
            :key="item.value"
            class="chip text-22 font-600 inline-flex items-center rounded-full px-24 py-12 transition-all"
            :class="activeTag === item.value ? 'chip-active' : 'chip-idle'"
            @tap="handleTagChange(String(item.value))"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <view
        v-if="loading && !initialized"
        class="state-card rounded-28 mt-24 px-28 py-40 text-center"
      >
        <text class="text-28 font-600 color-#0F172A block">加载中</text>
        <text class="text-24 color-#6B7280 mt-10 block">正在刷新最新流言板动态</text>
      </view>

      <view
        v-else-if="loadFailed && !items.length"
        class="state-card rounded-28 mt-24 px-28 py-40 text-center"
      >
        <text class="text-28 font-600 color-#0F172A block">加载失败</text>
        <text class="text-24 color-#6B7280 mt-10 block">下拉刷新后重试</text>
      </view>

      <view
        v-else-if="initialized && !items.length"
        class="state-card rounded-28 mt-24 px-28 py-40 text-center"
      >
        <text class="text-28 font-600 color-#0F172A block">暂无动态</text>
        <text class="text-24 color-#6B7280 mt-10 block">当前筛选下还没有可展示的流言动态</text>
      </view>

      <view v-else class="gap-18 mt-24 flex flex-col">
        <view
          v-for="item in items"
          :key="item.id"
          class="message-card rounded-30 px-24 py-24"
          :class="item.isPinned ? 'message-card-pinned' : ''"
        >
          <view class="flex items-center justify-between gap-16">
            <view class="flex min-w-0 items-center gap-10">
              <view v-if="item.isPinned" class="pin-pill text-20 font-700 rounded-full px-12 py-6">
                置顶
              </view>
              <text
                class="text-22 font-700 color-#2563EB truncate"
                :class="item.sourceUrl ? 'source-link' : ''"
                @tap="handleOpenSource(item)"
              >
                {{ item.sourceName }}
              </text>
            </view>
            <view class="shrink-0 text-right">
              <text class="text-20 color-#5B6B86 block">{{
                formatPublishedTime(item.publishedAt)
              }}</text>
              <text class="text-18 color-#94A3B8 mt-4 block">
                {{ formatRelativeTime(item.publishedAt) }}
              </text>
            </view>
          </view>

          <view v-if="item.tags?.length" class="mt-16 flex flex-wrap gap-10">
            <view
              v-for="tag in item.tags"
              :key="tag"
              class="tag-pill text-20 color-#475569 rounded-full px-14 py-8"
            >
              #{{ tag }}
            </view>
          </view>

          <text class="mt-18 text-30 font-700 leading-44 color-#0F172A block">
            {{ item.title }}
          </text>
          <text class="message-content text-24 leading-40 color-#334155 mt-14 block">
            {{ item.content }}
          </text>
        </view>

        <view v-if="loadingMore" class="text-22 color-#64748B pb-16 pt-4 text-center"
          >正在加载更多</view
        >
        <view
          v-else-if="finished && items.length"
          class="text-22 color-#94A3B8 pb-16 pt-4 text-center"
        >
          已经到底了
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.message-board-page {
  min-height: 100vh;
}

.hero-card,
.message-card,
.state-card {
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16rpx 44rpx rgb(15 23 42 / 6%);
}

.chip {
  border: 1px solid #dbe4f0;
}

.chip-idle {
  background: rgb(255 255 255 / 82%);
  color: #5b6b86;
}

.chip-active {
  background: #0f172a;
  border-color: #0f172a;
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgb(15 23 42 / 18%);
}

.message-card {
  border: 1px solid transparent;
}

.message-card-pinned {
  border-color: rgb(245 158 11 / 28%);
  box-shadow: 0 18rpx 48rpx rgb(245 158 11 / 10%);
}

.pin-pill {
  background: rgb(245 158 11 / 14%);
  color: #b45309;
}

.tag-pill {
  background: #eef2f7;
}

.source-link {
  position: relative;
}

.source-link::after {
  position: absolute;
  right: -12rpx;
  bottom: 2rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 9999rpx;
  background: currentcolor;
  content: '';
}

.message-content {
  display: -webkit-box;
  overflow: hidden;
  line-clamp: 4;
  -webkit-box-orient: vertical;
}
</style>
