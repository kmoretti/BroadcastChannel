import type { MemoAttachment, MemoLocation } from '../../types.ts'
import { getMemosApiUrl } from '../env.ts'
import { inferInstanceUrl } from './instance.ts'

export interface GroupedAttachments {
  images: MemoAttachment[]
  videos: MemoAttachment[]
  audios: MemoAttachment[]
  others: MemoAttachment[]
}

export function groupAttachments(attachments: MemoAttachment[]): GroupedAttachments {
  return attachments.reduce((groups, attachment) => {
    const type = attachment.type || ''
    if (type.startsWith('image/')) {
      groups.images.push(attachment)
    }
    else if (type.startsWith('video/')) {
      groups.videos.push(attachment)
    }
    else if (type.startsWith('audio/')) {
      groups.audios.push(attachment)
    }
    else {
      groups.others.push(attachment)
    }
    return groups
  }, { images: [], videos: [], audios: [], others: [] } as GroupedAttachments)
}

export function formatFileSize(size: string): string {
  const bytes = Number.parseInt(size, 10)
  if (Number.isNaN(bytes))
    return size
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getOpenStreetMapUrl(location: MemoLocation): string {
  const { latitude, longitude } = location
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
}

export function getMemoPublicUrl(instanceUrl: string, shortId: string): string {
  const base = (instanceUrl || inferInstanceUrl(getMemosApiUrl())).replace(/\/$/, '')
  return `${base}/memos/${shortId}`
}
