import type { SystemMenu } from '@/api/system/menu'

export type SystemMenuTreeNode = SystemMenu

export function flattenSystemMenuTree(nodes: readonly SystemMenu[]): SystemMenu[] {
  return nodes.flatMap((node) => [node, ...flattenSystemMenuTree(node.children ?? [])])
}

function filterNode(node: SystemMenu, query: string): SystemMenu | undefined {
  const children = (node.children ?? [])
    .map((child) => filterNode(child, query))
    .filter((child): child is SystemMenu => Boolean(child))
  const matches = [node.title, node.name, node.path, node.routeName].some((value) =>
    (value ?? '').toLocaleLowerCase().includes(query),
  )
  if (!matches && children.length === 0) return undefined
  return { ...node, children }
}

export function filterSystemMenuTree(nodes: readonly SystemMenu[], search: string): SystemMenu[] {
  const query = search.trim().toLocaleLowerCase()
  if (!query) return nodes.map((node) => ({ ...node }))
  return nodes
    .map((node) => filterNode(node, query))
    .filter((node): node is SystemMenu => Boolean(node))
}
