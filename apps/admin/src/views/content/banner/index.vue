<route lang="yaml">
meta:
  title: Banner 管理
</route>

<script setup lang="ts">
import type { Banner } from '@/api/content/banner'
import bannerApi from '@/api/content/banner'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useListPage } from '@/composables/useListPage'

import { BANNER_DEFAULT_SEARCH } from './model/defaults'
import { buildBannerListParams, normalizeBannerListResponse } from './model/mapper'
import type { BannerSearch } from './model/types'
import {
  getBannerJumpTypeLabel,
  getBannerStatusLabel,
  getBannerStatusTagType,
} from './schemas/form'
import { createBannerSearchFields } from './schemas/search'
import { BANNER_TABLE_COLUMNS, formatDateTime } from './schemas/table'

defineOptions({
  name: 'ContentBannerPage',
})

const searchFields = computed(() => createBannerSearchFields())

const {
  search,
  tableData,
  loading,
  fetchList: fetchBanners,
  handleSearch,
} = useListPage<BannerSearch, Banner, ReturnType<typeof buildBannerListParams>>({
  defaultSearch: BANNER_DEFAULT_SEARCH,
  buildParams: buildBannerListParams,
  request: async (params) => normalizeBannerListResponse(await bannerApi.list(params)),
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      status: String(formData.status ?? ''),
      jumpType: String(formData.jumpType ?? ''),
    }
  },
})

onMounted(() => {
  fetchBanners()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="search"
        :fields="searchFields"
        :default-visible-count="3"
        @search="handleSearch"
      />

      <div class="table-wrapper">
        <EsTable
          :columns="BANNER_TABLE_COLUMNS"
          :data="tableData"
          :loading="loading"
          :show-pagination="false"
          table-height="100%"
        >
          <template #imageUrl="{ row }">
            <ImagePreview :src="row.imageUrl" :width="96" :height="54" />
          </template>
          <template #jumpType="{ row }">
            {{ getBannerJumpTypeLabel(row.jumpType) }}
          </template>
          <template #jumpUrl="{ row }">
            <ElLink v-if="row.jumpUrl" :href="row.jumpUrl" target="_blank" type="primary">
              {{ row.jumpUrl }}
            </ElLink>
            <span v-else>-</span>
          </template>
          <template #status="{ row }">
            <ElTag :type="getBannerStatusTagType(row.status)" effect="plain">
              {{ getBannerStatusLabel(row.status) }}
            </ElTag>
          </template>
          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </EsTable>
      </div>
    </FaPageMain>
  </div>
</template>
