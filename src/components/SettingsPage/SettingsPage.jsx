import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPanelTypes, savePanelTypes } from '../../store/panelTypeStore';
import { clearPanelTypeReferences } from '../../store/projectStore';
import PanelTypeModal from '../PanelTypeModal';
import PanelLibraryModal from '../PanelLibraryModal';
import './SettingsPage.css';

function DeletePanelTypeModal({ panelType, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Panel Type</h2>
        <p>Are you sure you want to delete <strong>{panelType.name}</strong>?</p>
        <p className="delete-warning">
          Any screens using this panel type across all projects will be reset to no panel type selected.
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [panelTypes, setPanelTypes] = useState(() => loadPanelTypes());
  const [showAdd, setShowAdd] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryDraft, setLibraryDraft] = useState(null);
  const [editingPanel, setEditingPanel] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState('');

  const filteredPanelTypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return panelTypes;
    return panelTypes.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.manufacturer || '').toLowerCase().includes(q)
    );
  }, [panelTypes, query]);

  function handleSave(panelType) {
    const exists = panelTypes.find((p) => p.id === panelType.id);
    const updated = exists
      ? panelTypes.map((p) => (p.id === panelType.id ? panelType : p))
      : [...panelTypes, panelType];
    savePanelTypes(updated);
    setPanelTypes(updated);
    setShowAdd(false);
    setEditingPanel(null);
    setLibraryDraft(null);
  }

  function handleDelete() {
    const updated = panelTypes.filter((p) => p.id !== deleteTarget.id);
    savePanelTypes(updated);
    setPanelTypes(updated);
    clearPanelTypeReferences(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleLibrarySelect(draft) {
    setShowLibrary(false);
    setLibraryDraft(draft);
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        <h1>Settings</h1>
      </header>

      <div className="settings-body">
        <section className="settings-section">
          <div className="settings-section-header">
            <div>
              <h2>Panel Types</h2>
              <p className="settings-section-desc">
                Define the LED panel types available when building screens. These are shared across all projects.
              </p>
            </div>
            <div className="settings-section-actions">
              <button className="btn-secondary btn-sm" onClick={() => setShowLibrary(true)}>
                Browse Library
              </button>
              <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                + Add Panel Type
              </button>
            </div>
          </div>

          {panelTypes.length > 0 && (
            <input
              className="panel-type-search"
              type="text"
              placeholder="Search by name or manufacturer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}

          {panelTypes.length === 0 ? (
            <p className="empty-state">No panel types yet. Add one, or browse the library above.</p>
          ) : filteredPanelTypes.length === 0 ? (
            <p className="empty-state">No panel types match "{query}".</p>
          ) : (
            <div className="panel-type-list">
              {filteredPanelTypes.map((p) => (
                <div key={p.id} className="panel-type-card">
                  <div className="panel-type-info">
                    <span className="panel-type-name">
                      {p.name}
                      {p.manufacturer && <span className="panel-type-manu"> — {p.manufacturer}</span>}
                    </span>
                    <span className="panel-type-spec">
                      {p.pixelsWide}×{p.pixelsTall}px &nbsp;·&nbsp; {p.width}×{p.height}mm &nbsp;·&nbsp; {p.weight}kg &nbsp;·&nbsp; {p.watts}W
                    </span>
                  </div>
                  <div className="panel-type-actions">
                    <button className="btn-secondary btn-sm" onClick={() => setEditingPanel(p)}>Edit</button>
                    <button className="btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showLibrary && (
        <PanelLibraryModal onClose={() => setShowLibrary(false)} onSelect={handleLibrarySelect} />
      )}
      {(showAdd || editingPanel || libraryDraft) && (
        <PanelTypeModal
          existing={editingPanel}
          initial={libraryDraft}
          onClose={() => { setShowAdd(false); setEditingPanel(null); setLibraryDraft(null); }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeletePanelTypeModal
          panelType={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
