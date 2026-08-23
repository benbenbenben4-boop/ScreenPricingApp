import { useState, useEffect, useMemo } from 'react';
import './PanelLibraryModal.css';

export default function PanelLibraryModal({ onClose, onSelect }) {
  const [fixtures, setFixtures] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    import('../data/bromptonFixtures.json')
      .then((mod) => setFixtures(mod.default))
      .catch(() => setError(true));
  }, []);

  const results = useMemo(() => {
    if (!fixtures) return [];
    const q = query.trim().toLowerCase();
    if (!q) return fixtures.slice(0, 200);
    return fixtures
      .filter((f) => f.name.toLowerCase().includes(q) || f.manufacturer.toLowerCase().includes(q))
      .slice(0, 200);
  }, [fixtures, query]);

  function handlePick(fixture) {
    onSelect({
      manufacturer: fixture.manufacturer,
      name: fixture.name,
      pixelsWide: fixture.pixelsWide,
      pixelsTall: fixture.pixelsTall,
      width: fixture.width,
      height: fixture.height,
      pitch: fixture.pitch,
      loadPenalty: fixture.loadPenalty,
      weight: 0,
      watts: 0,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal panel-library-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Panel Library</h2>
        <input
          className="library-search"
          type="text"
          placeholder="Search by name or manufacturer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {error && <p className="form-error">Couldn't load the panel library.</p>}
        {!error && !fixtures && <p className="library-status">Loading library…</p>}

        {fixtures && (
          <>
            <p className="library-status">
              {results.length} of {fixtures.length} panels{!query && ' · type to search'}
            </p>
            <div className="library-results">
              {results.map((f) => (
                <button key={f.id} type="button" className="library-row" onClick={() => handlePick(f)}>
                  <span className="library-row-name">{f.name}</span>
                  <span className="library-row-manu">{f.manufacturer}</span>
                  <span className="library-row-spec">
                    {f.pixelsWide}×{f.pixelsTall}px · {f.width}×{f.height}mm
                  </span>
                </button>
              ))}
              {results.length === 0 && <p className="library-empty">No panels match "{query}".</p>}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
