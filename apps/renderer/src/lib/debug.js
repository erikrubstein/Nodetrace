export function debugEnabled() {
  if (typeof window === 'undefined') {
    return false
  }
  return Boolean(window.__NODETRACE_DEBUG__)
}

export function debugLog(...args) {
  if (!debugEnabled()) {
    return
  }
  console.debug('[Nodetrace]', ...args)
}
