import { PANEL_TYPES, calculateScreen } from '../../store/projectStore';
import './TotalPage.css';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function TotalPage({ screens, panelTypes }) {
  const allPanelTypes = [...PANEL_TYPES, ...panelTypes];

  const screenCalcs = screens.map((screen) => ({
    screen,
    calc: calculateScreen(screen, allPanelTypes),
  }));

  const grandTotal = screenCalcs.reduce((sum, { calc }) => sum + calc.totalCost, 0);
  const totalPanels = screenCalcs.reduce((sum, { calc }) => sum + calc.totalPanels, 0);
  const totalRigging = screenCalcs.reduce((sum, { calc }) => sum + calc.riggingCost, 0);

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
        <div className="summary-item">
          <span className="summary-label">Rigging</span>
          <span className="summary-value">{fmt(totalRigging)}</span>
        </div>
        <div className="summary-item highlight">
          <span className="summary-label">Grand Total</span>
          <span className="summary-value">{fmt(grandTotal)}</span>
        </div>
      </div>

      <div className="screen-breakdown">
        {screenCalcs.map(({ screen, calc }) => (
          <div key={screen.id} className="breakdown-card">
            <div className="breakdown-header">
              <h3>{screen.name}</h3>
              <span className="breakdown-total">{fmt(calc.totalCost)}</span>
            </div>
            <div className="breakdown-body">
              <div className="breakdown-row">
                <span>Panel Type</span>
                <span>{calc.panelType.name}</span>
              </div>
              <div className="breakdown-row">
                <span>Configuration</span>
                <span>{screen.widthPanels} × {screen.heightPanels} panels</span>
              </div>
              <div className="breakdown-row">
                <span>Screen Size</span>
                <span>
                  {(calc.screenWidthMm / 1000).toFixed(2)}m × {(calc.screenHeightMm / 1000).toFixed(2)}m
                </span>
              </div>
              <div className="breakdown-row">
                <span>Total Panels</span>
                <span>{calc.totalPanels}</span>
              </div>
              <div className="breakdown-row">
                <span>Panel Cost</span>
                <span>{fmt(calc.panelsCost)}</span>
              </div>
              <div className="breakdown-row">
                <span>Mount</span>
                <span>{screen.mountType}</span>
              </div>
              {calc.riggingCost > 0 && (
                <div className="breakdown-row">
                  <span>Rigging ({screen.riggingPoints} pts)</span>
                  <span>{fmt(calc.riggingCost)}</span>
                </div>
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
                      <span>
                        {screen.curveContinuity} — {screen.curveDegree}°
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="breakdown-row total-row">
                <span>Screen Total</span>
                <span>{fmt(calc.totalCost)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
