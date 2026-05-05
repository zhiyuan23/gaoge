<script setup lang="ts">
import { navigateTo } from '@/utils'

const type = ref('')
const list = ref<any>([])

// 最干净、不报错的 onLoad 写法
onLoad((query) => {
  if (!query) return
  type.value = query.type || ''
  getHistoryData()
})

// 获取数据
const getHistoryData = () => {
  // 模拟数据
  if (type.value === 'receiveScan') {
    list.value = [
      { code: 'SX123456', createTime: '2025-04-07 18:00' },
      { code: 'SX123457', createTime: '2025-04-07 19:00' },
      { code: 'SX123458', createTime: '2025-04-07 20:00' },
    ]
  }
  if (type.value === 'deliverStore') {
    list.value = [{ storeName: '测试门店', createTime: '2025-04-07 18:00' }]
  }
  if (type.value === 'inventoryScan') {
    list.value = [{ inventoryCode: 'PD20250407', createTime: '2025-04-07 18:00' }]
  }
}

// 跳详情
const toDetail = (item: any) => {
  navigateTo(
    `/pages/common/historyRecord/detail?item=${encodeURIComponent(JSON.stringify(item))}&type=${type.value}`,
  )
}
</script>

<template>
  <view class="bg-background min-h-screen w-full">
    <!-- 空状态 -->
    <view v-if="list.length === 0" class="flex-col-center-center py-120">
      <t-empty description="暂无历史记录" />
    </view>

    <!-- 列表 -->
    <view v-else class="w-full">
      <view
        v-for="(item, idx) in list"
        :key="idx"
        class="border-border px-30 border-b py-24"
        @click="toDetail(item)"
      >
        <HistoryCellReceiveScan v-if="type === 'receiveScan'" :data="item" />
        <HistoryCellDeliverStore v-else-if="type === 'deliverStore'" :data="item" />
        <HistoryCellDeliverDistributor v-else-if="type === 'deliverDistributor'" :data="item" />
        <HistoryCellStoreReturn v-else-if="type === 'storeReturn'" :data="item" />
        <HistoryCellTransferOut v-else-if="type === 'transferOut'" :data="item" />
        <HistoryCellTransferIn v-else-if="type === 'transferIn'" :data="item" />
        <HistoryCellReturnHq v-else-if="type === 'returnHq'" :data="item" />
        <HistoryCellInventoryScan v-else-if="type === 'inventoryScan'" :data="item" />
        <HistoryCellStoreRequisition v-else-if="type === 'storeRequisition'" :data="item" />
        <HistoryCellSamplingCheck v-else-if="type === 'samplingCheck'" :data="item" />
      </view>
    </view>
  </view>
</template>
