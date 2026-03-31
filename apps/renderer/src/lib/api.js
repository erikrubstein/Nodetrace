export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

let runtimeApiBaseUrl = ''

function isAbsoluteUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(String(value || ''))
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed.replace(/\/+$/, '') : ''
}

export function configureApiBaseUrl(baseUrl) {
  runtimeApiBaseUrl = normalizeBaseUrl(baseUrl)
}

export function resolveApiUrl(url) {
  const value = String(url || '').trim()
  if (!value || isAbsoluteUrl(value)) {
    return value
  }
  if (!runtimeApiBaseUrl) {
    return value
  }
  return new URL(value.replace(/^\//, ''), `${runtimeApiBaseUrl}/`).toString()
}

export async function api(url, options = {}) {
  const response = await fetch(resolveApiUrl(url), {
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
    request.open('POST', resolveApiUrl(url))
    request.responseType = 'json'

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

