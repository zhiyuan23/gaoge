import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/football',
  component: Layout,
  name: 'football',
  meta: {
    title: '高歌FC',
    cacheable: true,
    icon: 'lucide:star',
  },
  children: [
    {
      path: 'player',
      name: 'player',
      component: () => import('@/views/football/player/index.vue'),
      meta: {
        title: '球员信息',
      },
    },
    {
      path: 'team',
      name: 'team',
      component: () => import('@/views/football/team/index.vue'),
      meta: {
        title: '球队信息',
      },
    },
    {
      path: 'match-round',
      name: 'matchRound',
      component: () => import('@/views/football/match_round/index.vue'),
      meta: {
        title: '比赛信息',
      },
    },
  ],
}

export default routes
