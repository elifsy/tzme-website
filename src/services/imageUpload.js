export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function validateImageFile(file) {
  if (!file || !IMAGE_ACCEPT.split(',').includes(file.type) || file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    const error = new Error('Invalid image type or size')
    error.code = 'INVALID_IMAGE'
    throw error
  }
}

export async function uploadImageFile(file, { signal } = {}) {
  validateImageFile(file)
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/uploads/images', { method: 'POST', body, signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const result = await response.json()
  if (typeof result.url !== 'string' || !/^\/api\/uploads\/images\/[0-9a-f-]{36}\.(jpg|png|gif|webp)$/.test(result.url)) {
    throw new Error('Invalid uploaded image URL')
  }
  return result
}
