// Room events
export const ROOM_EVENTS = {
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  USER_JOINED: 'room:user-joined',
  USER_LEFT: 'room:user-left',
  PARTICIPANT_UPDATE: 'room:participant-update',
  LOCKED: 'room:locked',
  UNLOCKED: 'room:unlocked',
  USER_REMOVED: 'room:user-removed',
  HOST_TRANSFERRED: 'room:host-transferred',
  SETTINGS_UPDATED: 'room:settings-updated',
  ERROR: 'room:error',
} as const

// Chat events (Phase 3)
export const CHAT_EVENTS = {
  MESSAGE: 'chat:message',
  MESSAGE_EDITED: 'chat:message-edited',
  MESSAGE_DELETED: 'chat:message-deleted',
  REACTION: 'chat:reaction',
  TYPING: 'chat:typing',
  MESSAGE_PINNED: 'chat:message-pinned',
  READ: 'chat:read',
} as const

// Media events (Phase 6)
export const MEDIA_EVENTS = {
  LOAD: 'media:load',
  LOADED: 'media:loaded',
  PLAY: 'media:play',
  PAUSE: 'media:pause',
  SEEK: 'media:seek',
  STATE: 'media:state',
  SYNC: 'media:sync',
  ENDED: 'media:ended',
  REQUEST_SYNC: 'media:request-sync',
} as const

export const PLAYLIST_EVENTS = {
  ADD: 'playlist:add',
  REMOVE: 'playlist:remove',
  REORDER: 'playlist:reorder',
  NEXT: 'playlist:next',
} as const
