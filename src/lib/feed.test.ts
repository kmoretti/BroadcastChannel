import type { Memo, MemoInfo } from '../types.ts'
import { describe, expect, it } from 'vitest'
import { buildFeedMemos } from './feed.ts'

describe('feed memo builder', () => {
  it('maps memos to feed entries', () => {
    const memos: Memo[] = [{
      id: 'memo-1',
      shortId: 'abc123',
      state: 'NORMAL',
      creator: {
        name: 'user',
        username: 'user',
      },
      createTime: '2026-01-02T03:04:05.000Z',
      updateTime: '2026-01-02T03:04:05.000Z',
      content: 'Hello world',
      html: '<p>Hello world</p>',
      visibility: 'PUBLIC',
      tags: ['tag'],
      pinned: false,
      attachments: [],
      reactions: [],
      property: {
        hasLink: false,
        hasTaskList: false,
        hasCode: false,
        hasIncompleteTasks: false,
        title: 'Memo title',
      },
      snippet: 'Hello world',
    }]

    const info: MemoInfo = {
      memos,
      instanceUrl: 'https://memos.example/',
    }

    const feed = buildFeedMemos(info)

    expect(feed).toHaveLength(1)
    expect(feed[0]).toMatchObject({
      id: 'memo-1',
      title: 'Memo title',
      link: 'https://memos.example/posts/abc123',
      content: '<p>Hello world</p>',
      snippet: 'Hello world',
    })
    expect(feed[0]?.pubDate).toEqual(new Date('2026-01-02T03:04:05.000Z'))
  })

  it('falls back to snippet and short id for title', () => {
    const memos: Memo[] = [{
      id: 'memo-2',
      shortId: 'def456',
      state: 'NORMAL',
      creator: {
        name: 'user',
        username: 'user',
      },
      createTime: '2026-01-02T03:04:05.000Z',
      updateTime: '2026-01-02T03:04:05.000Z',
      content: '',
      html: '',
      visibility: 'PUBLIC',
      tags: [],
      pinned: false,
      attachments: [],
      reactions: [],
      property: {
        hasLink: false,
        hasTaskList: false,
        hasCode: false,
        hasIncompleteTasks: false,
      },
      snippet: '',
    }]

    const info: MemoInfo = {
      memos,
      instanceUrl: 'https://memos.example/',
    }

    const feed = buildFeedMemos(info)

    expect(feed[0]?.title).toBe('Memo def456')
  })
})
