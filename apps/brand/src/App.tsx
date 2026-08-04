import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ConceptIndexPage from '@/concepts/ConceptIndexPage'
import {
  type BrandConcept,
  concepts,
  getConceptPath,
  homepageConceptSlug,
  legacyConceptRoutes,
} from '@/concepts/registry'

const ContentPage = lazy(() => import('@/pages/content/ContentPage'))
const DigitalPage = lazy(() => import('@/pages/digital/DigitalPage'))

function ConceptLoading() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-[100dvh] place-items-center bg-[#0c0c0c] text-sm tracking-[0.18em] text-white/50"
    >
      LOADING GAOGE
    </main>
  )
}

function LazyPageRoute({ component: Page }: Pick<BrandConcept, 'component'>) {
  return (
    <Suspense fallback={<ConceptLoading />}>
      <Page />
    </Suspense>
  )
}

const homepageConcept = concepts.find(({ slug }) => slug === homepageConceptSlug)

if (!homepageConcept) {
  throw new Error(`Homepage concept "${homepageConceptSlug}" is not registered`)
}

const HomepagePage = homepageConcept.component

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LazyPageRoute component={HomepagePage} />} />
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
  )
}
