import { createHashRouter, Navigate } from 'react-router-dom'

import { HomePage } from '@/pages/home/page'

export const appRouter = createHashRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/settings',
    element: <Navigate replace to="/" />,
  },
])
