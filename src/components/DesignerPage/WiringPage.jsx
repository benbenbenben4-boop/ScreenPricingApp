import { useState } from 'react';
import WiringDataPage from './WiringDataPage';
import WiringPowerPage from './WiringPowerPage';
import './WiringPage.css';

export default function WiringPage({ screens, panelTypes, wiring, onUpdateWiring }) {
  const [subTab, setSubTab] = useState('data');

  return (
    <div className="wiring-page">
      <div className="wiring-subtabs">
        <button
          className={`subtab-btn ${subTab === 'data' ? 'active' : ''}`}
          onClick={() => setSubTab('data')}
        >
          Data
        </button>
        <button
          className={`subtab-btn ${subTab === 'power' ? 'active' : ''}`}
          onClick={() => setSubTab('power')}
        >
          Power
        </button>
      </div>

      {subTab === 'data' ? (
        <WiringDataPage
          screens={screens}
          panelTypes={panelTypes}
          settings={wiring.data}
          onUpdateSettings={(data) => onUpdateWiring({ ...wiring, data })}
        />
      ) : (
        <WiringPowerPage
          screens={screens}
          panelTypes={panelTypes}
          power={wiring.power}
          onUpdatePower={(power) => onUpdateWiring({ ...wiring, power })}
        />
      )}
    </div>
  );
}
