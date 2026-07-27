import type { Memo, MemoAttachment, MemoComment, MemoCreator, MemoInfo, MemoReaction } from '../../types.ts'
import type { MemoItem, MemosAttachment, MemosReaction } from './types.ts'
import { getMemosCreators } from '../env.ts'
import { renderMarkdown } from './markdown.ts'

function parseAttachment(a: MemosAttachment): MemoAttachment {
  return {
    name: a.name,
    filename: a.filename,
    externalLink: a.externalLink,
    type: a.type,
    size: a.size,
  }
}

function aggregateReactions(reactions: MemosReaction[]): MemoReaction[] {
  const map = new Map<string, number>()
  for (const r of reactions) {
    map.set(r.reactionType, (map.get(r.reactionType) || 0) + 1)
  }
  return Array.from(map.entries()).map(([reactionType, count]) => ({ reactionType, count }))
}

function parseCreator(creatorName: string): MemoCreator {
  const username = creatorName.replace(/^users\//, '')
  return { name: creatorName, username }
}

export function parseMemo(item: MemoItem): Memo {
  const shortId = item.name.replace(/^memos\//, '')
  return {
    id: item.name,
    shortId,
    state: item.state,
    creator: parseCreator(item.creator),
    createTime: item.createTime,
    updateTime: item.updateTime,
    content: item.content,
    html: renderMarkdown(item.content),
    visibility: item.visibility,
    tags: item.tags || [],
    pinned: item.pinned || false,
    attachments: (item.attachments || []).map(parseAttachment),
    reactions: aggregateReactions(item.reactions || []),
    location: item.location?.placeholder ? item.location : undefined,
    property: item.property || { hasLink: false, hasTaskList: false, hasCode: false, hasIncompleteTasks: false, title: '' },
    snippet: item.snippet || item.content.slice(0, 200),
  }
}

export function parseComment(item: MemoItem): MemoComment {
  return {
    ...parseMemo(item),
    parent: item.parent || '',
  }
}

export function filterByCreators(memos: Memo[]): Memo[] {
  const creators = getMemosCreators()
  if (creators.length === 0)
    return memos
  return memos.filter(m => creators.includes(m.creator.username))
}

export function buildMemoInfo(response: { memos: MemoItem[], nextPageToken?: string }, instanceUrl: string): MemoInfo {
  const allMemos = response.memos.map(parseMemo)
  const filtered = filterByCreators(allMemos)
  return {
    memos: filtered,
    instanceUrl,
    nextPageToken: response.nextPageToken,
  }
}
