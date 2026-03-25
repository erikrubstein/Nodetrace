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
