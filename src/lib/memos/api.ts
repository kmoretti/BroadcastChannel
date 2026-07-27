import type { GetInstanceProfileResponse, GetUserResponse, ListMemosResponse, MemoItem } from './types.ts'
import { ofetch } from 'ofetch'
import { getMemosApiUrl } from '../env.ts'

function getApiBaseUrl(): string {
  return getMemosApiUrl().replace(/\/$/, '')
}

function memosFetch<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }
  const queryString = params.toString()
  const url = `${getApiBaseUrl()}${path}${queryString ? `?${queryString}` : ''}`
  return ofetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BroadcastChannel-Memos/1.0',
    },
    retry: 2,
    timeout: 15000,
  })
}

export function listMemos(params: { pageSize?: number, pageToken?: string, filter?: string, orderBy?: string } = {}): Promise<ListMemosResponse> {
  return memosFetch<ListMemosResponse>('/memos', {
    pageSize: params.pageSize,
    pageToken: params.pageToken,
    filter: params.filter,
    orderBy: params.orderBy || 'pinned desc, create_time desc',
  })
}

export function getMemo(id: string): Promise<MemoItem> {
  return memosFetch<MemoItem>(`/memos/${id}`)
}

export function searchMemos(q: string, params: { pageSize?: number, pageToken?: string } = {}): Promise<ListMemosResponse> {
  const escaped = q.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')
  const filter = `content.contains('${escaped}') || tags.contains('${escaped}')`
  return listMemos({ ...params, filter })
}

export function listComments(id: string, params: { pageSize?: number, pageToken?: string } = {}): Promise<ListMemosResponse> {
  return memosFetch<ListMemosResponse>(`/memos/${id}/comments`, {
    pageSize: params.pageSize,
    pageToken: params.pageToken,
    orderBy: 'create_time asc',
  })
}

export function listReactions(id: string): Promise<{ reactions: { reactionType: string }[], totalSize: number }> {
  return memosFetch<{ reactions: { reactionType: string }[], totalSize: number }>(`/memos/${id}/reactions`)
}

export function getInstanceProfile(): Promise<GetInstanceProfileResponse> {
  return memosFetch<GetInstanceProfileResponse>('/instance/profile')
}

export function getUser(username: string): Promise<GetUserResponse> {
  return memosFetch<GetUserResponse>(`/users/${username}`)
}
