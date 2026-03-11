import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, cloneProject, loadProjects, saveProjects } from '../../store/projectStore';
import { VERSION } from '../../version';
import './OpenPage.css';

function NewProjectModal({ onClose, onCreate }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ quoteId: '', company: '', date: today });
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.quoteId.trim()) { setError('Quote ID is required'); return; }
    if (!form.company.trim()) { setError('Company is required'); return; }
    onCreate(form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Project</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Quote ID
            <input
              type="text"
              value={form.quoteId}
              onChange={(e) => setForm({ ...form, quoteId: e.target.value })}
              placeholder="e.g. QT-2024-001"
              autoFocus
            />
          </label>
          <label>
            Company
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Client company name"
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Project</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CloneModal({ project, onClose, onClone }) {
  const [newName, setNewName] = useState(`${project.quoteId} (Copy)`);

  function handleSubmit(e) {
    e.preventDefault();
    onClone(newName);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Clone Project</h2>
        <form onSubmit={handleSubmit}>
          <label>
            New Quote ID
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Clone</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ project, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Project</h2>
        <p>Are you sure you want to delete <strong>{project.quoteId}</strong> — {project.company}?</p>
        <p className="delete-warning">This action cannot be undone.</p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function OpenPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => loadProjects());
  const [showNew, setShowNew] = useState(false);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleCreate(form) {
    const project = createProject(form);
    const updated = [...projects, project];
    saveProjects(updated);
    setProjects(updated);
    setShowNew(false);
    navigate(`/designer/${project.id}`);
  }

  function handleLoad(project) {
    navigate(`/designer/${project.id}`);
  }

  function handleDelete(project) {
    const updated = projects.filter((p) => p.id !== project.id);
    saveProjects(updated);
    setProjects(updated);
    setDeleteTarget(null);
  }

  function handleClone(newName) {
    const cloned = cloneProject(cloneTarget, newName);
    const updated = [...projects, cloned];
    saveProjects(updated);
    setProjects(updated);
    setCloneTarget(null);
  }

  return (
    <div className="open-page">
      <header className="open-header">
        <h1>Screen Pricing <span className="version-badge">{VERSION}</span></h1>
        <p className="subtitle">LED Screen Configuration &amp; Quoting Tool</p>
      </header>

      <div className="open-actions">
        <button className="btn-primary btn-large" onClick={() => setShowNew(true)}>
          + New Project
        </button>
      </div>

      <section className="projects-section">
        <h2>Previous Projects</h2>
        {projects.length === 0 ? (
          <p className="empty-state">No projects yet. Create your first project above.</p>
        ) : (
          <div className="project-list">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-info">
                  <span className="project-quote-id">{project.quoteId}</span>
                  <span className="project-company">{project.company}</span>
                  <span className="project-date">{project.date}</span>
                  <span className="project-screens">
                    {project.screens?.length || 0} screen{(project.screens?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="project-card-actions">
                  <button className="btn-primary btn-sm" onClick={() => handleLoad(project)}>
                    Load
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => setCloneTarget(project)}>
                    Clone
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => setDeleteTarget(project)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreate={handleCreate} />}
      {cloneTarget && (
        <CloneModal
          project={cloneTarget}
          onClose={() => setCloneTarget(null)}
          onClone={handleClone}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}
