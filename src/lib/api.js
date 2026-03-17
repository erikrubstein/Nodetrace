export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new ApiError(payload.error || 'Request failed', response.status, payload)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', url)
    request.responseType = 'json'
    request.withCredentials = true

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        onProgress?.(null)
        return
      }

      onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    }

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response)
        return
      }

      reject(new ApiError(request.response?.error || 'Request failed', request.status, request.response))
    }

    request.onerror = () => {
      reject(new ApiError('Network request failed', 0))
    }

    request.send(formData)
  })
}

