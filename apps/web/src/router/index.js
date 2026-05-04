import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import TeamsPage from '../views/TeamsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
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
