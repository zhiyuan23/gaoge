import { createHashRouter,Navigate } from 'react-router-dom'

import { AppShell } from '@/app/layout/app-shell'

export const appRouter = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
  },
  {
    path: '/settings',
    element: <Navigate replace to="/" />,
  },
])
