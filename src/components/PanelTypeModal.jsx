import { useState } from 'react';
import { createPanelType } from '../store/panelTypeStore';

export default function PanelTypeModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState(
    existing || { name: '', pixelsWide: 0, pixelsTall: 0, width: 500, height: 500, weight: 0, watts: 0 }
  );

  function handleSubmit(e) {
    e.preventDefault();
    onSave(existing ? { ...form, id: existing.id } : createPanelType(form));
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
          <div className="form-row">
            <label>
              Weight per Panel (kg)
              <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })} required />
            </label>
            <label>
              Power per Panel (W)
              <input type="number" min="0" step="1" value={form.watts} onChange={(e) => setForm({ ...form, watts: parseFloat(e.target.value) || 0 })} required />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
