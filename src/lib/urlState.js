export function getUrlState() {
  const params = new URLSearchParams(window.location.search)
  const projectId = String(params.get('project') || '').trim() || null
  const nodeId = String(params.get('node') || '').trim() || null
  const x = Number(params.get('x'))
  const y = Number(params.get('y'))
  const scale = Number(params.get('z'))
  return {
    projectId,
    nodeId,
    transform: {
      x: Number.isFinite(x) ? x : 80,
      y: Number.isFinite(y) ? y : 80,
      scale: Number.isFinite(scale) ? Math.max(0.1, Math.min(10, scale)) : 1,
    },
  }
}

export function updateUrlState(projectId, nodeId, transform) {
  const url = new URL(window.location.href)
  if (projectId) {
    url.searchParams.set('project', String(projectId))
  } else {
    url.searchParams.delete('project')
  }
  if (nodeId) {
    url.searchParams.set('node', String(nodeId))
  } else if (!projectId) {
    url.searchParams.delete('node')
  }
  if (transform) {
    url.searchParams.set('x', String(Math.round(transform.x)))
    url.searchParams.set('y', String(Math.round(transform.y)))
    url.searchParams.set('z', transform.scale.toFixed(3))
  } else {
    url.searchParams.delete('x')
    url.searchParams.delete('y')
    url.searchParams.delete('z')
  }
  window.history.replaceState({}, '', url)
}

