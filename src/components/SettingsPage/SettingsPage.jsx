import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPanelTypes, savePanelTypes } from '../../store/panelTypeStore';
import { clearPanelTypeReferences } from '../../store/projectStore';
import PanelTypeModal from '../PanelTypeModal';
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
  const [editingPanel, setEditingPanel] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleSave(panelType) {
    const exists = panelTypes.find((p) => p.id === panelType.id);
    const updated = exists
      ? panelTypes.map((p) => (p.id === panelType.id ? panelType : p))
      : [...panelTypes, panelType];
    savePanelTypes(updated);
    setPanelTypes(updated);
    setShowAdd(false);
    setEditingPanel(null);
  }

  function handleDelete() {
    const updated = panelTypes.filter((p) => p.id !== deleteTarget.id);
    savePanelTypes(updated);
    setPanelTypes(updated);
    clearPanelTypeReferences(deleteTarget.id);
    setDeleteTarget(null);
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
            <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Add Panel Type
            </button>
          </div>

          {panelTypes.length === 0 ? (
            <p className="empty-state">No panel types yet. Add your first one above.</p>
          ) : (
            <div className="panel-type-list">
              {panelTypes.map((p) => (
                <div key={p.id} className="panel-type-card">
                  <div className="panel-type-info">
                    <span className="panel-type-name">{p.name}</span>
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

      {(showAdd || editingPanel) && (
        <PanelTypeModal
          existing={editingPanel}
          onClose={() => { setShowAdd(false); setEditingPanel(null); }}
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
