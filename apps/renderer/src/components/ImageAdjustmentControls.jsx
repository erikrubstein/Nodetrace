export default function ImageAdjustmentControls({ edits, onChange }) {
  function updateEdit(key, value) {
    onChange({
      ...edits,
      [key]: value,
    })
  }

  return (
    <div className="inspector__section field-stack preview-panel__controls">
      <div className="inspector__title">Adjustments</div>
      <label>
        <span className="preview-panel__control-header"><span>Brightness</span><strong>{edits.brightness}</strong></span>
        <input max="100" min="-100" type="range" value={edits.brightness} onChange={(event) => updateEdit('brightness', Number(event.target.value))} />
      </label>
      <label>
        <span className="preview-panel__control-header"><span>Contrast</span><strong>{edits.contrast}</strong></span>
        <input max="200" min="0" type="range" value={edits.contrast} onChange={(event) => updateEdit('contrast', Number(event.target.value))} />
      </label>
      <label>
        <span className="preview-panel__control-header"><span>Exposure</span><strong>{edits.exposure}</strong></span>
        <input max="100" min="-100" type="range" value={edits.exposure} onChange={(event) => updateEdit('exposure', Number(event.target.value))} />
      </label>
      <label>
        <span className="preview-panel__control-header"><span>Sharpness</span><strong>{edits.sharpness}</strong></span>
        <input max="100" min="0" type="range" value={edits.sharpness} onChange={(event) => updateEdit('sharpness', Number(event.target.value))} />
      </label>
      <label>
        <span className="preview-panel__control-header"><span>Denoise</span><strong>{edits.denoise}</strong></span>
        <input max="100" min="0" type="range" value={edits.denoise} onChange={(event) => updateEdit('denoise', Number(event.target.value))} />
      </label>
    </div>
  )
}
