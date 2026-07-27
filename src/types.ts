export interface MemoCreator {
  name: string
  username: string
  displayName?: string
  avatarUrl?: string
}

export interface MemoAttachment {
  name: string
  filename: string
  externalLink: string
  type: string
  size: string
}

export interface MemoReaction {
  reactionType: string
  count: number
}

export interface MemoLocation {
  placeholder: string
  latitude: number
  longitude: number
}

export interface Memo {
  id: string
  shortId: string
  state: string
  creator: MemoCreator
  createTime: string
  updateTime: string
  content: string
  html: string
  visibility: string
  tags: string[]
  pinned: boolean
  attachments: MemoAttachment[]
  reactions: MemoReaction[]
  location?: MemoLocation
  property: {
    hasLink: boolean
    hasTaskList: boolean
    hasCode: boolean
    hasIncompleteTasks: boolean
    title?: string
  }
  snippet: string
}

export interface MemoComment extends Memo {
  parent: string
}

export interface MemoInfo {
  memos: Memo[]
  instanceUrl: string
  title?: string
  description?: string
  avatar?: string
  nextPageToken?: string
}

export interface FriendLink {
  id: number
  name: string
  link: string
  avatar: string
  description: string
  status: string
  enableRss: boolean
  updatedAt: number
  snapshot?: string
  friendLinkPage?: string
  feed?: string
}

export interface FriendLinkResponse {
  code: number
  message: string
  data: {
    items: FriendLink[]
    total: number
    page: number
    page_size: number
  }
}

export interface NavItem {
  title: string
  href: string
}

export interface SeoMeta {
  title?: string
  text?: string
  noindex?: string | boolean
  nofollow?: string | boolean
}
