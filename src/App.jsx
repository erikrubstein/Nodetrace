import { useEffect, useState } from 'react'
import './App.css'

const emptyProjectForm = { name: '', description: '' }
const emptyFolderForm = { name: '', notes: '', tags: '' }
const emptyPhotoForm = { name: '', notes: '', tags: '', file: null }

async function api(url, options = {}) {
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

function depthSize(depth) {
  if (depth === 0) return 240
  if (depth === 1) return 190
  if (depth === 2) return 150
  if (depth === 3) return 118
  return 96
}

function countLeaves(node) {
  if (!node.children?.length) {
    return 1
  }

  return node.children.reduce((sum, child) => sum + countLeaves(child), 0)
}

function buildMapLayout(root) {
  if (!root) {
    return { items: [], width: 1200, height: 600 }
  }

  const items = []
  const leafGap = 260
  const levelGap = 260
  const topPadding = 48

  function visit(node, depth, left) {
    const leaves = countLeaves(node)
    const width = leaves * leafGap
    const size = depthSize(depth)
    const height = node.type === 'photo' ? size * 0.9 : size * 0.58
    const centerX = left + width / 2
    const centerY = topPadding + depth * levelGap

    items.push({
      id: node.id,
      parentId: node.parent_id,
      depth,
      centerX,
      centerY,
      left: centerX - size / 2,
      top: centerY - height / 2,
      width: size,
      height,
      node,
    })

    let childLeft = left
    for (const child of node.children) {
      const childLeaves = countLeaves(child)
      visit(child, depth + 1, childLeft)
      childLeft += childLeaves * leafGap
    }
  }

  visit(root, 0, 48)
  const maxDepth = items.reduce((max, item) => Math.max(max, item.depth), 0)
  const totalLeaves = countLeaves(root)

  return {
    items,
    width: totalLeaves * leafGap + 96,
    height: topPadding + maxDepth * levelGap + 320,
  }
}

function collectFolderOptions(root, blockedIds) {
  if (!root) {
    return []
  }

  const folders = []

  function visit(node, depth) {
    if (node.type === 'folder' && !blockedIds.has(node.id)) {
      folders.push({
        id: node.id,
        label: `${'  '.repeat(depth)}${node.name}`,
      })
    }

    for (const child of node.children || []) {
      visit(child, depth + 1)
    }
  }

  visit(root, 0)
  return folders
}

function collectDescendantIds(node) {
  const ids = new Set()

  function visit(current) {
    ids.add(current.id)
    for (const child of current.children || []) {
      visit(child)
    }
  }

  if (node) {
    visit(node)
  }

  return ids
}

function TreeNode({ node, selectedId, onSelect }) {
  return (
    <li>
      <button
        className={`tree-node ${selectedId === node.id ? 'selected' : ''}`}
        onClick={() => onSelect(node.id)}
        type="button"
      >
        <span className="tree-node__icon">{node.type === 'folder' ? 'F' : 'P'}</span>
        <span>{node.name}</span>
      </button>
      {node.children?.length > 0 ? (
        <ul className="tree-list">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [tree, setTree] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [folderForm, setFolderForm] = useState(emptyFolderForm)
  const [photoForm, setPhotoForm] = useState(emptyPhotoForm)
  const [editForm, setEditForm] = useState({ name: '', notes: '', tags: '' })
  const [moveTargetId, setMoveTargetId] = useState('')
  const [status, setStatus] = useState('Loading projects...')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadInputKey, setUploadInputKey] = useState(0)

  async function loadProjects(preferredProjectId) {
    const projectList = await api('/api/projects')
    setProjects(projectList)

    if (projectList.length === 0) {
      setSelectedProjectId(null)
      setTree(null)
      setSelectedNodeId(null)
      setStatus('Create your first project to begin building a photo hierarchy.')
      return
    }

    const nextId =
      preferredProjectId && projectList.some((project) => project.id === preferredProjectId)
        ? preferredProjectId
        : selectedProjectId && projectList.some((project) => project.id === selectedProjectId)
          ? selectedProjectId
          : projectList[0].id

    setSelectedProjectId(nextId)
    setStatus('')
  }

  async function loadTree(projectId, preferredNodeId) {
    if (!projectId) {
      return
    }

    const payload = await api(`/api/projects/${projectId}/tree`)
    setTree(payload)

    const nextSelectedId =
      preferredNodeId && payload.nodes.some((node) => node.id === preferredNodeId)
        ? preferredNodeId
        : payload.root?.id ?? null

    setSelectedNodeId(nextSelectedId)
  }

  useEffect(() => {
    async function initialize() {
      try {
        const projectList = await api('/api/projects')
        setProjects(projectList)

        if (projectList.length === 0) {
          setSelectedProjectId(null)
          setTree(null)
          setSelectedNodeId(null)
          setStatus('Create your first project to begin building a photo hierarchy.')
          return
        }

        setSelectedProjectId(projectList[0].id)
        setStatus('')
      } catch (loadError) {
        setError(loadError.message)
        setStatus('Unable to load projects.')
      }
    }

    initialize()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      return
    }

    loadTree(selectedProjectId).catch((loadError) => {
      setError(loadError.message)
    })
  }, [selectedProjectId])

  const selectedNode = tree?.nodes.find((node) => node.id === selectedNodeId) || null
  const selectedTreeNode = selectedNodeId ? findNode(tree?.root, selectedNodeId) : null
  const mapLayout = buildMapLayout(tree?.root)
  const blockedMoveIds = collectDescendantIds(selectedTreeNode)
  const folderOptions = collectFolderOptions(tree?.root, blockedMoveIds)

  useEffect(() => {
    if (!selectedNode) {
      setEditForm({ name: '', notes: '', tags: '' })
      setMoveTargetId('')
      return
    }

    setEditForm({
      name: selectedNode.name,
      notes: selectedNode.notes || '',
      tags: (selectedNode.tags || []).join(', '),
    })
    setMoveTargetId(selectedNode.parent_id ?? '')
  }, [selectedNode])

  async function refresh(projectId = selectedProjectId, preferredNodeId = selectedNodeId) {
    await loadProjects(projectId)
    await loadTree(projectId, preferredNodeId)
  }

  async function handleCreateProject(event) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const created = await api('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      })

      setProjectForm(emptyProjectForm)
      await loadProjects(created.project.id)
      setTree(created)
      setSelectedNodeId(created.root.id)
      setStatus('')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateFolder(event) {
    event.preventDefault()
    if (!selectedNode || selectedNode.type !== 'folder') {
      setError('Select a folder before adding children.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const created = await api(`/api/projects/${selectedProjectId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: selectedNode.id,
          ...folderForm,
        }),
      })

      setFolderForm(emptyFolderForm)
      await refresh(selectedProjectId, created.id)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUploadPhoto(event) {
    event.preventDefault()
    if (!selectedNode || selectedNode.type !== 'folder') {
      setError('Select a folder before uploading photos.')
      return
    }

    if (!photoForm.file) {
      setError('Choose a photo to upload.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('parentId', selectedNode.id)
      formData.append('name', photoForm.name)
      formData.append('notes', photoForm.notes)
      formData.append('tags', photoForm.tags)
      formData.append('file', photoForm.file)

      const created = await api(`/api/projects/${selectedProjectId}/photos`, {
        method: 'POST',
        body: formData,
      })

      setPhotoForm(emptyPhotoForm)
      setUploadInputKey((key) => key + 1)
      await refresh(selectedProjectId, created.id)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveDetails(event) {
    event.preventDefault()
    if (!selectedNode) {
      return
    }

    setBusy(true)
    setError('')

    try {
      await api(`/api/nodes/${selectedNode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      await refresh(selectedProjectId, selectedNode.id)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleMoveNode(event) {
    event.preventDefault()
    if (!selectedNode || !moveTargetId || Number(moveTargetId) === selectedNode.parent_id) {
      return
    }

    setBusy(true)
    setError('')

    try {
      await api(`/api/nodes/${selectedNode.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: Number(moveTargetId) }),
      })

      await refresh(selectedProjectId, selectedNode.id)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteNode() {
    if (!selectedNode || selectedNode.parent_id == null) {
      return
    }

    const confirmed = window.confirm(`Delete "${selectedNode.name}" and all of its children?`)
    if (!confirmed) {
      return
    }

    setBusy(true)
    setError('')

    try {
      const parentId = selectedNode.parent_id
      await api(`/api/nodes/${selectedNode.id}`, { method: 'DELETE' })
      await refresh(selectedProjectId, parentId)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="panel">
          <p className="eyebrow">Projects</p>
          <h1>PhotoMap</h1>
          <p className="muted">
            Organize cabinet, box, and board photos as a navigable hierarchy.
          </p>
          <div className="project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                className={`project-chip ${selectedProjectId === project.id ? 'selected' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
                type="button"
              >
                <span>{project.name}</span>
                <small>{project.node_count} nodes</small>
              </button>
            ))}
          </div>
        </div>

        <form className="panel form-panel" onSubmit={handleCreateProject}>
          <p className="eyebrow">New Project</p>
          <label>
            <span>Name</span>
            <input
              value={projectForm.name}
              onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
              placeholder="Solar inverter site"
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm({ ...projectForm, description: event.target.value })
              }
              placeholder="Optional project notes"
              rows="3"
            />
          </label>
          <button disabled={busy} type="submit">
            Create project
          </button>
        </form>

        <div className="panel tree-panel">
          <p className="eyebrow">Structure</p>
          {tree?.root ? (
            <ul className="tree-list">
              <TreeNode node={tree.root} selectedId={selectedNodeId} onSelect={setSelectedNodeId} />
            </ul>
          ) : (
            <p className="muted">{status}</p>
          )}
        </div>
      </aside>

      <main className="workspace">
        <section className="panel workspace-header">
          <div>
            <p className="eyebrow">Explorer</p>
            <h2>{tree?.project?.name || 'No project selected'}</h2>
          </div>
          <div className="header-meta">
            <span>{tree?.nodes?.length || 0} total nodes</span>
            {selectedNode ? <span>Selected: {selectedNode.name}</span> : null}
          </div>
        </section>

        {error ? <section className="banner error">{error}</section> : null}

        <section className="map-panel">
          {tree?.root ? (
            <div className="map-scroll">
              <div
                className="map-canvas"
                style={{ width: `${mapLayout.width}px`, height: `${mapLayout.height}px` }}
              >
                <svg className="map-lines" width={mapLayout.width} height={mapLayout.height}>
                  {mapLayout.items.map((item) => {
                    if (!item.parentId) {
                      return null
                    }

                    const parent = mapLayout.items.find((candidate) => candidate.id === item.parentId)
                    if (!parent) {
                      return null
                    }

                    return (
                      <line
                        key={`${item.id}-${item.parentId}`}
                        x1={parent.centerX}
                        y1={parent.centerY + parent.height / 2}
                        x2={item.centerX}
                        y2={item.centerY - item.height / 2}
                      />
                    )
                  })}
                </svg>

                {mapLayout.items.map((item) => (
                  <button
                    key={item.id}
                    className={`map-node type-${item.node.type} ${
                      selectedNodeId === item.id ? 'selected' : ''
                    }`}
                    style={{
                      left: `${item.left}px`,
                      top: `${item.top}px`,
                      width: `${item.width}px`,
                      minHeight: `${item.height}px`,
                    }}
                    onClick={() => setSelectedNodeId(item.id)}
                    type="button"
                  >
                    {item.node.type === 'photo' && item.node.imageUrl ? (
                      <img src={item.node.imageUrl} alt={item.node.name} />
                    ) : (
                      <div className="folder-face">{item.node.name.slice(0, 1).toUpperCase()}</div>
                    )}
                    <span>{item.node.name}</span>
                    <small>{item.node.type}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="map-empty">{status}</div>
          )}
        </section>
      </main>

      <aside className="inspector">
        <div className="panel detail-panel">
          <p className="eyebrow">Selection</p>
          {selectedNode ? (
            <>
              <h3>{selectedNode.name}</h3>
              <p className="muted">
                {selectedNode.type === 'folder' ? 'Folder' : 'Photo'} node
                {selectedNode.parent_id == null ? ' | project root' : ''}
              </p>
              {selectedNode.imageUrl ? (
                <img className="detail-image" src={selectedNode.imageUrl} alt={selectedNode.name} />
              ) : null}
            </>
          ) : (
            <p className="muted">Select a node to inspect or edit it.</p>
          )}
        </div>

        <form className="panel form-panel" onSubmit={handleSaveDetails}>
          <p className="eyebrow">Edit Node</p>
          <label>
            <span>Name</span>
            <input
              disabled={!selectedNode || busy}
              value={editForm.name}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
            />
          </label>
          <label>
            <span>Tags</span>
            <input
              disabled={!selectedNode || busy}
              value={editForm.tags}
              onChange={(event) => setEditForm({ ...editForm, tags: event.target.value })}
              placeholder="front, cabinet-a, pcb"
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              disabled={!selectedNode || busy}
              value={editForm.notes}
              onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })}
              rows="4"
            />
          </label>
          <button disabled={!selectedNode || busy} type="submit">
            Save details
          </button>
        </form>

        <form className="panel form-panel" onSubmit={handleMoveNode}>
          <p className="eyebrow">Move Node</p>
          <label>
            <span>New parent folder</span>
            <select
              disabled={!selectedNode || selectedNode.parent_id == null || busy}
              value={moveTargetId}
              onChange={(event) => setMoveTargetId(event.target.value)}
            >
              <option value="">Choose folder</option>
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!selectedNode || selectedNode.parent_id == null || !moveTargetId || busy}
            type="submit"
          >
            Move node
          </button>
          <button
            className="danger"
            disabled={!selectedNode || selectedNode.parent_id == null || busy}
            onClick={handleDeleteNode}
            type="button"
          >
            Delete subtree
          </button>
        </form>

        <form className="panel form-panel" onSubmit={handleCreateFolder}>
          <p className="eyebrow">Add Folder</p>
          <label>
            <span>Parent</span>
            <input
              disabled
              value={
                selectedNode?.type === 'folder'
                  ? selectedNode.name
                  : 'Select a folder to add children'
              }
            />
          </label>
          <label>
            <span>Name</span>
            <input
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              value={folderForm.name}
              onChange={(event) => setFolderForm({ ...folderForm, name: event.target.value })}
              placeholder="Cabinet A"
            />
          </label>
          <label>
            <span>Tags</span>
            <input
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              value={folderForm.tags}
              onChange={(event) => setFolderForm({ ...folderForm, tags: event.target.value })}
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              value={folderForm.notes}
              onChange={(event) => setFolderForm({ ...folderForm, notes: event.target.value })}
              rows="3"
            />
          </label>
          <button disabled={!selectedNode || selectedNode.type !== 'folder' || busy} type="submit">
            Add folder
          </button>
        </form>

        <form className="panel form-panel" onSubmit={handleUploadPhoto}>
          <p className="eyebrow">Upload Photo</p>
          <label>
            <span>Name</span>
            <input
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              value={photoForm.name}
              onChange={(event) => setPhotoForm({ ...photoForm, name: event.target.value })}
              placeholder="Cabinet A front"
            />
          </label>
          <label>
            <span>Tags</span>
            <input
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              value={photoForm.tags}
              onChange={(event) => setPhotoForm({ ...photoForm, tags: event.target.value })}
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              value={photoForm.notes}
              onChange={(event) => setPhotoForm({ ...photoForm, notes: event.target.value })}
              rows="3"
            />
          </label>
          <label>
            <span>Image file</span>
            <input
              key={uploadInputKey}
              accept="image/*"
              disabled={!selectedNode || selectedNode.type !== 'folder' || busy}
              onChange={(event) =>
                setPhotoForm({
                  ...photoForm,
                  file: event.target.files?.[0] || null,
                })
              }
              type="file"
            />
          </label>
          <button disabled={!selectedNode || selectedNode.type !== 'folder' || busy} type="submit">
            Upload photo
          </button>
        </form>
      </aside>
    </div>
  )
}

function findNode(node, targetId) {
  if (!node) {
    return null
  }

  if (node.id === targetId) {
    return node
  }

  for (const child of node.children || []) {
    const result = findNode(child, targetId)
    if (result) {
      return result
    }
  }

  return null
}

export default App
