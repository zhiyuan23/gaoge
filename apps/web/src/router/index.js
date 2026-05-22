import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import TeamAssetPage from '../views/TeamAssetPage.vue'
import TeamsPage from '../views/TeamsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/teams/football/assets',
    name: 'team-assets',
    component: TeamAssetPage,
  },
  {
    path: '/teams/:team?',
    name: 'teams',
    component: TeamsPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
