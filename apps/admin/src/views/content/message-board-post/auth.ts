export const MESSAGE_BOARD_POST_PERMISSIONS = {
  view: 'content.messageBoardPost.view',
  create: 'content.messageBoardPost.create',
  update: 'content.messageBoardPost.update',
  delete: 'content.messageBoardPost.delete',
  publish: 'content.messageBoardPost.publish',
} as const

export const MESSAGE_BOARD_POST_MANAGE_PERMISSIONS = [
  MESSAGE_BOARD_POST_PERMISSIONS.create,
  MESSAGE_BOARD_POST_PERMISSIONS.update,
  MESSAGE_BOARD_POST_PERMISSIONS.delete,
  MESSAGE_BOARD_POST_PERMISSIONS.publish,
]
