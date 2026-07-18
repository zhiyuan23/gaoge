import { getProtocolConfig } from '@/api'
import { Dialog, Loading, navigateTo, throttle } from '@/utils'

const privacy = ref({
  privacyPolicy: '',
  userAgreement: '',
})

const isLoaded = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadPrivacy = async () => {
  if (isLoaded.value) return true
  if (isLoading.value) return false

  isLoading.value = true
  error.value = null

  try {
    const data = await getProtocolConfig()
    privacy.value = { ...data }
    isLoaded.value = true
    return true
  } catch (e) {
    error.value = '加载协议地址失败'
    console.error(e)
    return false
  } finally {
    isLoading.value = false
  }
}

export const useAgreement = () => {
  const open = async (type: 'userAgreement' | 'privacyPolicy') => {
    const loaded = await loadPrivacy()

    if (!loaded || error.value) {
      Dialog(error.value || '协议地址加载失败，请稍后重试')
      return false
    }

    const url = privacy.value[type]
    if (!url) {
      Dialog('协议地址未配置')
      return false
    }

    const title = type === 'userAgreement' ? '用户协议' : '隐私政策'
    const isPdf = url.trim().toLowerCase().endsWith('.pdf')

    if (isPdf) {
      handleOpenPdf(url, title)
    } else {
      navigateTo(`/pages/common/webview/index?url=${encodeURIComponent(url)}&title=${title}`)
    }
    return true
  }

  const throttledOpen = throttle(open, 1000)

  const handleOpenPdf = (url: string, title: string) => {
    Loading.show('')

    uni.downloadFile({
      url,
      success: (res) => {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          fileType: 'pdf',
          success: () => {
            console.log(`${title}打开成功`)
          },
          fail: () => {
            Dialog('无法打开该类型的文件，请检查手机是否安装了相关查看器')
          },
          complete: () => {
            Loading.hide()
          },
        })
      },
      fail: () => {
        Loading.hide()
      },
    })
  }

  const showSelector = async () => {
    const itemList = ['用户协议', '隐私政策']

    const { tapIndex } = await uni.showActionSheet({ itemList })

    if (tapIndex === 0) {
      openUserAgreement()
    } else if (tapIndex === 1) {
      openPrivacyPolicy()
    }
  }

  const openUserAgreement = () => throttledOpen('userAgreement')
  const openPrivacyPolicy = () => throttledOpen('privacyPolicy')

  return {
    openUserAgreement,
    openPrivacyPolicy,
    showSelector,
  }
}
