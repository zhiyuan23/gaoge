import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ConceptLoading from '@/brand/components/ConceptLoading'
import HomeGroupRouteShell from '@/brand/components/HomeGroupRouteShell'
import RouteScrollReset from '@/brand/components/RouteScrollReset'
import ConceptIndexPage from '@/concepts/ConceptIndexPage'
import {
  type BrandConcept,
  concepts,
  getConceptPath,
  legacyConceptRoutes,
} from '@/concepts/registry'

const ContentPage = lazy(() => import('@/pages/content/ContentPage'))
const DigitalPage = lazy(() => import('@/pages/digital/DigitalPage'))

function LazyPageRoute({ component: Page }: Pick<BrandConcept, 'component'>) {
  return (
    <Suspense fallback={<ConceptLoading />}>
      <Page />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <RouteScrollReset />
      <Routes>
        <Route element={<HomeGroupRouteShell />}>
          <Route index element={null} />
          <Route path="group" element={null} />
        </Route>
        <Route path="/digital" element={<LazyPageRoute component={DigitalPage} />} />
        <Route path="/content" element={<LazyPageRoute component={ContentPage} />} />
        <Route path="/concepts" element={<ConceptIndexPage />} />
        {concepts.map(({ component: ConceptPage, slug }) => (
          <Route
            element={<LazyPageRoute component={ConceptPage} />}
            key={slug}
            path={getConceptPath(slug)}
          />
        ))}
        {legacyConceptRoutes.map(({ from, to }) => (
          <Route
            element={<Navigate replace to={getConceptPath(to)} />}
            key={from}
            path={getConceptPath(from)}
          />
        ))}
        <Route path="/concepts/*" element={<Navigate to="/concepts" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
