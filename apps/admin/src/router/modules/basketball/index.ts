import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/basketball',
  component: Layout,
  name: 'basketball',
  meta: {
    title: '高歌篮球俱乐部',
    cacheable: true,
    icon: 'mdi:basketball',
    menu: false,
  },
  children: [
    {
      path: 'player',
      name: 'basketballPlayer',
      component: () => import('@/views/basketball/player/index.vue'),
      meta: {
        title: '球员信息',
      },
    },
    {
      path: 'team',
      name: 'basketballTeam',
      component: () => import('@/views/basketball/team/index.vue'),
      meta: {
        title: '球队信息',
      },
    },
    {
      path: 'match-round',
      name: 'basketballMatchRound',
      component: () => import('@/views/basketball/match-round/index.vue'),
      meta: {
        title: '比赛信息',
      },
    },
    {
      path: 'asset-record',
      name: 'basketballAssetRecord',
      component: () => import('@/views/basketball/asset-record/index.vue'),
      meta: {
        title: '资产信息',
        auth: ['basketball.assetRecord.view'],
      },
    },
  ],
}

export default routes
