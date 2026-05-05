interface NavigateMiniAppOptions {
  appId: string
  path?: string
  extraData?: Record<string, any>
  envVersion?: 'release' | 'develop' | 'trial'
}

export const navigateTo = (url: string) => {
  return uni.navigateTo({ url })
}

export const redirectTo = (url: string) => {
  return uni.redirectTo({ url })
}

export const switchTab = (url: string) => {
  return uni.switchTab({ url })
}

export const reLaunch = (url: string) => {
  return uni.reLaunch({ url })
}

export const navigateBack = (delta = 1) => {
  return uni.navigateBack({ delta })
}

export const navigateToMiniApp = ({
  appId,
  path = '',
  extraData = {},
  envVersion,
}: NavigateMiniAppOptions) => {
  const finalEnvVersion = envVersion ?? import.meta.env.VITE_WX_ENV_VERSION

  return new Promise<void>((resolve, reject) => {
    uni.navigateToMiniProgram({
      appId,
      path,
      extraData,
      envVersion: finalEnvVersion,
      success: () => resolve(),
      fail: (err) => {
        reject(err)
      },
    })
  })
}
