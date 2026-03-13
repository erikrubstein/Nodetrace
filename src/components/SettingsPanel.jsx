export default function SettingsPanel({
  busy,
  onResizeStart,
  persistProjectSettings,
  projectId,
  projectSettings,
  resetProjectSettings,
}) {
  return (
    <>
      <div className="inspector-resize-handle" onPointerDown={onResizeStart} role="separator" />
      <aside className="inspector settings-panel">
        <div className="inspector__titlebar">Settings</div>
        <div className="inspector__section field-stack">
          <label>
            <span>Direction</span>
            <select
              value={projectSettings.orientation}
              onChange={(event) =>
                persistProjectSettings({
                  ...projectSettings,
                  orientation: event.target.value,
                })
              }
            >
              <option value="horizontal">Right</option>
              <option value="vertical">Down</option>
            </select>
          </label>
          <label>
            <span>Horizontal spacing</span>
            <input
              max="220"
              min="24"
              onChange={(event) =>
                persistProjectSettings({
                  ...projectSettings,
                  horizontalGap: Number(event.target.value),
                })
              }
              type="range"
              value={projectSettings.horizontalGap}
            />
          </label>
          <label>
            <span>Vertical spacing</span>
            <input
              max="180"
              min="16"
              onChange={(event) =>
                persistProjectSettings({
                  ...projectSettings,
                  verticalGap: Number(event.target.value),
                })
              }
              type="range"
              value={projectSettings.verticalGap}
            />
          </label>
          <label>
            <span>Image mode</span>
            <select
              value={projectSettings.imageMode}
              onChange={(event) =>
                persistProjectSettings({
                  ...projectSettings,
                  imageMode: event.target.value,
                })
              }
            >
              <option value="original">Original Ratio</option>
              <option value="square">Square</option>
            </select>
          </label>
          <label>
            <span>Layout</span>
            <select
              value={projectSettings.layoutMode}
              onChange={(event) =>
                persistProjectSettings({
                  ...projectSettings,
                  layoutMode: event.target.value,
                })
              }
            >
              <option value="compact">Compact</option>
              <option value="classic">Classic</option>
            </select>
          </label>
          <div className="settings-readout">
            <span>H: {projectSettings.horizontalGap}</span>
            <span>V: {projectSettings.verticalGap}</span>
            <span>{projectSettings.imageMode === 'square' ? 'Square' : 'Original'}</span>
            <span>{projectSettings.layoutMode === 'compact' ? 'Compact' : 'Classic'}</span>
          </div>
          <button className="ghost-button" disabled={busy} onClick={resetProjectSettings} type="button">
            Reset
          </button>
          <div className="inspector__notice">Project ID: {projectId || 'n/a'}</div>
        </div>
      </aside>
    </>
  )
}
