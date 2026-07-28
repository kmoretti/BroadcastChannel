import type { SiteInfo } from './memos/instance.ts'
import { describe, expect, it } from 'vitest'
import { getSiteMeta } from './seo.ts'

describe('site meta', () => {
  it('returns meta fields from site info', () => {
    const site: SiteInfo = {
      title: 'Site title',
      description: 'Site description',
      avatar: 'https://example.com/avatar.png',
      logo: undefined,
      instanceUrl: 'https://memos.example/',
      introHtml: '',
      social: {},
    }

    expect(getSiteMeta(site)).toEqual({
      title: 'Site title',
      description: 'Site description',
      image: 'https://example.com/avatar.png',
      url: 'https://memos.example/',
    })
  })
})
