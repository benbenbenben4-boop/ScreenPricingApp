import { useState } from 'react';
import { PANEL_TYPES, MOUNT_TYPES, CURVE_TYPES, CURVE_CONTINUITY } from '../../store/projectStore';
import './ScreenDefinition.css';

function PanelTypeModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState(
    existing || { name: '', pitch: '', width: 500, height: 500, price: 0 }
  );

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, id: existing?.id || `custom-${Date.now()}` });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{existing ? 'Edit Panel Type' : 'Add Panel Type'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Pixel Pitch (mm)
            <input type="number" step="0.1" value={form.pitch} onChange={(e) => setForm({ ...form, pitch: parseFloat(e.target.value) })} required />
          </label>
          <div className="form-row">
            <label>
              Module Width (mm)
              <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) })} required />
            </label>
            <label>
              Module Height (mm)
              <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) })} required />
            </label>
          </div>
          <label>
            Price per Panel (£)
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} required />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScreenDefinition({ screen, panelTypes, onUpdateScreen, onSavePanelType, onDeletePanelType }) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);

  const allPanelTypes = [...PANEL_TYPES, ...panelTypes];
  const currentPanel = allPanelTypes.find((p) => p.id === screen.panelTypeId) || allPanelTypes[0];
  const isGroundOrStacked = screen.mountType === 'Ground Stacked';
  const isCurved = screen.curveType === 'Curved';
  const isContinuous = screen.curveContinuity === 'Continuous';

  function update(field, value) {
    onUpdateScreen({ ...screen, [field]: value });
  }

  function handleSavePanelType(panelType) {
    const exists = panelTypes.find((p) => p.id === panelType.id);
    const newTypes = exists
      ? panelTypes.map((p) => (p.id === panelType.id ? panelType : p))
      : [...panelTypes, panelType];
    // Single atomic update — avoids stale closure overwrite bug
    onSavePanelType(newTypes, panelType.id);
    setShowAddPanel(false);
    setEditingPanel(null);
  }

  // Build column angle array when switching to continuous curve
  function handleContinuityChange(val) {
    let angles = screen.columnAngles;
    if (val === 'Continuous') {
      // One angle per column gap (columns - 1)
      const gaps = Math.max(0, screen.widthPanels - 1);
      angles = Array.from({ length: gaps }, (_, i) => screen.columnAngles[i] ?? screen.curveDegree);
    }
    onUpdateScreen({ ...screen, curveContinuity: val, columnAngles: angles });
  }

  function handleColumnAngle(idx, val) {
    const angles = [...screen.columnAngles];
    angles[idx] = parseFloat(val) || 0;
    onUpdateScreen({ ...screen, columnAngles: angles });
  }

  function handleWidthChange(val) {
    const w = parseInt(val) || 1;
    const gaps = Math.max(0, w - 1);
    const angles = Array.from({ length: gaps }, (_, i) => screen.columnAngles[i] ?? screen.curveDegree);
    onUpdateScreen({ ...screen, widthPanels: w, columnAngles: angles });
  }

  const screenWidthM = ((screen.widthPanels * currentPanel.width) / 1000).toFixed(2);
  const screenHeightM = ((screen.heightPanels * currentPanel.height) / 1000).toFixed(2);

  return (
    <div className="screen-definition">
      {/* Panel Selection */}
      <section className="def-section">
        <h3>Panel Selection</h3>
        <div className="panel-selector">
          <select
            value={screen.panelTypeId}
            onChange={(e) => update('panelTypeId', e.target.value)}
          >
            <optgroup label="Standard Panels">
              {PANEL_TYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — P{p.pitch} ({p.width}×{p.height}mm) £{p.price}/panel
                </option>
              ))}
            </optgroup>
            {panelTypes.length > 0 && (
              <optgroup label="Custom Panels">
                {panelTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — P{p.pitch} ({p.width}×{p.height}mm) £{p.price}/panel
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="panel-type-btns">
            <button className="btn-secondary btn-sm" onClick={() => setShowAddPanel(true)}>
              + Add Type
            </button>
            {panelTypes.find((p) => p.id === screen.panelTypeId) && (
              <>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setEditingPanel(panelTypes.find((p) => p.id === screen.panelTypeId))}
                >
                  Edit
                </button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => onDeletePanelType(screen.panelTypeId)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Screen Size */}
      <section className="def-section">
        <h3>Screen Size</h3>
        <div className="size-inputs">
          <label>
            Width (panels)
            <input
              type="number"
              min="1"
              max="100"
              value={screen.widthPanels}
              onChange={(e) => handleWidthChange(e.target.value)}
            />
          </label>
          <span className="size-separator">×</span>
          <label>
            Height (panels)
            <input
              type="number"
              min="1"
              max="100"
              value={screen.heightPanels}
              onChange={(e) => update('heightPanels', parseInt(e.target.value) || 1)}
            />
          </label>
        </div>
        <p className="size-display">
          {screen.widthPanels * screen.heightPanels} panels &nbsp;·&nbsp;
          {screenWidthM}m × {screenHeightM}m
        </p>
      </section>

      {/* Mount Type */}
      <section className="def-section">
        <h3>Mount Type</h3>
        <div className="radio-group">
          {MOUNT_TYPES.map((type) => (
            <label key={type} className="radio-label">
              <input
                type="radio"
                name="mountType"
                value={type}
                checked={screen.mountType === type}
                onChange={() => update('mountType', type)}
              />
              {type}
            </label>
          ))}
        </div>

        {/* Rigging for Flown / Roof */}
        {(screen.mountType === 'Flown' || screen.mountType === 'Roof') && (
          <div className="sub-section">
            <div className="form-row">
              <label>
                Rigging Points
                <input
                  type="number"
                  min="0"
                  value={screen.riggingPoints}
                  onChange={(e) => update('riggingPoints', parseInt(e.target.value) || 0)}
                />
              </label>
              <label>
                Price per Point (£)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={screen.riggingPricePerPoint}
                  onChange={(e) => update('riggingPricePerPoint', parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>
          </div>
        )}

        {/* Ground Stacked options */}
        {isGroundOrStacked && (
          <div className="sub-section">
            <div className="form-row">
              <label>
                Header Size (panels)
                <input
                  type="number"
                  min="0"
                  value={screen.headerSize}
                  onChange={(e) => update('headerSize', parseInt(e.target.value) || 0)}
                />
              </label>
              <label>
                Footer Size (panels)
                <input
                  type="number"
                  min="0"
                  value={screen.footerSize}
                  onChange={(e) => update('footerSize', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>

            <h4>Curve</h4>
            <div className="radio-group">
              {CURVE_TYPES.map((type) => (
                <label key={type} className="radio-label">
                  <input
                    type="radio"
                    name="curveType"
                    value={type}
                    checked={screen.curveType === type}
                    onChange={() => update('curveType', type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            {isCurved && (
              <div className="sub-section">
                <label>
                  Curve Degree (° per column)
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={screen.curveDegree}
                    onChange={(e) => update('curveDegree', parseFloat(e.target.value) || 0)}
                  />
                </label>

                <h4>Continuity</h4>
                <div className="radio-group">
                  {CURVE_CONTINUITY.map((type) => (
                    <label key={type} className="radio-label">
                      <input
                        type="radio"
                        name="curveContinuity"
                        value={type}
                        checked={screen.curveContinuity === type}
                        onChange={() => handleContinuityChange(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>

                {isContinuous && screen.widthPanels > 1 && (
                  <div className="column-angles">
                    <h4>Column Angles (° between each column)</h4>
                    <div className="column-angle-grid">
                      {Array.from({ length: screen.widthPanels - 1 }, (_, i) => (
                        <label key={i}>
                          Col {i + 1}–{i + 2}
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="30"
                            value={screen.columnAngles[i] ?? screen.curveDegree}
                            onChange={(e) => handleColumnAngle(i, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {!isContinuous && (
                  <div className="non-continuous-info">
                    <label>
                      Curve Degree (uniform across all columns)
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="30"
                        value={screen.curveDegree}
                        onChange={(e) => update('curveDegree', parseFloat(e.target.value) || 0)}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {(showAddPanel || editingPanel) && (
        <PanelTypeModal
          existing={editingPanel}
          onClose={() => { setShowAddPanel(false); setEditingPanel(null); }}
          onSave={handleSavePanelType}
        />
      )}
    </div>
  );
}
