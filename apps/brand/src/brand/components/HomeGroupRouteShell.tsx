import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ConceptLoading from '@/brand/components/ConceptLoading'
import GroupSwipeEntry, {
  type GroupSwipeEntryHandle,
} from '@/concepts/skiing/components/GroupSwipeEntry'
import { loadGroupPage } from '@/pages/group/loadGroupPage'

const GroupPage = lazy(loadGroupPage)
const HomepagePage = lazy(() => import('@/concepts/skiing/SkiingPage'))

export default function HomeGroupRouteShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const directGroupSession = useRef(location.pathname === '/group').current
  const swipeRef = useRef<GroupSwipeEntryHandle>(null)
  const [groupReady, setGroupReady] = useState(directGroupSession)
  const [isCapabilityOpen, setIsCapabilityOpen] = useState(false)
  const groupLoadRef = useRef<Promise<boolean> | null>(null)
  const mode = location.pathname === '/group' ? 'group' : 'home'

  const prepareGroup = useCallback(() => {
    groupLoadRef.current ??= loadGroupPage()
      .then(() => {
        setGroupReady(true)
        return new Promise<boolean>((resolve) => {
          requestAnimationFrame(() => resolve(true))
        })
      })
      .catch(() => {
        groupLoadRef.current = null
        return false
      })

    return groupLoadRef.current
  }, [])

  useEffect(() => {
    if (!directGroupSession) void prepareGroup()
  }, [directGroupSession, prepareGroup])

  if (directGroupSession && mode === 'group') {
    return (
      <Suspense fallback={<ConceptLoading />}>
        <GroupPage />
      </Suspense>
    )
  }

  return (
    <GroupSwipeEntry
      ref={swipeRef}
      disabled={isCapabilityOpen}
      groupContent={
        groupReady ? (
          <Suspense fallback={null}>
            <GroupPage entryPresentation={mode === 'group' ? 'active' : 'staged'} />
          </Suspense>
        ) : null
      }
      groupReady={groupReady}
      homeContent={
        mode === 'home' ? (
          <Suspense fallback={<ConceptLoading />}>
            <HomepagePage
              onCapabilityOpenChange={setIsCapabilityOpen}
              onGroupNavigate={() => swipeRef.current?.enterGroup()}
            />
          </Suspense>
        ) : null
      }
      mode={mode}
      onComplete={() => navigate('/group')}
      onPrepareGroup={prepareGroup}
    />
  )
}
