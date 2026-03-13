export default function AppDialogs({
  busy,
  createProject,
  deleteNode,
  deleteNodeOpen,
  deleteProject,
  deleteProjectText,
  desktopClientId,
  exportFileName,
  exportMediaTree,
  exportProject,
  handleDialogEnter,
  hasBulkSelection,
  importArchiveFile,
  importInputRef,
  importProject,
  importProjectName,
  mobileConnectionCount,
  newFolderDialog,
  newFolderName,
  projects,
  selectedNode,
  selectedProjectId,
  sessionDialogOpen,
  setDeleteNodeOpen,
  setDeleteProjectText,
  setExportFileName,
  setImportProjectName,
  setNewFolderDialog,
  setNewFolderName,
  setSessionDialogOpen,
  setShowProjectDialog,
  setShowProjectId,
  showProjectDialog,
  projectName,
  setProjectName,
  submitNewFolder,
  transferProgress,
  tree,
  bulkSelectionCount,
}) {
  return (
    <>
      {showProjectDialog === 'create' ? (
        <div className="dialog-backdrop" onClick={() => setShowProjectDialog(null)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleDialogEnter(event, createProject, Boolean(projectName.trim()) && !busy)}
            role="dialog"
          >
            <div className="dialog__title">Create Project</div>
            <input
              autoFocus
              placeholder="Project name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <div className="dialog__actions">
              <button className="ghost-button" onClick={() => setShowProjectDialog(null)} type="button">
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={busy || !projectName.trim()}
                onClick={createProject}
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showProjectDialog === 'open' ? (
        <div className="dialog-backdrop" onClick={() => setShowProjectDialog(null)} role="presentation">
          <div className="dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="dialog__title">Open Project</div>
            <div className="project-list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={`project-row ${project.id === selectedProjectId ? 'active' : ''}`}
                  onClick={() => {
                    setShowProjectId(project.id)
                    setShowProjectDialog(null)
                  }}
                  type="button"
                >
                  <span>{project.name}</span>
                  <small>{project.node_count} nodes</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {newFolderDialog ? (
        <div className="dialog-backdrop" onClick={() => !busy && setNewFolderDialog(null)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) =>
              handleDialogEnter(
                event,
                () => {
                  void submitNewFolder()
                },
                Boolean(newFolderName.trim()) && !busy,
              )
            }
            role="dialog"
          >
            <div className="dialog__title">New Folder</div>
            <input
              autoFocus
              placeholder="Folder name"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
            />
            <div className="dialog__actions">
              <button className="ghost-button" disabled={busy} onClick={() => setNewFolderDialog(null)} type="button">
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={busy || !newFolderName.trim()}
                onClick={submitNewFolder}
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showProjectDialog === 'export' ? (
        <div className="dialog-backdrop" onClick={() => !busy && setShowProjectDialog(null)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleDialogEnter(event, exportProject, Boolean(selectedProjectId) && !busy)}
            role="dialog"
          >
            <div className="dialog__title">Export Project</div>
            <input
              autoFocus
              placeholder="Archive filename"
              value={exportFileName}
              onChange={(event) => setExportFileName(event.target.value.replace(/\.zip$/i, ''))}
            />
            <div className="inspector__notice">
              File will be saved as {`${exportFileName || tree?.project?.name || 'project'}.zip`}
            </div>
            <progress className="transfer-progress" max="100" value={transferProgress ?? undefined} />
            <div className="dialog__actions">
              <button className="ghost-button" disabled={busy} onClick={() => setShowProjectDialog(null)} type="button">
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={busy || !selectedProjectId}
                onClick={exportProject}
                type="button"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showProjectDialog === 'export-media' ? (
        <div className="dialog-backdrop" onClick={() => !busy && setShowProjectDialog(null)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleDialogEnter(event, exportMediaTree, Boolean(selectedProjectId) && !busy)}
            role="dialog"
          >
            <div className="dialog__title">Export Media Tree</div>
            <input
              autoFocus
              placeholder="Archive filename"
              value={exportFileName}
              onChange={(event) => setExportFileName(event.target.value.replace(/\.zip$/i, ''))}
            />
            <div className="inspector__notice">
              Exports normal folders and full-resolution photos as {`${exportFileName || `${tree?.project?.name || 'project'}-media`}.zip`}
            </div>
            <progress className="transfer-progress" max="100" value={transferProgress ?? undefined} />
            <div className="dialog__actions">
              <button className="ghost-button" disabled={busy} onClick={() => setShowProjectDialog(null)} type="button">
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={busy || !selectedProjectId}
                onClick={exportMediaTree}
                type="button"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showProjectDialog === 'import' ? (
        <div className="dialog-backdrop" onClick={() => !busy && setShowProjectDialog(null)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleDialogEnter(event, importProject, Boolean(importArchiveFile) && !busy)}
            role="dialog"
          >
            <div className="dialog__title">Import Project</div>
            <input
              placeholder="New project name"
              value={importProjectName}
              onChange={(event) => setImportProjectName(event.target.value)}
            />
            <button className="ghost-button" disabled={busy} onClick={() => importInputRef.current?.click()} type="button">
              {importArchiveFile ? importArchiveFile.name : 'Choose Archive'}
            </button>
            <progress className="transfer-progress" max="100" value={transferProgress ?? undefined} />
            <div className="dialog__actions">
              <button className="ghost-button" disabled={busy} onClick={() => setShowProjectDialog(null)} type="button">
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={busy || !importArchiveFile}
                onClick={importProject}
                type="button"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showProjectDialog === 'delete' ? (
        <div className="dialog-backdrop" onClick={() => setShowProjectDialog(null)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) =>
              handleDialogEnter(event, deleteProject, deleteProjectText === tree?.project?.name && !busy)
            }
            role="dialog"
          >
            <div className="dialog__title">Delete Project</div>
            <div className="inspector__notice">
              Type <strong>{tree?.project?.name}</strong> to permanently delete this project.
            </div>
            <input
              autoFocus
              placeholder="Project name"
              value={deleteProjectText}
              onChange={(event) => setDeleteProjectText(event.target.value)}
            />
            <div className="dialog__actions">
              <button className="ghost-button" onClick={() => setShowProjectDialog(null)} type="button">
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={busy || deleteProjectText !== tree?.project?.name}
                onClick={deleteProject}
                type="button"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteNodeOpen ? (
        <div className="dialog-backdrop" onClick={() => setDeleteNodeOpen(false)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleDialogEnter(event, deleteNode, !busy)}
            role="dialog"
          >
            <div className="dialog__title">Delete Node</div>
            <div className="inspector__notice">
              {hasBulkSelection ? (
                <>Delete <strong>{bulkSelectionCount} selected nodes</strong> and all child nodes?</>
              ) : (
                <>Delete <strong>{selectedNode?.name}</strong> and all child nodes?</>
              )}
            </div>
            <div className="dialog__actions">
              <button className="ghost-button" onClick={() => setDeleteNodeOpen(false)} type="button">
                Cancel
              </button>
              <button className="danger-button" disabled={busy} onClick={deleteNode} type="button">
                Delete Node
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {sessionDialogOpen ? (
        <div className="dialog-backdrop" onClick={() => setSessionDialogOpen(false)} role="presentation">
          <div
            className="dialog"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleDialogEnter(event, () => setSessionDialogOpen(false))}
            role="dialog"
          >
            <div className="dialog__title">Mobile Capture</div>
            <div className="inspector__notice">
              Enter this session code on your phone to connect capture directly to this desktop session.
            </div>
            <div className="session-code">{desktopClientId}</div>
            <div className="inspector__notice">
              {mobileConnectionCount > 0
                ? `${mobileConnectionCount} active phone connection${mobileConnectionCount === 1 ? '' : 's'}`
                : 'No active phone connections'}
            </div>
            <div className="dialog__actions">
              <button className="ghost-button" onClick={() => setSessionDialogOpen(false)} type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
