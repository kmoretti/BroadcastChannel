import { defineCachedFunction } from 'ocache'
import * as api from './api.ts'

const cacheOptions = { maxAge: 60 * 5 }

export const getCachedListMemos = defineCachedFunction(api.listMemos, {
  ...cacheOptions,
  getKey: (params: Parameters<typeof api.listMemos>[0]) => `memos:list:${JSON.stringify(params)}`,
})

export const getCachedGetMemo = defineCachedFunction(api.getMemo, {
  ...cacheOptions,
  getKey: (id: string) => `memos:${id}`,
})

export const getCachedSearchMemos = defineCachedFunction(api.searchMemos, {
  ...cacheOptions,
  getKey: (q: string, params: Parameters<typeof api.searchMemos>[1]) => `memos:search:${q}:${JSON.stringify(params)}`,
})

export const getCachedListComments = defineCachedFunction(api.listComments, {
  ...cacheOptions,
  getKey: (id: string, params: Parameters<typeof api.listComments>[1]) => `memos:comments:${id}:${JSON.stringify(params)}`,
})

export const getCachedInstanceProfile = defineCachedFunction(api.getInstanceProfile, {
  ...cacheOptions,
  getKey: () => 'memos:instance:profile',
})
