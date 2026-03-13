export async function api(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Request failed')
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

      reject(new Error(request.response?.error || 'Request failed'))
    }

    request.onerror = () => {
      reject(new Error('Network request failed'))
    }

    request.send(formData)
  })
}

