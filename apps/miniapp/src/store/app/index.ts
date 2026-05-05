export const useAppStore = defineStore('app', () => {
  // 分别定义
  const deviceInfo = ref<UniApp.GetDeviceInfoResult | null>(null)
  const windowInfo = ref<UniApp.GetWindowInfoResult | null>(null)
  const appBaseInfo = ref<UniApp.GetAppBaseInfoResult | null>(null)
  const systemSetting = ref<UniApp.GetsystemsettingResult | null>(null)
  const appAuthorizeSetting = ref<UniApp.GetAppAuthorizeSettingResult | null>(null)

  // 初始化所有信息
  const initSystemInfo = () => {
    try {
      deviceInfo.value = uni.getDeviceInfo()
      windowInfo.value = uni.getWindowInfo()
      appBaseInfo.value = uni.getAppBaseInfo()
      systemSetting.value = uni.getSystemSetting()
      appAuthorizeSetting.value = uni.getAppAuthorizeSetting()
    } catch (err) {
      console.error('获取系统信息异常:', err)
    }
  }

  const refreshAppAuthorizeSetting = () => {
    appAuthorizeSetting.value = uni.getAppAuthorizeSetting()
  }

  // 检查版本更新
  const checkUpdate = () => {
    const updateManager = uni.getUpdateManager()
    updateManager.onCheckForUpdate((res: UniApp.OnCheckForUpdateResult) => {
      console.log('有无新版本:', res.hasUpdate)
    })
    updateManager.onUpdateReady(() => {
      uni.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用?',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        },
      })
    })
    updateManager.onUpdateFailed((err) => {
      console.error('更新下载失败:', err)
      uni.showToast({ title: '更新失败', icon: 'error' })
    })
  }

  return {
    deviceInfo,
    windowInfo,
    appBaseInfo,
    systemSetting,
    appAuthorizeSetting,

    initSystemInfo,
    refreshAppAuthorizeSetting,
    checkUpdate,
  }
})

export default useAppStore
