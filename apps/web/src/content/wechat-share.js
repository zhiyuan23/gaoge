const shareImageUrl = '/gaoge_logo_wechat_share.jpg'

export const wechatShareConfigs = {
  home: {
    title: '高歌体育',
    desc: '将体育浪漫主义坚决贯彻到底。',
    imgUrl: shareImageUrl,
  },
  teams: {
    title: '高歌FC',
    desc: '查看高歌球队阵容、积分走势与最新动态。',
    imgUrl: shareImageUrl,
  },
  footballAssets: {
    title: '高歌FC 球队资产',
    desc: '查看高歌FC公开收支总览与历史流水记录。',
    imgUrl: shareImageUrl,
  },
}

export function resolveWechatShareConfig(path) {
  if (path === '/teams/football/assets') {
    return wechatShareConfigs.footballAssets
  }

  if (path.startsWith('/teams')) {
    return wechatShareConfigs.teams
  }

  return wechatShareConfigs.home
}
