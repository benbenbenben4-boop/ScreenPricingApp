import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadProjects, saveProjects, createScreen, clearPanelTypeReferences, DEFAULT_WIRING } from '../../store/projectStore';
import { loadPanelTypes, savePanelTypes } from '../../store/panelTypeStore';
import ScreenDefinition from './ScreenDefinition';
import TotalPage from './TotalPage';
import WiringPage from './WiringPage';
import './DesignerPage.css';

function ScreenListItem({ screen, selected, sub, onSelect, onDelete, onRename }) {
  const [value, setValue] = useState(null); // non-null while editing

  function startEditing() {
    setValue(screen.name);
  }

  function commit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== screen.name) onRename(trimmed);
    setValue(null);
  }

  return (
    <div className={`screen-item ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="screen-item-info">
        {value !== null ? (
          <input
            className="screen-item-rename-input"
            value={value}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setValue(null);
            }}
          />
        ) : (
          <span
            className="screen-item-name"
            onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
            title="Double-click to rename"
          >
            {screen.name}
          </span>
        )}
        <span className="screen-item-sub">{sub}</span>
      </div>
      <button className="btn-danger btn-icon" title="Delete screen" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        ×
      </button>
    </div>
  );
}

export default function DesignerPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => loadProjects());
  const project = projects.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState('screens');
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  // Panel types are a shared library across all projects (Settings page).
  const [panelTypes, setPanelTypes] = useState(() => loadPanelTypes());

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

  // Save a panel type (add or edit) to the shared library and select it on the current screen.
  function savePanelTypeAndSelect(newTypes, panelTypeId) {
    savePanelTypes(newTypes);
    setPanelTypes(newTypes);
    const screens = project.screens.map((s) =>
      s.id === selectedScreenId ? { ...s, panelTypeId } : s
    );
    updateProject({ ...project, screens });
  }

  function deletePanelType(panelTypeId) {
    const newTypes = panelTypes.filter((p) => p.id !== panelTypeId);
    savePanelTypes(newTypes);
    setPanelTypes(newTypes);
    clearPanelTypeReferences(panelTypeId);
    setProjects(loadProjects());
  }

  function renameScreen(screenId, name) {
    const screens = project.screens.map((s) => (s.id === screenId ? { ...s, name } : s));
    updateProject({ ...project, screens });
  }

  const selectedScreen = project.screens?.find((s) => s.id === selectedScreenId);
  const wiring = project.wiring || DEFAULT_WIRING;

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
            className={`tab-btn ${activeTab === 'wiring' ? 'active' : ''}`}
            onClick={() => setActiveTab('wiring')}
          >
            Wiring
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
            <TotalPage screens={project.screens || []} panelTypes={panelTypes} wiring={wiring} />
          </div>
        ) : activeTab === 'wiring' ? (
          <WiringPage
            screens={project.screens || []}
            panelTypes={panelTypes}
            wiring={wiring}
            onUpdateWiring={(newWiring) => updateProject({ ...project, wiring: newWiring })}
          />
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
                  const pt = panelTypes.find((p) => p.id === screen.panelTypeId);
                  const sub = pt
                    ? `${((screen.widthPanels * pt.width) / 1000).toFixed(2)}m × ${((screen.heightPanels * pt.height) / 1000).toFixed(2)}m · ${screen.widthPanels * pt.pixelsWide}×${screen.heightPanels * pt.pixelsTall}px`
                    : `${screen.widthPanels}×${screen.heightPanels} · ${screen.mountType}`;
                  return (
                    <ScreenListItem
                      key={screen.id}
                      screen={screen}
                      selected={selectedScreenId === screen.id}
                      sub={sub}
                      onSelect={() => setSelectedScreenId(screen.id)}
                      onDelete={() => deleteScreen(screen.id)}
                      onRename={(name) => renameScreen(screen.id, name)}
                    />
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
                    panelTypes={panelTypes}
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
