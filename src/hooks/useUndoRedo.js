import { useCallback, useRef, useState } from 'react'

export default function useUndoRedo({ busy, setBusy, setError }) {
  const [historyState, setHistoryState] = useState({ undo: 0, redo: 0 })
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const replayingHistoryRef = useRef(false)

  const updateHistoryCounts = useCallback(() => {
    setHistoryState({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    })
  }, [])

  const pushHistory = useCallback(
    (entry) => {
      if (replayingHistoryRef.current) {
        return
      }

      undoStackRef.current.push(entry)
      if (undoStackRef.current.length > 40) {
        undoStackRef.current.shift()
      }
      redoStackRef.current = []
      updateHistoryCounts()
    },
    [updateHistoryCounts],
  )

  const runHistoryEntry = useCallback(
    async (direction) => {
      const sourceStack = direction === 'undo' ? undoStackRef.current : redoStackRef.current
      const targetStack = direction === 'undo' ? redoStackRef.current : undoStackRef.current
      const entry = sourceStack.pop()
      if (!entry || busy) {
        updateHistoryCounts()
        return
      }

      setBusy(true)
      setError('')
      replayingHistoryRef.current = true
      try {
        if (direction === 'undo') {
          await entry.undo()
        } else {
          await entry.redo()
        }
        targetStack.push(entry)
        updateHistoryCounts()
      } catch (submitError) {
        sourceStack.push(entry)
        updateHistoryCounts()
        setError(submitError.message)
      } finally {
        replayingHistoryRef.current = false
        setBusy(false)
      }
    },
    [busy, setBusy, setError, updateHistoryCounts],
  )

  const undo = useCallback(async () => {
    await runHistoryEntry('undo')
  }, [runHistoryEntry])

  const redo = useCallback(async () => {
    await runHistoryEntry('redo')
  }, [runHistoryEntry])

  const clearHistory = useCallback(() => {
    undoStackRef.current = []
    redoStackRef.current = []
    updateHistoryCounts()
  }, [updateHistoryCounts])

  return {
    clearHistory,
    historyState,
    pushHistory,
    undo,
    redo,
  }
}
