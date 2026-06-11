import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/content',
  component: Layout,
  name: 'content',
  meta: {
    title: '内容管理',
    cacheable: true,
    icon: 'ri:article-line',
  },
  children: [
    {
      path: 'message-board-post',
      name: 'contentMessageBoardPost',
      component: () => import('@/views/content/message-board-post/index.vue'),
      meta: {
        title: '留言板',
        auth: ['content.messageBoardPost.view'],
      },
    },
  ],
}

export default routes
