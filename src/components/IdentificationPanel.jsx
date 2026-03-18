import { useMemo, useState } from 'react'

function formatFieldDraft(field) {
  if (!field) {
    return ''
  }
  return field.type === 'list' ? (Array.isArray(field.value) ? field.value.join(', ') : '') : String(field.value || '')
}

export default function IdentificationPanel({
  busy,
  clearError,
  hasAvailableTemplates,
  identification,
  openApplyTemplateDialog,
  patchIdentificationField,
  selectedNode,
  setRemoveIdentificationNodeId,
}) {
  const [fieldDrafts, setFieldDrafts] = useState(() => {
    const nextDrafts = {}
    for (const field of identification?.fields || []) {
      nextDrafts[field.key] = formatFieldDraft(field)
    }
    return nextDrafts
  })

  const reviewProgress = useMemo(() => {
    if (!identification) {
      return null
    }
    return `${identification.reviewedFieldCount}/${identification.totalReviewFieldCount}`
  }, [identification])

  async function handleSaveField(field) {
    if (!selectedNode || !field) {
      return
    }
    clearError()
    try {
      await patchIdentificationField(selectedNode.id, field.key, {
        value:
          field.type === 'list'
            ? String(fieldDrafts[field.key] ?? '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : String(fieldDrafts[field.key] ?? ''),
      })
    } catch {
      // Parent handles global error state.
    }
  }

  async function handleToggleReviewed(field) {
    if (!selectedNode || !field) {
      return
    }
    clearError()
    try {
      await patchIdentificationField(selectedNode.id, field.key, {
        value:
          field.type === 'list'
            ? String(fieldDrafts[field.key] ?? '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : String(fieldDrafts[field.key] ?? ''),
        reviewed: !field.reviewed,
      })
    } catch {
      // Parent handles global error state.
    }
  }

  if (!selectedNode) {
    return null
  }

  return (
    <div className="identification-panel">
      <div className="inspector__section field-stack">
        <div className="inspector__title">Template</div>

        {!identification ? (
          <button
            className="ghost-button wide"
            disabled={!hasAvailableTemplates || busy}
            onClick={openApplyTemplateDialog}
            type="button"
          >
            Apply Template
          </button>
        ) : (
          <div className="identification-template__row">
            <span className="identification-template__name">{identification.templateName}</span>
            <button
              className="ghost-button identification-template__remove"
              disabled={busy}
              onClick={() => setRemoveIdentificationNodeId(selectedNode.id)}
              type="button"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {identification ? (
        <div className="inspector__section field-stack">
          <div className="inspector__title">Status</div>
          <div className={`identification-status-block identification-status-block--${identification.status}`}>
            {identification.status === 'reviewed' ? 'Complete' : `Incomplete ${reviewProgress}`}
          </div>
        </div>
      ) : null}

      {identification ? (
        <div className="inspector__section field-stack">
          <div className="inspector__title">Fields</div>
          <div className="identification-fields">
            {identification.fields.map((field) => {
              const draftValue = fieldDrafts[field.key] ?? formatFieldDraft(field)

              return (
                <div key={field.key} className="identification-field">
                  <div className="identification-field__header">
                    <div className="identification-field__label">
                      <span>{field.label}</span>
                    </div>
                  </div>
                  <div className="identification-field__control">
                    {field.type === 'multiline' ? (
                      <textarea
                        className={field.reviewed ? 'identification-field__input is-reviewed' : 'identification-field__input'}
                        disabled={field.reviewed}
                        rows="4"
                        value={draftValue}
                        onBlur={() => void handleSaveField(field)}
                        onChange={(event) => {
                          clearError()
                          setFieldDrafts((current) => ({ ...current, [field.key]: event.target.value }))
                        }}
                      />
                    ) : (
                      <input
                        className={field.reviewed ? 'identification-field__input is-reviewed' : 'identification-field__input'}
                        disabled={field.reviewed}
                        placeholder={field.type === 'list' ? 'comma, separated, values' : ''}
                        value={draftValue}
                        onBlur={() => void handleSaveField(field)}
                        onChange={(event) => {
                          clearError()
                          setFieldDrafts((current) => ({ ...current, [field.key]: event.target.value }))
                        }}
                      />
                    )}
                    <button
                      aria-label={field.reviewed ? `Unreview ${field.label}` : `Review ${field.label}`}
                      className={`identification-field__review-toggle ${field.reviewed ? 'is-reviewed' : ''}`}
                      disabled={busy}
                      onClick={() => void handleToggleReviewed(field)}
                      type="button"
                    >
                      <i aria-hidden="true" className="fa-solid fa-check" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
