import type { Memo, MemoComment, MemoInfo } from '../../types.ts'
import { getMemosPageSize } from '../env.ts'
import * as cache from './cache.ts'
import { buildMemoInfo, parseComment, parseMemo } from './parse.ts'
import { formatFileSize, getMemoPublicUrl, getOpenStreetMapUrl, groupAttachments } from './render.ts'

export async function getMemosInfo(params: { pageToken?: string, q?: string } = {}): Promise<MemoInfo> {
  const pageSize = getMemosPageSize()
  const instance = await cache.getCachedInstanceProfile()
  const queryParams = { pageSize, pageToken: params.pageToken }
  const response = params.q
    ? await cache.getCachedSearchMemos(params.q, queryParams)
    : await cache.getCachedListMemos(queryParams)
  return buildMemoInfo(response, instance.instanceUrl)
}

export async function getMemoById(id: string): Promise<{ memo: Memo, comments: MemoComment[] }> {
  const [rawMemo, rawComments] = await Promise.all([
    cache.getCachedGetMemo(id),
    cache.getCachedListComments(id, { pageSize: 100 }),
  ])
  const memo = parseMemo(rawMemo)
  const comments = (rawComments.memos || []).map(parseComment)
  return { memo, comments }
}

export async function getMemoComments(id: string): Promise<MemoComment[]> {
  const response = await cache.getCachedListComments(id, { pageSize: 100 })
  return (response.memos || []).map(parseComment)
}

export {
  formatFileSize,
  getMemoPublicUrl,
  getOpenStreetMapUrl,
  groupAttachments,
}
