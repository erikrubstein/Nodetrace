import { useCallback, useEffect, useRef, useState } from 'react'

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return []
  }

  const seen = new Set()
  const nextTags = []
  for (const tag of tags) {
    const normalized = String(tag || '').trim()
    const key = normalized.toLowerCase()
    if (!normalized || seen.has(key)) {
      continue
    }
    seen.add(key)
    nextTags.push(normalized)
  }
  return nextTags
}

export default function useNodeEditing({
  applyNodeUpdate,
  patchNodeRequest,
  pushHistory,
  selectedNode,
  setError,
  setSelectedNodeId,
  tree,
}) {
  const nameInputRef = useRef(null)
  const nodeSaveSequenceRef = useRef(new Map())
  const skipNextAutoSaveSignatureRef = useRef(null)
  const [editTargetId, setEditTargetId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', notes: '', tags: [] })

  const editTargetNode = tree?.nodes.find((node) => node.id === editTargetId) || null

  const buildDraftSignature = useCallback((draft) => {
    if (!draft) {
      return ''
    }
    return JSON.stringify({
      name: String(draft.name || '').trim(),
      notes: String(draft.notes || '').trim(),
      tags: normalizeTags(draft.tags),
    })
  }, [])

  const saveNodeDraft = useCallback(
    async (node, draft, options = {}) => {
      if (!node) {
        return
      }

      const normalizedName = draft.name.trim() || node.name
      const normalizedNotes = draft.notes.trim()
      const normalizedTags = normalizeTags(draft.tags)
      const selectedTags = normalizeTags(node.tags || [])

      if (
        normalizedName === node.name &&
        normalizedNotes === (node.notes || '') &&
        JSON.stringify(normalizedTags) === JSON.stringify(selectedTags)
      ) {
        return
      }

      try {
        const before = {
          name: node.name,
          notes: node.notes || '',
          tags: normalizeTags(node.tags || []),
        }
        const after = {
          name: normalizedName,
          notes: draft.notes,
          tags: normalizedTags,
        }
        if (options.skipNextAutoSave) {
          skipNextAutoSaveSignatureRef.current = buildDraftSignature(after)
        }

        const saveSequence = (nodeSaveSequenceRef.current.get(node.id) || 0) + 1
        nodeSaveSequenceRef.current.set(node.id, saveSequence)
        const updatedNode = await patchNodeRequest(node.id, after, { skipApply: true })
        if (nodeSaveSequenceRef.current.get(node.id) === saveSequence) {
          applyNodeUpdate(updatedNode)
        }
        pushHistory({
          undo: async () => {
            await patchNodeRequest(node.id, before)
            setSelectedNodeId(node.id)
          },
          redo: async () => {
            await patchNodeRequest(node.id, after)
            setSelectedNodeId(node.id)
          },
        })
      } catch (submitError) {
        setError(submitError.message)
      }
    },
    [applyNodeUpdate, buildDraftSignature, patchNodeRequest, pushHistory, setError, setSelectedNodeId],
  )

  useEffect(() => {
    if (!selectedNode || !editTargetNode || selectedNode.id !== editTargetId) {
      return undefined
    }

    const draftSignature = buildDraftSignature(editForm)
    if (skipNextAutoSaveSignatureRef.current === draftSignature) {
      skipNextAutoSaveSignatureRef.current = null
      return undefined
    }

    const timer = window.setTimeout(async () => {
      await saveNodeDraft(editTargetNode, editForm)
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [buildDraftSignature, editForm, editTargetId, editTargetNode, saveNodeDraft, selectedNode])

  return {
    editForm,
    editTargetId,
    editTargetNode,
    nameInputRef,
    saveNodeDraft,
    setEditForm,
    setEditTargetId,
  }
}
