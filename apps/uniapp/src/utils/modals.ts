export interface IShowToastOptions {
  title?: string
  icon?: 'success' | 'loading' | 'error' | 'none'
  image?: string
  duration?: number
  position?: 'top' | 'center' | 'bottom'
  mask?: boolean
}

export interface ILoadingOptions {
  show: (content?: string) => void
  hide: () => void
}

export interface IShowModalOptions {
  title?: string
  content?: string
  showCancel?: boolean
  cancelText?: string
  cancelColor?: string
  confirmText?: string
  confirmColor?: string
  editable?: boolean
  placeholderText?: string
}

/**
 * 轻提示
 * @param {string} content 提示内容
 * @param {object} option 配置
 */
export const Toast = (content: string, option: IShowToastOptions = {}) => {
  uni.showToast({
    title: content,
    icon: 'none',
    mask: false,
    duration: 2000,
    ...option,
  })
}

/**
 * Loading 提示框
 * @param {string} content 提示内容
 */
export const Loading: ILoadingOptions = {
  show: (content = '加载中') => {
    uni.showLoading({
      title: content,
      mask: true,
    })
  },
  hide: () => {
    uni.hideLoading()
  },
}

/**
 * Dialog 提示框
 * @param {string} content 提示内容
 * @param {object} option 配置
 */
export const Dialog = (content: string, option: IShowModalOptions = {}) => {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '温馨提示',
      content,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#00A0F0',
      success(res) {
        if (res.confirm) resolve(res)
      },
      fail() {
        reject(new Error('Alert 调用失败 !'))
      },
      ...option,
    })
  })
}
