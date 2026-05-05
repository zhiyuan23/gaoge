import { storage } from './storage'

// 小程序更新检测
export const mpUpdate = () => {
  const updateManager = uni.getUpdateManager()
  updateManager.onCheckForUpdate((res) => {
    // 请求完新版本信息的回调
    console.log(res.hasUpdate)
  })
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title: '更新提示',
      content: '检测到新版本，是否下载新版本并重启小程序？',
      success(res) {
        if (res.confirm) {
          // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
          updateManager.applyUpdate()
        }
      },
    })
  })
  updateManager.onUpdateFailed(() => {
    // 新的版本下载失败
    uni.showModal({
      title: '已经有新版本了哟~',
      content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
      showCancel: false,
    })
  })
}

export const billType = {
  getType(scanType: string) {
    const orgType = storage.getOrgType()
    console.log('获取到本地存储的orgtype是：', orgType)
    if (scanType === 'receiveScan') {
      return orgType === '4' ? 'DealerFromRDCIn' : 'D2FromDealerIn'
    } else if (scanType === 'deliverStore') {
      return orgType === '4' ? 'DealerToStoreOut' : 'D2ToStoreOut'
    } else if (scanType === 'inventoryScan') {
      return orgType === 4 ? 'DEALER_ST' : 'D2_ST'
    } else if (scanType === 'deliverDistributor') {
      return orgType === '4' ? 'DealerToD2Out' : 'DealerToD2Out'
    } else if (scanType === 'storeReturn') {
      return orgType === '4' ? 'DealerFromStoreIn' : 'D2FromStoreIn'
    } else if (scanType === 'transferOut') {
      return orgType === '4' ? 'DealerToDealerOut' : 'D2ToD2Out'
    } else if (scanType === 'transferIn') {
      return orgType === '4' ? 'DealerToDealerIn' : 'D2ToD2In'
    } else if (scanType === 'returnHq') {
      return orgType === '4' ? 'DealerToRDC' : 'D2ToDealerOut'
    } else if (scanType === 'storeRequisition') {
      return orgType === '4' ? 'DealerWantToStoreOut' : 'D2WantToStoreOut'
    } else {
      return ''
    }
  },
}
