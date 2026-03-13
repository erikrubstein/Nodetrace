export async function createPreviewFile(file) {
  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = imageUrl
    })

    const maxDimension = 640
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) {
      return null
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'preview'
    return new File([blob], `${baseName}-preview.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export function getContainedRect(containerWidth, containerHeight, sourceWidth, sourceHeight) {
  if (!containerWidth || !containerHeight || !sourceWidth || !sourceHeight) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight }
  }

  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  }
}

export async function blobFromUrl(url) {
  if (!url) {
    return null
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Unable to load image data for undo.')
  }
  return response.blob()
}

