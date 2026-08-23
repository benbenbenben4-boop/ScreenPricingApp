import { useState } from 'react';
import { PROCESSORS, PROCESSOR_MODELS, BIT_DEPTHS, FRAME_RATES } from '../../data/bromptonProcessors';
import { calculateScreenWiring, calculateFixtureCapacities } from '../../lib/bromptonCapacity';
import WiringCablingDiagram from './WiringCablingDiagram';
import './ScreenDefinition.css'; // reuses .def-section / .form-row / .no-panels-msg
import './WiringPage.css';

export default function WiringDataPage({ screens, panelTypes, settings, onUpdateSettings, onUpdateScreen }) {
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  const processor = settings.processorModel ? PROCESSORS[settings.processorModel] : null;
  const selectedScreen = screens.find((s) => s.id === selectedScreenId) || screens[0] || null;
  const selectedPanelType = selectedScreen ? panelTypes.find((p) => p.id === selectedScreen.panelTypeId) : null;

  function update(field, value) {
    onUpdateSettings({ ...settings, [field]: value });
  }

  function handleProcessorChange(model) {
    const next = PROCESSORS[model];
    onUpdateSettings({
      ...settings,
      processorModel: model,
      // Force off any toggle the newly selected processor doesn't support.
      usingUll: next.supportsUll ? settings.usingUll : false,
      usingFailover: next.supportsFailover ? settings.usingFailover : false,
      usingRedundancy: next.cabling.includes('redundant') ? settings.usingRedundancy : false,
    });
  }

  const rows = screens.map((screen) => {
    const panelType = panelTypes.find((p) => p.id === screen.panelTypeId) || null;
    const result = processor && panelType ? calculateScreenWiring(screen, panelType, processor, settings) : null;
    return { screen, panelType, result };
  });

  const totals = rows.reduce(
    (acc, { result }) => ({
      ports: acc.ports + (result?.portsNeeded || 0),
      processors: acc.processors + (result?.processorsNeeded || 0),
      xds: acc.xds + (result?.xdsNeeded || 0),
    }),
    { ports: 0, processors: 0, xds: 0 }
  );

  return (
    <div className="def-section">
      <h3>Processor & Signal Settings</h3>
      <div className="form-row">
        <label>
          Processor
          <select value={settings.processorModel || ''} onChange={(e) => handleProcessorChange(e.target.value)}>
            <option value="" disabled>Select a processor…</option>
            {PROCESSOR_MODELS.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </label>
        <label>
          Bit Depth
          <select value={settings.bitDepth} onChange={(e) => update('bitDepth', parseInt(e.target.value))}>
            {BIT_DEPTHS.map((bd) => (
              <option key={bd} value={bd}>{bd} bpc</option>
            ))}
          </select>
        </label>
        <label>
          Frame Rate
          <select value={settings.frameRate} onChange={(e) => update('frameRate', parseInt(e.target.value))}>
            {FRAME_RATES.map((fr) => (
              <option key={fr} value={fr}>{fr} Hz</option>
            ))}
          </select>
        </label>
      </div>

      <div className="wiring-toggle-row">
        <label className={`wiring-toggle ${processor && processor.cabling.includes('redundant') ? '' : 'disabled'}`}>
          <input
            type="checkbox"
            checked={settings.usingRedundancy}
            disabled={!processor || !processor.cabling.includes('redundant')}
            onChange={(e) => update('usingRedundancy', e.target.checked)}
          />
          Redundant cabling
        </label>
        <label className={`wiring-toggle ${processor?.supportsUll ? '' : 'disabled'}`}>
          <input
            type="checkbox"
            checked={settings.usingUll}
            disabled={!processor?.supportsUll}
            onChange={(e) => update('usingUll', e.target.checked)}
          />
          Ultra-low latency
        </label>
        <label className="wiring-toggle">
          <input
            type="checkbox"
            checked={settings.usingSwitches}
            disabled={!processor}
            onChange={(e) => update('usingSwitches', e.target.checked)}
          />
          Using switches
        </label>
        <label className={`wiring-toggle ${processor?.supportsFailover ? '' : 'disabled'}`}>
          <input
            type="checkbox"
            checked={settings.usingFailover}
            disabled={!processor?.supportsFailover}
            onChange={(e) => update('usingFailover', e.target.checked)}
          />
          Processor failover
        </label>
      </div>

      <h3 className="wiring-section-heading">Screen Requirements</h3>
      {!processor ? (
        <p className="no-panels-msg">Select a processor above to calculate port/processor requirements.</p>
      ) : rows.length === 0 ? (
        <p className="no-panels-msg">No screens in this project yet.</p>
      ) : (
        <table className="wiring-results-table">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Panel Type</th>
              <th>Panels</th>
              <th>Ports</th>
              <th>Processors</th>
              {processor.hasXd && <th>XDs</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ screen, panelType, result }) => (
              <tr key={screen.id}>
                <td>{screen.name}</td>
                <td>{panelType ? panelType.name : <span className="wiring-empty-cell">None selected</span>}</td>
                <td>{screen.widthPanels * screen.heightPanels}</td>
                <td>{result ? result.portsNeeded : '—'}</td>
                <td>{result ? result.processorsNeeded : '—'}</td>
                {processor.hasXd && <td>{result ? result.xdsNeeded : '—'}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td>{totals.ports}</td>
              <td>{totals.processors}</td>
              {processor.hasXd && <td>{totals.xds}</td>}
            </tr>
          </tfoot>
        </table>
      )}

      {processor && screens.length > 0 && (
        <>
          <h3 className="wiring-section-heading">Cable Layout</h3>
          <label className="cabling-screen-picker">
            Screen
            <select
              value={selectedScreen?.id || ''}
              onChange={(e) => setSelectedScreenId(e.target.value)}
            >
              {screens.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          {!selectedPanelType ? (
            <p className="no-panels-msg">Select a panel type for this screen (in the Screens tab) to lay out cabling.</p>
          ) : (
            <WiringCablingDiagram
              key={selectedScreen.id}
              screen={selectedScreen}
              panelType={selectedPanelType}
              fixturesPerPort={calculateFixtureCapacities(selectedPanelType, processor, settings).fixturesPerPort}
              onUpdateScreen={onUpdateScreen}
            />
          )}
        </>
      )}
    </div>
  );
}
