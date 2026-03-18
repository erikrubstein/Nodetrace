export default function TemplatesPanel({
  busy,
  clearError,
  hasTemplateChanges,
  error,
  createNewTemplate,
  requestDeleteTemplate,
  requestSaveTemplate,
  selectedTemplateEditorId,
  selectTemplateEditor,
  templateForm,
  templates,
  updateTemplateField,
  duplicateTemplate,
}) {
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateEditorId) || null
  const isBuiltIn = Boolean(selectedTemplate?.systemKey)
  const canSave = !busy && !isBuiltIn && hasTemplateChanges

  return (
    <div className="templates-panel">
      <section className="inspector__section templates-panel__section">
        <div className="inspector__title">Template</div>
        <div className="templates-panel__toolbar">
          <select
            disabled={busy}
            value={selectedTemplateEditorId || ''}
            onChange={(event) => {
              clearError()
              selectTemplateEditor(event.target.value)
            }}
          >
            {(templates || []).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            aria-label="New template"
            className="tool-button templates-panel__new-button"
            disabled={busy}
            onClick={createNewTemplate}
            type="button"
          >
            <i aria-hidden="true" className="fa-solid fa-plus" />
          </button>
        </div>

        <label>
          <span>Name</span>
          <input
            disabled={isBuiltIn}
            value={templateForm.name}
            onChange={(event) => {
              clearError()
              updateTemplateField('name', null, event.target.value)
            }}
          />
        </label>

        <label className="templates-panel__field-group">
          <span>Fields</span>
          <div className="template-field-editor">
            {templateForm.fields.map((field, index) => (
              <div className="template-field-editor__row" key={field.id || index}>
                <input
                  disabled={isBuiltIn}
                  placeholder="Label"
                  value={field.label}
                  onChange={(event) => {
                    clearError()
                    updateTemplateField('label', index, event.target.value)
                  }}
                />
                <input
                  disabled={isBuiltIn}
                  placeholder="key_name"
                  value={field.key}
                  onChange={(event) => {
                    clearError()
                    updateTemplateField('key', index, event.target.value)
                  }}
                />
                <select
                  disabled={isBuiltIn}
                  value={field.type}
                  onChange={(event) => {
                    clearError()
                    updateTemplateField('type', index, event.target.value)
                  }}
                >
                  <option value="text">Text</option>
                  <option value="multiline">Multiline</option>
                </select>
                <button
                  aria-label={`Remove ${field.label || 'field'}`}
                  className="tool-button template-field-editor__remove-button"
                  disabled={busy || isBuiltIn}
                  onClick={() => {
                    clearError()
                    updateTemplateField('remove', index)
                  }}
                  type="button"
                >
                  <i aria-hidden="true" className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
          </div>
        </label>

        {!isBuiltIn ? (
          <button
            className="ghost-button wide"
            disabled={busy}
            onClick={() => {
              clearError()
              updateTemplateField('add')
            }}
            type="button"
          >
            Add Field
          </button>
        ) : null}

        <div className="templates-panel__actions-bar">
          {!isBuiltIn ? (
            <button className="ghost-button" disabled={!canSave} onClick={requestSaveTemplate} type="button">
              Save
            </button>
          ) : null}
          <button
            className="ghost-button"
            disabled={busy}
            onClick={() => {
              clearError()
              void duplicateTemplate()
            }}
            type="button"
          >
            Duplicate
          </button>
          {!isBuiltIn ? (
            <button className="danger-button" disabled={busy} onClick={requestDeleteTemplate} type="button">
              Delete
            </button>
          ) : null}
        </div>

        {error ? <div className="inspector__notice error">{error}</div> : null}
      </section>

      <div className="inspector__section inspector__footer">
        <div className="settings-panel__meta-row">
          <span>Template ID</span>
          <strong>{selectedTemplate?.id || 'n/a'}</strong>
        </div>
      </div>
    </div>
  )
}
