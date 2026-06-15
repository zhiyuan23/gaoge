import Content from './content'
import Football from './football'

import type { Route } from '#/global'

const routes: Route.recordMainRaw = {
  meta: {
    title: '高歌体育',
    icon: 'solar:cup-star-outline',
  },
  children: [Football, Content],
}

export default routes
