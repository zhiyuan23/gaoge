type GroupPageModule = typeof import('@/pages/group/GroupPage')

let groupPagePromise: Promise<GroupPageModule> | null = null

export function loadGroupPage() {
  groupPagePromise ??= import('@/pages/group/GroupPage').catch((error: unknown) => {
    groupPagePromise = null
    throw error
  })
  return groupPagePromise
}
