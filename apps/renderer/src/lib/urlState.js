export function getUrlState() {
  const params = new URLSearchParams(window.location.search)
  const projectId = String(params.get('project') || '').trim() || null
  const nodeId = String(params.get('node') || '').trim() || null
  return {
    projectId,
    nodeId,
  }
}

export function updateUrlState(projectId, nodeId) {
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
  window.history.replaceState({}, '', url)
}

