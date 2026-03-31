export function isDesktopEnvironment() {
  return Boolean(window.nodetraceDesktop?.isElectron)
}

export function openDesktopPanelWindow({ panelId, projectId = null, nodeId = null }) {
  if (!isDesktopEnvironment()) {
    return Promise.resolve({ ok: false })
  }

  return window.nodetraceDesktop.openWindow({
    panelId,
    projectId,
    nodeId,
  })
}

export function closeDesktopWindow() {
  return window.nodetraceDesktop?.closeWindow?.()
}

export function minimizeDesktopWindow() {
  return window.nodetraceDesktop?.minimizeWindow?.()
}

export function toggleMaximizeDesktopWindow() {
  return window.nodetraceDesktop?.toggleMaximizeWindow?.()
}

export function getDesktopWindowState() {
  return window.nodetraceDesktop?.getWindowState?.() || Promise.resolve({ maximized: false })
}

export function subscribeDesktopWindowState(callback) {
  return window.nodetraceDesktop?.onWindowStateChange?.(callback) || (() => {})
}

export function getDesktopServerState() {
  return window.nodetraceDesktop?.getServerState?.() || Promise.resolve({
    profiles: [],
    selectedProfileId: null,
    proxyBaseUrl: '',
  })
}

export function createDesktopServerProfile(profile) {
  return window.nodetraceDesktop?.createServerProfile?.(profile) || Promise.resolve(null)
}

export function updateDesktopServerProfile(id, profile) {
  return window.nodetraceDesktop?.updateServerProfile?.(id, profile) || Promise.resolve(null)
}

export function deleteDesktopServerProfile(id) {
  return window.nodetraceDesktop?.deleteServerProfile?.(id) || Promise.resolve(null)
}

export function selectDesktopServerProfile(id) {
  return window.nodetraceDesktop?.selectServerProfile?.(id) || Promise.resolve(null)
}

export function subscribeDesktopServerState(callback) {
  return window.nodetraceDesktop?.onServerStateChange?.(callback) || (() => {})
}
