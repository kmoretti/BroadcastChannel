import type { SiteInfo } from './memos/instance.ts'
import { describe, expect, it } from 'vitest'
import { getSiteMeta } from './seo.ts'

describe('site meta', () => {
  it('returns meta fields from site info', () => {
    const site: SiteInfo = {
      title: 'Site title',
      description: 'Site description',
      avatar: 'https://example.com/avatar.png',
      instanceUrl: 'https://memos.example/',
    }

    expect(getSiteMeta(site)).toEqual({
      title: 'Site title',
      description: 'Site description',
      image: 'https://example.com/avatar.png',
      url: 'https://memos.example/',
    })
  })
})
