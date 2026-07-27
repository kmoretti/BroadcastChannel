export interface MemosAttachment {
  name: string
  createTime: string
  filename: string
  content: string
  externalLink: string
  type: string
  size: string
  memo: string
  motionMedia: unknown
}

export interface MemosRelation {
  memo: { name: string, snippet: string }
  relatedMemo: { name: string, snippet: string }
  type: string
}

export interface MemosReaction {
  name: string
  creator: string
  contentId: string
  reactionType: string
  createTime: string
}

export interface MemosLocation {
  placeholder: string
  latitude: number
  longitude: number
}

export interface MemosProperty {
  hasLink: boolean
  hasTaskList: boolean
  hasCode: boolean
  hasIncompleteTasks: boolean
  title: string
}

export interface MemoItem {
  name: string
  state: string
  creator: string
  createTime: string
  updateTime: string
  content: string
  visibility: string
  tags: string[]
  pinned: boolean
  attachments: MemosAttachment[]
  relations: MemosRelation[]
  reactions: MemosReaction[]
  property: MemosProperty
  parent: string
  snippet: string
  location: MemosLocation
}

export interface ListMemosResponse {
  memos: MemoItem[]
  nextPageToken: string
}

export interface GetInstanceProfileResponse {
  version: string
  demo: boolean
  instanceUrl: string
  admin?: {
    name: string
    username: string
    displayName: string
    avatarUrl: string
    description: string
  }
  commit: string
}

export interface GetUserResponse {
  name: string
  username: string
  displayName: string
  avatarUrl: string
  description: string
}
