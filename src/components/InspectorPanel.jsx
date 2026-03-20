export default function InspectorPanel({
  busy,
  bulkSelectionCount,
  bulkTemplateCount,
  editForm,
  editTargetNode,
  error,
  hasBulkSelection,
  hasIdentificationTemplates,
  hasLockedSelectionRoot,
  identification,
  nameInputRef,
  openApplyTemplateDialog,
  openRemoveTemplateDialog,
  saveNodeDraft,
  selectedNode,
  setDeleteNodeOpen,
  setEditForm,
  setRemoveIdentificationNodeId,
  status,
}) {
  const isRootNode = Boolean(selectedNode && selectedNode.parent_id == null && !selectedNode.isVariant)

  return (
    <>
      <div className="inspector__section">
        <div className="inspector__title">
          {hasBulkSelection
            ? 'Selection'
            : selectedNode
            ? selectedNode.isVariant
              ? selectedNode.type === 'photo'
                ? 'Variant Photo'
                : 'Variant Folder'
              : selectedNode.type === 'photo'
                ? 'Photo'
                : 'Folder'
            : 'Selection'}
        </div>
        {selectedNode ? (
          <div className="inspector__name">{hasBulkSelection ? `${bulkSelectionCount} Nodes Selected` : selectedNode.name}</div>
        ) : (
          <div className="inspector__empty">Select a node.</div>
        )}
      </div>

      {selectedNode ? (
        <>
          {!hasBulkSelection ? (
            <div className="inspector__section field-stack">
              <div className="inspector__title">Details</div>
              <label>
                <span>Name</span>
                <input
                  disabled={isRootNode}
                  ref={nameInputRef}
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                  onBlur={() => void saveNodeDraft(editTargetNode, editForm)}
                />
              </label>
              {isRootNode ? <div className="inspector__notice">Root name follows the project name.</div> : null}
              <label>
                <span>Notes</span>
                <textarea
                  rows="7"
                  value={editForm.notes}
                  onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })}
                  onBlur={() => void saveNodeDraft(editTargetNode, editForm)}
                />
              </label>
            </div>
          ) : (
            <div className="inspector__section field-stack">
              <div className="inspector__title">Bulk Actions</div>
              <div className="inspector__notice">{bulkSelectionCount} nodes selected.</div>
            </div>
          )}

          <div className="inspector__section field-stack">
            <div className="inspector__title">Template</div>
            {hasBulkSelection ? (
              <>
                <button
                  className="ghost-button wide"
                  disabled={!hasIdentificationTemplates || busy}
                  onClick={openApplyTemplateDialog}
                  type="button"
                >
                  Apply Template
                </button>
                <button
                  className="ghost-button wide"
                  disabled={!bulkTemplateCount || busy}
                  onClick={openRemoveTemplateDialog}
                  type="button"
                >
                  Clear Template
                </button>
              </>
            ) : !identification ? (
              <button
                className="ghost-button wide"
                disabled={!hasIdentificationTemplates || busy}
                onClick={openApplyTemplateDialog}
                type="button"
              >
                Apply Template
              </button>
            ) : (
              <div className="identification-template__row">
                <span className="identification-template__name">{identification.templateName}</span>
                <div className="identification-template__actions">
                  <button
                    className="ghost-button identification-template__action"
                    disabled={busy}
                    onClick={() => setRemoveIdentificationNodeId(selectedNode.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="inspector__section field-stack">
            <button
              className="danger-button wide"
              disabled={hasLockedSelectionRoot || busy}
              onClick={() => setDeleteNodeOpen(true)}
              type="button"
            >
              {hasBulkSelection ? `Delete ${bulkSelectionCount} Nodes` : 'Delete Node'}
            </button>
          </div>

          {!hasBulkSelection ? (
            <div className="inspector__section inspector__footer">
              <div className="settings-panel__meta-row">
                <span>Node Owner</span>
                <strong>{selectedNode.ownerUsername || 'Unknown'}</strong>
              </div>
              <div className="settings-panel__meta-row">
                <span>Node ID</span>
                <strong>{selectedNode.id}</strong>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {error ? <div className="inspector__notice error">{error}</div> : null}
      {!error && status ? <div className="inspector__notice">{status}</div> : null}
    </>
  )
}
