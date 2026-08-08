import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import TeamAssetPage from '../views/TeamAssetPage.vue'
import TeamsPage from '../views/TeamsPage.vue'

const routes = [
  {
    path: '/hero',
    name: 'hero',
    component: HomePage,
  },
  {
    path: '/assets',
    name: 'team-assets',
    component: TeamAssetPage,
  },
  {
    path: '/teams/football/assets',
    redirect: '/assets',
  },
  {
    path: '/teams/:team',
    name: 'team',
    component: TeamsPage,
  },
  {
    path: '/teams',
    redirect: '/',
  },
  {
    path: '/',
    name: 'teams',
    component: TeamsPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
