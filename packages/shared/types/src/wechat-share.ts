export interface WechatShareAdminConfig {
  appId: string
  hasAppSecret: boolean
  defaultImageUrl: string
  homeTitle: string
  homeDesc: string
  homeImageUrl: string
  teamsTitle: string
  teamsDesc: string
  teamsImageUrl: string
  assetsTitle: string
  assetsDesc: string
  assetsImageUrl: string
}

export interface UpdateWechatShareAdminConfigPayload {
  appId: string
  appSecret?: string
  defaultImageUrl: string
  homeTitle: string
  homeDesc: string
  homeImageUrl?: string
  teamsTitle: string
  teamsDesc: string
  teamsImageUrl?: string
  assetsTitle: string
  assetsDesc: string
  assetsImageUrl?: string
}

export interface WechatSharePublicConfig {
  title: string
  desc: string
  imgUrl: string
}
