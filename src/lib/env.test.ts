import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getEnv,
  getFriendLinkApiUrl,
  getMemosApiUrl,
  getMemosCreators,
  getMemosPageSize,
} from './env'

describe('getEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefers process.env over import.meta.env', () => {
    vi.stubEnv('TEST_ENV_PRIORITY', 'process-value')

    expect(
      getEnv(
        { TEST_ENV_PRIORITY: 'import-value' },
        'TEST_ENV_PRIORITY',
      ),
    ).toBe('process-value')
  })

  it('prefers an empty process env value over import.meta.env', () => {
    vi.stubEnv('TEST_ENV_PRIORITY', '')

    expect(
      getEnv(
        { TEST_ENV_PRIORITY: 'import-value' },
        'TEST_ENV_PRIORITY',
      ),
    ).toBe('')
  })

  it('falls back to import.meta.env when process env is missing', () => {
    expect(
      getEnv(
        { TEST_ENV_PRIORITY: 'import-value' },
        'TEST_ENV_PRIORITY',
      ),
    ).toBe('import-value')
  })
})

describe('getMemosApiUrl', () => {
  it('defaults to https://mm.2005815.xyz/api/v1', () => {
    expect(getMemosApiUrl({})).toBe('https://mm.2005815.xyz/api/v1')
  })

  it('uses the env override', () => {
    expect(getMemosApiUrl({ MEMOS_API_URL: 'https://custom.example/api/v1' })).toBe(
      'https://custom.example/api/v1',
    )
  })
})

describe('getMemosCreators', () => {
  it('defaults to an empty array', () => {
    expect(getMemosCreators({})).toEqual([])
  })

  it('splits a comma-separated string and trims entries', () => {
    expect(getMemosCreators({ MEMOS_CREATORS: 'alice, bob,, charlie ' })).toEqual([
      'alice',
      'bob',
      'charlie',
    ])
  })
})

describe('getMemosPageSize', () => {
  it('defaults to 20', () => {
    expect(getMemosPageSize({})).toBe(20)
  })

  it('uses the env override', () => {
    expect(getMemosPageSize({ MEMOS_PAGE_SIZE: '50' })).toBe(50)
  })

  it.each([
    ['abc'],
    ['0'],
    ['-5'],
  ])('falls back to 20 for invalid value %j', (value) => {
    expect(getMemosPageSize({ MEMOS_PAGE_SIZE: value })).toBe(20)
  })
})

describe('getFriendLinkApiUrl', () => {
  it('defaults to https://blog-api.2005815.xyz/', () => {
    expect(getFriendLinkApiUrl({})).toBe('https://blog-api.2005815.xyz/')
  })

  it('uses the env override', () => {
    expect(getFriendLinkApiUrl({ FRIEND_LINK_API_URL: 'https://links.example/' })).toBe(
      'https://links.example/',
    )
  })
})
