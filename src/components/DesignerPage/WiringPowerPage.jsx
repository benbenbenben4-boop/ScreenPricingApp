import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { calculateScreen } from '../../store/projectStore';
import './ScreenDefinition.css'; // reuses .def-section / .no-panels-msg
import './WiringPage.css';

const CIRCUIT_PRESETS = [
  { label: '16A · 1φ', phase: 1, ampRating: 16 },
  { label: '32A · 1φ', phase: 1, ampRating: 32 },
  { label: '32A · 3φ', phase: 3, ampRating: 32 },
  { label: '63A · 3φ', phase: 3, ampRating: 63 },
  { label: '125A · 3φ', phase: 3, ampRating: 125 },
];

function createCircuit(index) {
  return { id: uuidv4(), name: `Circuit ${index}`, phase: 3, ampRating: 32, screenIds: [] };
}

// Amps actually drawn on this circuit's supply, given its phase count.
// Single phase: full load current. Three phase: assumed balanced across L1/L2/L3.
function circuitAmpsUsed(circuit, screens, panelTypes) {
  const totalWatts = circuit.screenIds.reduce((sum, screenId) => {
    const screen = screens.find((s) => s.id === screenId);
    if (!screen) return sum;
    return sum + calculateScreen(screen, panelTypes).totalWatts;
  }, 0);
  const totalAmps = totalWatts / 230;
  return circuit.phase === 3 ? totalAmps / 3 : totalAmps;
}

export default function WiringPowerPage({ screens, panelTypes, power, onUpdatePower }) {
  const [assigningCircuitId, setAssigningCircuitId] = useState(null);
  const circuits = power.circuits || [];
  const assignedScreenIds = new Set(circuits.flatMap((c) => c.screenIds));
  const unassignedScreens = screens.filter((s) => !assignedScreenIds.has(s.id));

  function updateCircuits(newCircuits) {
    onUpdatePower({ ...power, circuits: newCircuits });
  }

  function addCircuit() {
    updateCircuits([...circuits, createCircuit(circuits.length + 1)]);
  }

  function patchCircuit(circuitId, patch) {
    updateCircuits(circuits.map((c) => (c.id === circuitId ? { ...c, ...patch } : c)));
  }

  function deleteCircuit(circuitId) {
    updateCircuits(circuits.filter((c) => c.id !== circuitId));
  }

  function assignScreen(circuitId, screenId) {
    updateCircuits(
      circuits.map((c) => {
        if (c.id === circuitId) return { ...c, screenIds: [...c.screenIds, screenId] };
        return c.screenIds.includes(screenId) ? { ...c, screenIds: c.screenIds.filter((id) => id !== screenId) } : c;
      })
    );
    setAssigningCircuitId(null);
  }

  function unassignScreen(circuitId, screenId) {
    patchCircuit(circuitId, { screenIds: circuits.find((c) => c.id === circuitId).screenIds.filter((id) => id !== screenId) });
  }

  return (
    <div className="def-section">
      <div className="circuits-header">
        <h3>Power Circuits</h3>
        <button className="btn-primary btn-sm" onClick={addCircuit}>+ Add Circuit</button>
      </div>

      {circuits.length === 0 ? (
        <p className="no-panels-msg">No circuits yet. Add one to start assigning screens to a power distro.</p>
      ) : (
        circuits.map((circuit) => {
          const ampsUsed = circuitAmpsUsed(circuit, screens, panelTypes);
          const overloaded = ampsUsed > circuit.ampRating;
          const memberScreens = circuit.screenIds
            .map((id) => screens.find((s) => s.id === id))
            .filter(Boolean);

          return (
            <div key={circuit.id} className={`circuit-card ${overloaded ? 'overloaded' : ''}`}>
              <div className="circuit-card-header">
                <input
                  className="circuit-name-input"
                  value={circuit.name}
                  onChange={(e) => patchCircuit(circuit.id, { name: e.target.value })}
                />
                <div className="circuit-meta">
                  <select
                    value={`${circuit.phase}-${circuit.ampRating}`}
                    onChange={(e) => {
                      const [phase, ampRating] = e.target.value.split('-').map(Number);
                      patchCircuit(circuit.id, { phase, ampRating });
                    }}
                  >
                    {CIRCUIT_PRESETS.map((p) => (
                      <option key={p.label} value={`${p.phase}-${p.ampRating}`}>{p.label}</option>
                    ))}
                    <option value={`${circuit.phase}-${circuit.ampRating}`} hidden>
                      {circuit.ampRating}A · {circuit.phase}φ (custom)
                    </option>
                  </select>
                  <input
                    className="circuit-amp-input"
                    type="number"
                    min="1"
                    value={circuit.ampRating}
                    onChange={(e) => patchCircuit(circuit.id, { ampRating: parseFloat(e.target.value) || 0 })}
                    title="Custom amp rating"
                  />
                  <button className="btn-danger btn-sm" onClick={() => deleteCircuit(circuit.id)}>Delete</button>
                </div>
              </div>

              <div className="circuit-load-summary">
                Load: <strong>{ampsUsed.toFixed(1)} A</strong> of {circuit.ampRating} A
                {circuit.phase === 3 ? ' per phase' : ''}
                {overloaded && <span className="circuit-overload-badge"> ⚠ exceeds circuit rating</span>}
              </div>

              <div className="circuit-screens">
                {memberScreens.map((screen) => (
                  <span key={screen.id} className="circuit-screen-chip">
                    {screen.name}
                    <button onClick={() => unassignScreen(circuit.id, screen.id)} title="Remove from circuit">×</button>
                  </span>
                ))}

                {assigningCircuitId === circuit.id ? (
                  <select
                    autoFocus
                    value=""
                    onChange={(e) => e.target.value && assignScreen(circuit.id, e.target.value)}
                    onBlur={() => setAssigningCircuitId(null)}
                  >
                    <option value="">Assign a screen…</option>
                    {screens
                      .filter((s) => !circuit.screenIds.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                ) : (
                  <button className="btn-secondary btn-sm" onClick={() => setAssigningCircuitId(circuit.id)}>
                    + Assign screen
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="unassigned-screens">
        <h4>Unassigned Screens</h4>
        {screens.length === 0 ? (
          <p className="no-panels-msg">No screens in this project yet.</p>
        ) : unassignedScreens.length === 0 ? (
          <p className="no-panels-msg">Every screen is assigned to a circuit.</p>
        ) : (
          <div className="unassigned-list">
            {unassignedScreens.map((s) => (
              <span key={s.id} className="circuit-screen-chip">{s.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
