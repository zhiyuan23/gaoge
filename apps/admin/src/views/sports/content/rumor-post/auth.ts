export const RUMOR_POST_PERMISSIONS = {
  view: 'content.rumorPost.view',
  create: 'content.rumorPost.create',
  update: 'content.rumorPost.update',
  delete: 'content.rumorPost.delete',
  publish: 'content.rumorPost.publish',
} as const

export const RUMOR_POST_MANAGE_PERMISSIONS = [
  RUMOR_POST_PERMISSIONS.create,
  RUMOR_POST_PERMISSIONS.update,
  RUMOR_POST_PERMISSIONS.delete,
  RUMOR_POST_PERMISSIONS.publish,
]
