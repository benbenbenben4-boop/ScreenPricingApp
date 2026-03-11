import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadProjects, saveProjects, createScreen, PANEL_TYPES } from '../../store/projectStore';
import ScreenDefinition from './ScreenDefinition';
import TotalPage from './TotalPage';
import './DesignerPage.css';

export default function DesignerPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => loadProjects());
  const project = projects.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState('screens');
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  // Custom panel types stored per project (in project.customPanelTypes)
  const customPanelTypes = project?.customPanelTypes || [];

  useEffect(() => {
    if (project?.screens?.length > 0 && !selectedScreenId) {
      setSelectedScreenId(project.screens[0].id);
    }
  }, [project, selectedScreenId]);

  if (!project) {
    return (
      <div className="designer-error">
        <p>Project not found.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Projects</button>
      </div>
    );
  }

  function updateProject(updated) {
    const newProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    saveProjects(newProjects);
    setProjects(newProjects);
  }

  function addScreen() {
    const screen = createScreen();
    screen.name = `Screen ${(project.screens?.length || 0) + 1}`;
    const updated = { ...project, screens: [...(project.screens || []), screen] };
    updateProject(updated);
    setSelectedScreenId(screen.id);
    setActiveTab('screens');
  }

  function deleteScreen(screenId) {
    const screens = project.screens.filter((s) => s.id !== screenId);
    updateProject({ ...project, screens });
    if (selectedScreenId === screenId) {
      setSelectedScreenId(screens[0]?.id || null);
    }
  }

  function updateScreen(updatedScreen) {
    const screens = project.screens.map((s) => (s.id === updatedScreen.id ? updatedScreen : s));
    updateProject({ ...project, screens });
  }

  // Save a panel type (add or edit) and atomically select it on the current screen.
  // Combines both updates in one updateProject call to avoid stale closure overwrites.
  function savePanelTypeAndSelect(newTypes, panelTypeId) {
    const screens = project.screens.map((s) =>
      s.id === selectedScreenId ? { ...s, panelTypeId } : s
    );
    updateProject({ ...project, customPanelTypes: newTypes, screens });
  }

  function deletePanelType(panelTypeId) {
    const newTypes = (project.customPanelTypes || []).filter((p) => p.id !== panelTypeId);
    const fallbackId = PANEL_TYPES[0].id;
    const screens = project.screens.map((s) =>
      s.panelTypeId === panelTypeId ? { ...s, panelTypeId: fallbackId } : s
    );
    updateProject({ ...project, customPanelTypes: newTypes, screens });
  }

  function renameScreen(screenId, name) {
    const screens = project.screens.map((s) => (s.id === screenId ? { ...s, name } : s));
    updateProject({ ...project, screens });
  }

  const selectedScreen = project.screens?.find((s) => s.id === selectedScreenId);

  return (
    <div className="designer-page">
      {/* Top bar */}
      <header className="designer-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Projects</button>
        <div className="project-title">
          <span className="quote-id">{project.quoteId}</span>
          <span className="company-name">{project.company}</span>
        </div>
        <div className="header-tabs">
          <button
            className={`tab-btn ${activeTab === 'screens' ? 'active' : ''}`}
            onClick={() => setActiveTab('screens')}
          >
            Screens
          </button>
          <button
            className={`tab-btn ${activeTab === 'total' ? 'active' : ''}`}
            onClick={() => setActiveTab('total')}
          >
            Total
          </button>
        </div>
      </header>

      <div className="designer-body">
        {activeTab === 'total' ? (
          <div className="total-wrapper">
            <TotalPage screens={project.screens || []} panelTypes={customPanelTypes} />
          </div>
        ) : (
          <div className="screens-layout">
            {/* Screen list sidebar */}
            <aside className="screen-sidebar">
              <div className="sidebar-header">
                <span>Screens</span>
                <button className="btn-primary btn-sm" onClick={addScreen}>+ Add</button>
              </div>
              <div className="screen-list">
                {(project.screens || []).length === 0 && (
                  <p className="sidebar-empty">No screens yet.</p>
                )}
                {(project.screens || []).map((screen) => {
                  const allTypes = [...PANEL_TYPES, ...customPanelTypes];
                  const pt = allTypes.find((p) => p.id === screen.panelTypeId) || allTypes[0];
                  const wM = ((screen.widthPanels * pt.width) / 1000).toFixed(2);
                  const hM = ((screen.heightPanels * pt.height) / 1000).toFixed(2);
                  return (
                  <div
                    key={screen.id}
                    className={`screen-item ${selectedScreenId === screen.id ? 'selected' : ''}`}
                    onClick={() => setSelectedScreenId(screen.id)}
                  >
                    <div className="screen-item-info">
                      <span className="screen-item-name">{screen.name}</span>
                      <span className="screen-item-sub">
                        {wM}m × {hM}m · {screen.mountType}
                      </span>
                    </div>
                    <button
                      className="btn-danger btn-icon"
                      title="Delete screen"
                      onClick={(e) => { e.stopPropagation(); deleteScreen(screen.id); }}
                    >
                      ×
                    </button>
                  </div>
                  );
                })}
              </div>
            </aside>

            {/* Screen editor */}
            <main className="screen-editor">
              {selectedScreen ? (
                <>
                  <div className="editor-top">
                    <input
                      className="screen-name-input"
                      value={selectedScreen.name}
                      onChange={(e) => renameScreen(selectedScreen.id, e.target.value)}
                    />
                  </div>
                  <ScreenDefinition
                    screen={selectedScreen}
                    panelTypes={customPanelTypes}
                    onUpdateScreen={updateScreen}
                    onSavePanelType={savePanelTypeAndSelect}
                    onDeletePanelType={deletePanelType}
                  />
                </>
              ) : (
                <div className="editor-empty">
                  <p>Select a screen from the sidebar or add a new one.</p>
                  <button className="btn-primary" onClick={addScreen}>+ Add Screen</button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
