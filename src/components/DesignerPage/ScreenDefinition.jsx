import { useState } from 'react';
import { MOUNT_TYPES, CURVE_TYPES, CURVE_CONTINUITY } from '../../store/projectStore';
import './ScreenDefinition.css';

function PanelTypeModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState(
    existing || { name: '', pixelsWide: 0, pixelsTall: 0, width: 500, height: 500, weight: 0 }
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
          <div className="form-row">
            <label>
              Pixels Wide
              <input type="number" min="1" value={form.pixelsWide} onChange={(e) => setForm({ ...form, pixelsWide: parseInt(e.target.value) || 0 })} required />
            </label>
            <label>
              Pixels Tall
              <input type="number" min="1" value={form.pixelsTall} onChange={(e) => setForm({ ...form, pixelsTall: parseInt(e.target.value) || 0 })} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Module Width (mm)
              <input type="number" min="1" value={form.width} onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || 0 })} required />
            </label>
            <label>
              Module Height (mm)
              <input type="number" min="1" value={form.height} onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || 0 })} required />
            </label>
          </div>
          <label>
            Weight per Panel (kg)
            <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })} required />
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
  const [sizeMode, setSizeMode] = useState('panels');
  const [mWidth, setMWidth] = useState('');
  const [mHeight, setMHeight] = useState('');

  const currentPanel = panelTypes.find((p) => p.id === screen.panelTypeId) || null;
  const isFlown = screen.mountType === 'Flown' || screen.mountType === 'Roof';
  const isGroundStacked = screen.mountType === 'Ground Stacked';
  const isCurved = screen.curveType === 'Curved';
  // Continuous = single uniform degree for all columns
  // Non-Continuous = individual angle per column gap
  const isPerColumn = screen.curveContinuity === 'Non-Continuous';

  function update(field, value) {
    onUpdateScreen({ ...screen, [field]: value });
  }

  function handleSavePanelType(panelType) {
    const exists = panelTypes.find((p) => p.id === panelType.id);
    const newTypes = exists
      ? panelTypes.map((p) => (p.id === panelType.id ? panelType : p))
      : [...panelTypes, panelType];
    onSavePanelType(newTypes, panelType.id);
    setShowAddPanel(false);
    setEditingPanel(null);
  }

  function handleContinuityChange(val) {
    let angles = screen.columnAngles;
    if (val === 'Non-Continuous') {
      // Build per-column angle array initialised to the current uniform degree
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

  function switchToMetres() {
    if (!currentPanel) return;
    setMWidth(((screen.widthPanels * currentPanel.width) / 1000).toFixed(2));
    setMHeight(((screen.heightPanels * currentPanel.height) / 1000).toFixed(2));
    setSizeMode('metres');
  }

  function handleMWidth(val) {
    setMWidth(val);
    if (currentPanel && val) {
      const w = Math.max(1, Math.round((parseFloat(val) * 1000) / currentPanel.width));
      handleWidthChange(w);
    }
  }

  function handleMHeight(val) {
    setMHeight(val);
    if (currentPanel && val) {
      const h = Math.max(1, Math.round((parseFloat(val) * 1000) / currentPanel.height));
      update('heightPanels', h);
    }
  }

  const screenWidthM = currentPanel ? ((screen.widthPanels * currentPanel.width) / 1000).toFixed(2) : '—';
  const screenHeightM = currentPanel ? ((screen.heightPanels * currentPanel.height) / 1000).toFixed(2) : '—';

  // Shared curve section rendered in both Flown and Ground Stacked
  function renderCurveSection(footerSizeForBlocks) {
    return (
      <>
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
              Curve Degree (° between each column)
              <input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={screen.curveDegree}
                onChange={(e) => update('curveDegree', parseFloat(e.target.value) || 0)}
              />
            </label>

            <h4>Distribution</h4>
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

            {/* Non-Continuous = per-column individual angles */}
            {isPerColumn && screen.widthPanels > 1 && (
              <div className="column-angles">
                <h4>Column Angles (° per gap)</h4>
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

            {/* Angle blocks count — only meaningful on ground stack with a footer */}
            {footerSizeForBlocks > 0 && currentPanel && (() => {
              const fc = Math.round(screen.widthPanels / footerSizeForBlocks);
              const ab = fc * (screen.heightPanels - footerSizeForBlocks) * 2;
              return (
                <div className="angle-blocks-info">
                  Angle blocks required: <strong>{ab}</strong>
                </div>
              );
            })()}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="screen-definition">
      {/* Panel Selection */}
      <section className="def-section">
        <h3>Panel Type</h3>
        <div className="panel-selector">
          {panelTypes.length === 0 ? (
            <p className="no-panels-msg">No panel types defined yet — add one below.</p>
          ) : (
            <select
              value={screen.panelTypeId || ''}
              onChange={(e) => update('panelTypeId', e.target.value)}
            >
              {!screen.panelTypeId && <option value="" disabled>Select a panel type…</option>}
              {panelTypes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.pixelsWide}×{p.pixelsTall}px · {p.width}×{p.height}mm · {p.weight}kg
                </option>
              ))}
            </select>
          )}
          <div className="panel-type-btns">
            <button className="btn-secondary btn-sm" onClick={() => setShowAddPanel(true)}>
              + Add Panel
            </button>
            {currentPanel && (
              <>
                <button className="btn-secondary btn-sm" onClick={() => setEditingPanel(currentPanel)}>
                  Edit
                </button>
                <button className="btn-danger btn-sm" onClick={() => onDeletePanelType(screen.panelTypeId)}>
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
        <div className="size-mode-toggle">
          <button
            className={`size-mode-btn${sizeMode === 'panels' ? ' active' : ''}`}
            onClick={() => setSizeMode('panels')}
          >
            Panels
          </button>
          <button
            className={`size-mode-btn${sizeMode === 'metres' ? ' active' : ''}`}
            onClick={switchToMetres}
            disabled={!currentPanel}
            title={!currentPanel ? 'Select a panel type first' : undefined}
          >
            Metres
          </button>
        </div>

        {sizeMode === 'panels' ? (
          <div className="size-inputs">
            <label>
              Width (panels)
              <input
                type="number"
                min="1"
                max="200"
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
                max="200"
                value={screen.heightPanels}
                onChange={(e) => update('heightPanels', parseInt(e.target.value) || 1)}
              />
            </label>
          </div>
        ) : (
          <div className="size-inputs">
            <label>
              Width (m)
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={mWidth}
                onChange={(e) => handleMWidth(e.target.value)}
              />
            </label>
            <span className="size-separator">×</span>
            <label>
              Height (m)
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={mHeight}
                onChange={(e) => handleMHeight(e.target.value)}
              />
            </label>
          </div>
        )}

        <p className="size-display">
          {screen.widthPanels * screen.heightPanels} panels &nbsp;·&nbsp;
          {screenWidthM}m × {screenHeightM}m
          {currentPanel && (
            <> &nbsp;·&nbsp; {(screen.widthPanels * screen.heightPanels * currentPanel.weight).toFixed(1)} kg</>
          )}
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

        {/* Flown / Roof */}
        {isFlown && (
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
                Hoist Capacity (kg each)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={screen.hoistCapacity}
                  onChange={(e) => update('hoistCapacity', parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>
            {currentPanel && screen.riggingPoints > 0 && (() => {
              const totalWeight = screen.widthPanels * screen.heightPanels * currentPanel.weight;
              const udl = totalWeight / screen.riggingPoints;
              const overCapacity = udl > screen.hoistCapacity;
              return (
                <div className={`udl-display${overCapacity ? ' udl-warning' : ''}`}>
                  <span>Total screen weight: <strong>{totalWeight.toFixed(1)} kg</strong></span>
                  <span>
                    UDL per hoist: <strong>{udl.toFixed(1)} kg</strong>
                    {overCapacity && <span className="udl-warn-badge"> ⚠ exceeds capacity</span>}
                  </span>
                </div>
              );
            })()}

            <div className="sub-section">
              <label>
                Header
                <select
                  value={screen.headerSize}
                  onChange={(e) => update('headerSize', parseInt(e.target.value))}
                  disabled={!currentPanel}
                >
                  <option value={0}>None</option>
                  {currentPanel && (
                    <>
                      <option value={1}>1 panel ({(currentPanel.width / 1000).toFixed(2)}m)</option>
                      <option value={2}>2 panels ({(currentPanel.width * 2 / 1000).toFixed(2)}m)</option>
                    </>
                  )}
                </select>
              </label>
            </div>

            {renderCurveSection(0)}
          </div>
        )}

        {/* Ground Stacked */}
        {isGroundStacked && (
          <div className="sub-section">
            <label>
              Footer
              <select
                value={screen.footerSize}
                onChange={(e) => update('footerSize', parseInt(e.target.value))}
                disabled={!currentPanel}
              >
                <option value={0}>None</option>
                {currentPanel && (
                  <>
                    <option value={1}>1 panel ({(currentPanel.width / 1000).toFixed(2)}m)</option>
                    <option value={2}>2 panels ({(currentPanel.width * 2 / 1000).toFixed(2)}m)</option>
                  </>
                )}
              </select>
            </label>

            {currentPanel && screen.footerSize > 0 && (() => {
              const footerCount = Math.round(screen.widthPanels / screen.footerSize);
              const rearFooterCount = screen.footerSize === 1 ? footerCount : footerCount + 1;
              const screenHeightM = (screen.heightPanels * currentPanel.height) / 1000;
              const uprightsPerCol = screenHeightM > 0.5 ? Math.floor(screenHeightM) : 0;
              const totalUprights = rearFooterCount * uprightsPerCol;
              return (
                <div className="rigging-summary">
                  <div className="rigging-summary-row">
                    <span>Base footers</span><strong>{footerCount}</strong>
                  </div>
                  <div className="rigging-summary-row">
                    <span>Rear footers</span><strong>{rearFooterCount}</strong>
                  </div>
                  <div className="rigging-summary-row">
                    <span>Uprights</span><strong>{totalUprights}</strong>
                  </div>
                  <div className="rigging-summary-row">
                    <span>Grab arms</span><strong>{totalUprights}</strong>
                  </div>
                </div>
              );
            })()}

            {renderCurveSection(screen.footerSize)}
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
