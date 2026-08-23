import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CABLE_PATTERNS, generateCabling, isStringOverCapacity, isStringOutOfBounds } from '../../lib/cabling';
import './WiringCablingDiagram.css';

// Validated 8-hue categorical palette (dataviz skill, references/palette.md — light mode).
// Identity here is carried primarily by grid position, the order-index badge, and the
// string list's text labels, not color alone — so cycling past 8 strings (common for
// wide screens with many columns) is an acceptable, disclosed simplification: color stays
// a grouping aid rather than the sole channel, unlike a typical categorical chart.
const STRING_COLORS = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100',
  '#e87ba4', '#008300', '#4a3aa7', '#e34948',
];

const REFERENCE_CANVAS = { width: 4096, height: 2160 }; // Brompton's "4K DCI" canvas preset

function stringColor(index) {
  return STRING_COLORS[index % STRING_COLORS.length];
}

export default function WiringCablingDiagram({ screen, panelType, fixturesPerPort, onUpdateScreen }) {
  const [activeStringId, setActiveStringId] = useState(null);
  const [pattern, setPattern] = useState('columnComb');

  const cols = screen.widthPanels;
  const rows = screen.heightPanels;
  const cabling = screen.cabling || null;
  const strings = cabling?.strings || [];

  const cellOf = new Map(); // "col,row" -> { stringIndex, orderIndex }
  strings.forEach((s, si) => {
    s.path.forEach((p, oi) => cellOf.set(`${p.col},${p.row}`, { stringIndex: si, orderIndex: oi }));
  });

  function updateCabling(newCabling) {
    onUpdateScreen({ ...screen, cabling: newCabling });
  }

  function handleAutoSuggest() {
    updateCabling(generateCabling(cols, rows, fixturesPerPort, pattern));
    setActiveStringId(null);
  }

  function handleAddString() {
    const newString = { id: uuidv4(), path: [] };
    const current = cabling || { pattern: 'custom', strings: [] };
    updateCabling({ ...current, pattern: 'custom', strings: [...current.strings, newString] });
    setActiveStringId(newString.id);
  }

  function handleDeleteString(id) {
    updateCabling({ ...cabling, pattern: 'custom', strings: strings.filter((s) => s.id !== id) });
    if (activeStringId === id) setActiveStringId(null);
  }

  function handleCellClick(col, row) {
    if (!activeStringId) return;
    const activeString = strings.find((s) => s.id === activeStringId);
    const last = activeString.path[activeString.path.length - 1];
    const isTailOfActive = last && last.col === col && last.row === row;

    const newStrings = strings.map((s) => {
      const filteredPath = s.path.filter((p) => !(p.col === col && p.row === row));
      if (s.id === activeStringId && !isTailOfActive) {
        return { ...s, path: [...filteredPath, { col, row }] };
      }
      return { ...s, path: filteredPath };
    });
    updateCabling({ ...cabling, pattern: 'custom', strings: newStrings });
  }

  const gridPxW = cols * panelType.pixelsWide;
  const gridPxH = rows * panelType.pixelsTall;
  const viewW = Math.max(REFERENCE_CANVAS.width, gridPxW);
  const viewH = Math.max(REFERENCE_CANVAS.height, gridPxH);

  return (
    <div className="cabling-diagram">
      <div className="cabling-controls">
        <label>
          Auto-suggest pattern
          <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
            {CABLE_PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <button className="btn-primary btn-sm" onClick={handleAutoSuggest}>Auto-suggest</button>
        <button className="btn-secondary btn-sm" onClick={handleAddString}>+ Add String</button>
      </div>

      <div className="cabling-body">
        <aside className="cabling-string-list">
          {strings.length === 0 ? (
            <p className="no-panels-msg">No strings yet. Auto-suggest a pattern or add one manually.</p>
          ) : (
            strings.map((s, i) => {
              const overCapacity = isStringOverCapacity(s, fixturesPerPort);
              const outOfBounds = isStringOutOfBounds(s, cols, rows);
              return (
                <div
                  key={s.id}
                  className={`cabling-string-row ${activeStringId === s.id ? 'active' : ''}`}
                  onClick={() => setActiveStringId(activeStringId === s.id ? null : s.id)}
                >
                  <span className="cabling-swatch" style={{ background: stringColor(i) }} />
                  <span className="cabling-string-label">
                    String {i + 1} · {s.path.length} panel{s.path.length !== 1 ? 's' : ''}
                    {(overCapacity || outOfBounds) && (
                      <span className="cabling-warn"> ⚠ {overCapacity ? 'exceeds port capacity' : 'out of bounds'}</span>
                    )}
                  </span>
                  <button
                    className="btn-danger btn-icon"
                    title="Delete string"
                    onClick={(e) => { e.stopPropagation(); handleDeleteString(s.id); }}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
          <p className="cabling-hint">
            {activeStringId ? 'Click panels to add them to the selected string.' : 'Select a string above to edit its path.'}
          </p>
        </aside>

        <div className="cabling-canvas-wrap">
          <svg className="cabling-svg" viewBox={`0 0 ${viewW} ${viewH}`}>
            <defs>
              {strings.map((s, i) => (
                <marker
                  key={s.id}
                  id={`cabling-arrow-${s.id}`}
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={stringColor(i)} />
                </marker>
              ))}
            </defs>

            <rect
              className="cabling-reference-frame"
              x="0" y="0"
              width={REFERENCE_CANVAS.width}
              height={REFERENCE_CANVAS.height}
            />

            {Array.from({ length: rows }, (_, row) =>
              Array.from({ length: cols }, (_, col) => {
                const entry = cellOf.get(`${col},${row}`);
                const x = col * panelType.pixelsWide;
                const y = row * panelType.pixelsTall;
                const color = entry ? stringColor(entry.stringIndex) : null;
                return (
                  <g
                    key={`${col}-${row}`}
                    className="cabling-cell"
                    onClick={() => handleCellClick(col, row)}
                  >
                    <rect
                      x={x} y={y}
                      width={panelType.pixelsWide}
                      height={panelType.pixelsTall}
                      fill={color || 'transparent'}
                      fillOpacity={color ? 0.22 : 0}
                      stroke={color || 'var(--border)'}
                      strokeDasharray={color ? undefined : '6 6'}
                      strokeWidth={Math.max(1, Math.min(panelType.pixelsWide, panelType.pixelsTall) * 0.01)}
                    />
                    {entry && (
                      <text
                        x={x + panelType.pixelsWide / 2}
                        y={y + panelType.pixelsTall / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={Math.min(panelType.pixelsWide, panelType.pixelsTall) * 0.3}
                        className="cabling-cell-label"
                      >
                        {entry.orderIndex + 1}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {strings.map((s, i) =>
              s.path.slice(1).map((p, idx) => {
                const from = s.path[idx];
                const x1 = from.col * panelType.pixelsWide + panelType.pixelsWide / 2;
                const y1 = from.row * panelType.pixelsTall + panelType.pixelsTall / 2;
                const x2 = p.col * panelType.pixelsWide + panelType.pixelsWide / 2;
                const y2 = p.row * panelType.pixelsTall + panelType.pixelsTall / 2;
                return (
                  <line
                    key={`${s.id}-${idx}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    className="cabling-path-line"
                    stroke={stringColor(i)}
                    strokeWidth={Math.max(1.5, Math.min(panelType.pixelsWide, panelType.pixelsTall) * 0.02)}
                    markerEnd={`url(#cabling-arrow-${s.id})`}
                  />
                );
              })
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
