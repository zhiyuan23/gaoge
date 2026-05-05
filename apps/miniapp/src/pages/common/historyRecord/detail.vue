<script setup lang="ts">
const pageType = ref('')
const detailData = ref<Record<string, any>>({})

onLoad((query) => {
  if (!query) return
  pageType.value = (query.type as string) || ''
  detailData.value = query.item
})
</script>

<template>
  <view class="bg-background min-h-screen w-full">
    <!-- 顶部：和列表页完全一样的CELL -->
    <view class="border-border px-30 border-b py-24">
      <HistoryCellReceiveScan v-if="pageType === 'receiveScan'" :data="detailData" />
      <HistoryCellDeliverStore v-else-if="pageType === 'deliverStore'" :data="detailData" />
      <HistoryCellDeliverDistributor
        v-else-if="pageType === 'deliverDistributor'"
        :data="detailData"
      />
      <HistoryCellStoreReturn v-else-if="pageType === 'storeReturn'" :data="detailData" />
      <HistoryCellTransferOut v-else-if="pageType === 'transferOut'" :data="detailData" />
      <HistoryCellTransferIn v-else-if="pageType === 'transferIn'" :data="detailData" />
      <HistoryCellReturnHq v-else-if="pageType === 'returnHq'" :data="detailData" />
      <HistoryCellInventoryScan v-else-if="pageType === 'inventoryScan'" :data="detailData" />
      <HistoryCellStoreRequisition v-else-if="pageType === 'storeRequisition'" :data="detailData" />
      <HistoryCellSamplingCheck v-else-if="pageType === 'samplingCheck'" :data="detailData" />
      <view v-else class="text-default text-base">
        {{ detailData.content || '未知记录' }}
      </view>
    </view>
    <!-- 下方详情内容 -->
    <view class="p-30">
      <view class="text-secondary text-sm"> 详情内容待扩展... </view>
    </view>
  </view>
</template>
