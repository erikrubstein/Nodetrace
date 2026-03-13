import { useCallback, useEffect } from 'react'
import { api } from '../lib/api'
import { getUrlState } from '../lib/urlState'

export default function useProjectSync({
  clearHistory,
  desktopClientId,
  pendingLocalEventsRef,
  selectedNode,
  selectedNodeIdRef,
  selectedProjectId,
  setError,
  setMobileConnectionCount,
  setProjects,
  setSelectedNodeId,
  setSelectedProjectId,
  setStatus,
  setTree,
}) {
  const loadProjects = useCallback(
    async (preferredProjectId) => {
      const projectList = await api('/api/projects')
      setProjects(projectList)

      if (projectList.length === 0) {
        setSelectedProjectId(null)
        setTree(null)
        setSelectedNodeId(null)
        setStatus('Create a project to start mapping images.')
        return
      }

      const nextId =
        preferredProjectId && projectList.some((project) => project.id === preferredProjectId)
          ? preferredProjectId
          : projectList[0].id

      setSelectedProjectId(nextId)
      setStatus('')
    },
    [setProjects, setSelectedNodeId, setSelectedProjectId, setStatus, setTree],
  )

  const loadTree = useCallback(
    async (projectId, preferredNodeId) => {
      if (!projectId) {
        return
      }

      const payload = await api(`/api/projects/${projectId}/tree`)
      setTree(payload)
      setSelectedNodeId(
        preferredNodeId && payload.nodes.some((node) => node.id === preferredNodeId)
          ? preferredNodeId
          : payload.root?.id ?? null,
      )
    },
    [setSelectedNodeId, setTree],
  )

  useEffect(() => {
    async function initialize() {
      try {
        await loadProjects(getUrlState().projectId)
      } catch (loadError) {
        setError(loadError.message)
        setStatus('Unable to load projects.')
      }
    }

    void initialize()
  }, [loadProjects, setError, setStatus])

  useEffect(() => {
    clearHistory()
  }, [clearHistory, selectedProjectId])

  useEffect(() => {
    if (!selectedProjectId) {
      return
    }

    const urlState = getUrlState()
    const preferredNodeId = selectedProjectId === urlState.projectId ? urlState.nodeId : null

    loadTree(selectedProjectId, preferredNodeId).catch((loadError) => {
      setError(loadError.message)
    })
  }, [loadTree, selectedProjectId, setError])

  useEffect(() => {
    if (!selectedProjectId || !selectedNode?.id) {
      return undefined
    }

    let cancelled = false

    async function publishSelection() {
      try {
        const payload = await api(`/api/sessions/${desktopClientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProjectId,
            selectedNodeId: selectedNode.id,
          }),
        })
        setMobileConnectionCount(payload.connectionCount || 0)
      } catch (publishError) {
        if (!cancelled) {
          setError(publishError.message)
        }
      }
    }

    void publishSelection()
    const heartbeat = window.setInterval(publishSelection, 15000)

    return () => {
      cancelled = true
      window.clearInterval(heartbeat)
    }
  }, [desktopClientId, selectedNode?.id, selectedProjectId, setError, setMobileConnectionCount])

  useEffect(() => {
    if (!desktopClientId || !selectedProjectId) {
      setMobileConnectionCount(0)
      return undefined
    }

    let cancelled = false

    async function refreshSessionConnections() {
      try {
        const payload = await api(`/api/sessions/${desktopClientId}`)
        if (!cancelled) {
          setMobileConnectionCount(payload.connectionCount || 0)
        }
      } catch {
        if (!cancelled) {
          setMobileConnectionCount(0)
        }
      }
    }

    void refreshSessionConnections()
    const handle = window.setInterval(refreshSessionConnections, 5000)

    return () => {
      cancelled = true
      window.clearInterval(handle)
    }
  }, [desktopClientId, selectedProjectId, setMobileConnectionCount])

  useEffect(() => {
    if (selectedProjectId == null) {
      return undefined
    }

    const stream = new EventSource(`/api/projects/${selectedProjectId}/events`)
    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data || '{}')

      if (payload.type === 'project-deleted') {
        loadProjects().catch((loadError) => {
          setError(loadError.message)
        })
        return
      }

      if (pendingLocalEventsRef.current > 0) {
        pendingLocalEventsRef.current -= 1
        return
      }

      loadTree(selectedProjectId, selectedNodeIdRef.current).catch((loadError) => {
        setError(loadError.message)
      })
    }

    stream.onerror = () => {
      stream.close()
    }

    return () => {
      stream.close()
    }
  }, [loadProjects, loadTree, pendingLocalEventsRef, selectedNodeIdRef, selectedProjectId, setError])

  return {
    loadProjects,
    loadTree,
  }
}
