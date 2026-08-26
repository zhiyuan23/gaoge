import type { SystemResource } from '@/api/system/resource'

export interface SystemResourceModuleGroup {
  code: string
  label: string
  resources: SystemResource[]
}

export type SystemResourceTreeNode =
  | {
      kind: 'module'
      id: `module:${string}`
      label: string
      code: string
      icon: string
      children: SystemResourceTreeNode[]
    }
  | {
      kind: 'resource'
      id: number
      label: string
      code: string
      icon: string
      resource: SystemResource
    }

const labels: Record<string, string> = {
  content: '内容资源',
  football: '足球资源',
  system: '系统资源',
}

const moduleIcons: Record<string, string> = {
  content: 'i-ri:article-line',
  football: 'i-solar:cup-star-outline',
  system: 'i-ri:settings-3-line',
}

const resourceIcons: Record<string, string> = {
  'content.banner': 'i-ri:slideshow-3-line',
  'content.rumorPost': 'i-ri:message-3-line',
  'football.assetRecord': 'i-ri:wallet-3-line',
  'football.fund': 'i-ri:funds-line',
  'football.matchRound': 'i-ri:calendar-event-line',
  'football.player': 'i-ri:user-star-line',
  'football.team': 'i-ri:team-line',
  'system.audit': 'i-ri:file-search-line',
  'system.menu': 'i-ri:menu-line',
  'system.permission': 'i-ri:key-2-line',
  'system.role': 'i-ri:shield-user-line',
  'system.user': 'i-ri:user-line',
}

export function getSystemResourceModuleLabel(code: string) {
  return labels[code] ?? code
}

export function getSystemResourceModuleIcon(code: string) {
  return moduleIcons[code] ?? 'i-ri:folder-3-line'
}

export function getSystemResourceIcon(key: string) {
  return resourceIcons[key] ?? 'i-ri:stack-line'
}

export function groupSystemResources(
  resources: readonly SystemResource[],
): SystemResourceModuleGroup[] {
  const groups = new Map<string, SystemResource[]>()
  for (const resource of resources) {
    groups.set(resource.module, [...(groups.get(resource.module) ?? []), resource])
  }
  return [...groups.entries()].map(([code, items]) => ({
    code,
    label: getSystemResourceModuleLabel(code),
    resources: items,
  }))
}

export function buildSystemResourceTree(
  resources: readonly SystemResource[],
): SystemResourceTreeNode[] {
  return groupSystemResources(resources).map(({ code, label, resources: groupedResources }) => ({
    kind: 'module',
    id: `module:${code}`,
    label,
    code,
    icon: getSystemResourceModuleIcon(code),
    children: groupedResources.map((resource) => ({
      kind: 'resource',
      id: resource.id,
      label: resource.name,
      code: resource.key,
      icon: getSystemResourceIcon(resource.key),
      resource,
    })),
  }))
}
