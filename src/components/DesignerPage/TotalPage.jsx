import { calculateScreen } from '../../store/projectStore';
import './TotalPage.css';

export default function TotalPage({ screens, panelTypes }) {
  const screenCalcs = screens.map((screen) => ({
    screen,
    calc: calculateScreen(screen, panelTypes),
  }));

  const totalPanels = screenCalcs.reduce((sum, { calc }) => sum + calc.totalPanels, 0);
  const totalWeight = screenCalcs.reduce((sum, { calc }) => sum + calc.totalWeight, 0);

  if (screens.length === 0) {
    return (
      <div className="total-page empty-total">
        <p>No screens defined yet. Add a screen in the Screens tab.</p>
      </div>
    );
  }

  return (
    <div className="total-page">
      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-label">Screens</span>
          <span className="summary-value">{screens.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Panels</span>
          <span className="summary-value">{totalPanels}</span>
        </div>
        <div className="summary-item highlight">
          <span className="summary-label">Total Weight</span>
          <span className="summary-value">{totalWeight.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="screen-breakdown">
        {screenCalcs.map(({ screen, calc }) => (
          <div key={screen.id} className="breakdown-card">
            <div className="breakdown-header">
              <h3>{screen.name}</h3>
              <span className="breakdown-meta">
                {calc.screenWidthMm > 0
                  ? `${(calc.screenWidthMm / 1000).toFixed(2)}m × ${(calc.screenHeightMm / 1000).toFixed(2)}m`
                  : `${screen.widthPanels}×${screen.heightPanels} panels`}
              </span>
            </div>
            <div className="breakdown-body">
              <div className="breakdown-row">
                <span>Panel Type</span>
                <span>{calc.panelType ? calc.panelType.name : <em>None selected</em>}</span>
              </div>
              {calc.panelType && (
                <div className="breakdown-row">
                  <span>Resolution per Panel</span>
                  <span>{calc.panelType.pixelsWide}×{calc.panelType.pixelsTall}px</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>Configuration</span>
                <span>{screen.widthPanels} × {screen.heightPanels} panels</span>
              </div>
              {calc.screenWidthMm > 0 && (
                <div className="breakdown-row">
                  <span>Screen Size</span>
                  <span>{(calc.screenWidthMm / 1000).toFixed(2)}m × {(calc.screenHeightMm / 1000).toFixed(2)}m</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>Total Panels</span>
                <span>{calc.totalPanels}</span>
              </div>
              <div className="breakdown-row">
                <span>Total Weight</span>
                <span>{calc.totalWeight.toFixed(1)} kg</span>
              </div>
              <div className="breakdown-row">
                <span>Mount</span>
                <span>{screen.mountType}</span>
              </div>
              {(screen.mountType === 'Flown' || screen.mountType === 'Roof') && (
                <>
                  <div className="breakdown-row">
                    <span>Rigging Points</span>
                    <span>{screen.riggingPoints} × {screen.hoistCapacity} kg capacity</span>
                  </div>
                  {screen.riggingPoints > 0 && calc.totalWeight > 0 && (
                    <div className={`breakdown-row${calc.udl > screen.hoistCapacity ? ' breakdown-row-warn' : ''}`}>
                      <span>UDL per Hoist</span>
                      <span>
                        {calc.udl.toFixed(1)} kg
                        {calc.udl > screen.hoistCapacity && ' ⚠ exceeds capacity'}
                      </span>
                    </div>
                  )}
                </>
              )}
              {screen.mountType === 'Ground Stacked' && (
                <>
                  {screen.headerSize > 0 && (
                    <div className="breakdown-row">
                      <span>Header</span>
                      <span>{screen.headerSize} panel rows</span>
                    </div>
                  )}
                  {screen.footerSize > 0 && (
                    <div className="breakdown-row">
                      <span>Footer</span>
                      <span>{screen.footerSize} panel rows</span>
                    </div>
                  )}
                  {screen.curveType === 'Curved' && (
                    <div className="breakdown-row">
                      <span>Curve</span>
                      <span>{screen.curveContinuity} — {screen.curveDegree}°</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
