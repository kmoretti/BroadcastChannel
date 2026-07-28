import type { Memo, MemoComment, MemoInfo } from '../../types.ts'
import { getMemosApiUrl, getMemosPageSize } from '../env.ts'
import * as cache from './cache.ts'
import { enrichCreators } from './creators.ts'
import { inferInstanceUrl } from './instance.ts'
import { buildMemoInfo, parseComment, parseMemo } from './parse.ts'
import { formatFileSize, getMemoPublicUrl, getOpenStreetMapUrl, groupAttachments } from './render.ts'

export async function getMemosInfo(params: { pageSize?: number, pageToken?: string, q?: string } = {}): Promise<MemoInfo> {
  const pageSize = params.pageSize ?? getMemosPageSize()
  const instance = await cache.getCachedInstanceProfile()
  const queryParams = { pageSize, pageToken: params.pageToken }
  const response = params.q
    ? await cache.getCachedSearchMemos(params.q, queryParams)
    : await cache.getCachedListMemos(queryParams)
  const instanceUrl = instance.instanceUrl || inferInstanceUrl(getMemosApiUrl())
  const info = buildMemoInfo(response, instanceUrl)
  await enrichCreators(info.memos, instanceUrl)
  return info
}

function normalizeMemoId(id: string): string {
  return id.replace(/^memos\//, '')
}

export async function getMemoById(id: string): Promise<{ memo: Memo, comments: MemoComment[] }> {
  const normalizedId = normalizeMemoId(id)
  const [rawMemo, rawComments, instance] = await Promise.all([
    cache.getCachedGetMemo(normalizedId),
    cache.getCachedListComments(normalizedId, { pageSize: 100 }),
    cache.getCachedInstanceProfile(),
  ])
  const memo = parseMemo(rawMemo)
  const comments = (rawComments.memos || []).map(parseComment)
  const instanceUrl = instance.instanceUrl || inferInstanceUrl(getMemosApiUrl())
  await enrichCreators([memo, ...comments], instanceUrl)
  return { memo, comments }
}

export async function getMemoComments(id: string): Promise<MemoComment[]> {
  const response = await cache.getCachedListComments(normalizeMemoId(id), { pageSize: 100 })
  return (response.memos || []).map(parseComment)
}

export {
  formatFileSize,
  getMemoPublicUrl,
  getOpenStreetMapUrl,
  groupAttachments,
}
