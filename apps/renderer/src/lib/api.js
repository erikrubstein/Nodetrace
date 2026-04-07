export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

let runtimeApiBaseUrl = ''
let desktopConnectionCooldownUntil = 0
const DESKTOP_CONNECTION_COOLDOWN_MS = 2500

function isAbsoluteUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(String(value || ''))
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed.replace(/\/+$/, '') : ''
}

function normalizeApiErrorMessage(message) {
  const value = String(message || '').trim()
  if (!value) {
    return 'Request failed'
  }
  if (/^Desktop proxy request failed/i.test(value)) {
    return 'Unable to reach the selected server profile.'
  }
  if (/^No desktop server selected/i.test(value)) {
    return 'Choose a connected server profile.'
  }
  if (!/[.!?]$/.test(value)) {
    return `${value}.`
  }
  return value
}

function isDesktopConnectionErrorMessage(message) {
  const value = String(message || '').trim()
  return value === 'Unable to reach the selected server profile.' || value === 'Choose a connected server profile.'
}

function shouldShortCircuitDesktopRequest(url) {
  const normalizedUrl = String(url || '').trim()
  return (
    Boolean(runtimeApiBaseUrl) &&
    Boolean(normalizedUrl) &&
    !isAbsoluteUrl(normalizedUrl) &&
    Date.now() < desktopConnectionCooldownUntil
  )
}

function noteDesktopConnectionFailure(message) {
  if (isDesktopConnectionErrorMessage(message)) {
    desktopConnectionCooldownUntil = Date.now() + DESKTOP_CONNECTION_COOLDOWN_MS
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nodetrace:desktop-connection-error', {
          detail: { message },
        }),
      )
    }
  }
}

export function configureApiBaseUrl(baseUrl) {
  runtimeApiBaseUrl = normalizeBaseUrl(baseUrl)
  desktopConnectionCooldownUntil = 0
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
  if (shouldShortCircuitDesktopRequest(url)) {
    throw new ApiError('Unable to reach the selected server profile.', 502)
  }

  let response
  try {
    response = await fetch(resolveApiUrl(url), {
      credentials: 'same-origin',
      ...options,
    })
  } catch (error) {
    const message = normalizeApiErrorMessage(error?.message || 'Network request failed')
    noteDesktopConnectionFailure(message)
    throw new ApiError(message, 0)
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const message = normalizeApiErrorMessage(payload.error || 'Request failed')
    noteDesktopConnectionFailure(message)
    throw new ApiError(message, response.status, payload)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    if (shouldShortCircuitDesktopRequest(url)) {
      reject(new ApiError('Unable to reach the selected server profile.', 502))
      return
    }

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

      const message = normalizeApiErrorMessage(request.response?.error || 'Request failed')
      noteDesktopConnectionFailure(message)

      reject(
        new ApiError(
          message,
          request.status,
          request.response,
        ),
      )
    }

    request.onerror = () => {
      const message = normalizeApiErrorMessage('Network request failed')
      noteDesktopConnectionFailure(message)
      reject(new ApiError(message, 0))
    }

    request.send(formData)
  })
}

