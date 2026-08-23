import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'screen_pricing_projects';

export function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// Wiring settings default to one processor config applied to every screen in
// the project (Data), and a list of power circuits screens can be assigned
// to (Power). Older projects loaded without a `wiring` field fall back to
// this via `project.wiring || DEFAULT_WIRING`, same pattern as `screens || []`.
export const DEFAULT_WIRING = {
  data: {
    processorModel: null,
    bitDepth: 10,
    frameRate: 60,
    usingRedundancy: false,
    usingUll: false,
    usingSwitches: false,
    usingFailover: false,
  },
  power: {
    circuits: [],
  },
};

export function createProject({ quoteId, company, date }) {
  return {
    id: uuidv4(),
    quoteId,
    company,
    date,
    createdAt: new Date().toISOString(),
    screens: [],
    wiring: DEFAULT_WIRING,
  };
}

// Clears panelTypeId across every project's screens that reference the given
// panel type — used when a panel type is deleted from the shared library.
export function clearPanelTypeReferences(panelTypeId) {
  const projects = loadProjects();
  const updated = projects.map((project) => {
    if (!(project.screens || []).some((s) => s.panelTypeId === panelTypeId)) return project;
    const screens = project.screens.map((s) =>
      s.panelTypeId === panelTypeId ? { ...s, panelTypeId: null } : s
    );
    return { ...project, screens };
  });
  saveProjects(updated);
}

export function cloneProject(project, newName) {
  return {
    ...JSON.parse(JSON.stringify(project)),
    id: uuidv4(),
    quoteId: newName || `${project.quoteId} (Copy)`,
    createdAt: new Date().toISOString(),
  };
}

// Panel types are fully user-defined per project (stored in project.customPanelTypes).
// Panel shape: { id, name, pixelsWide, pixelsTall, width (mm), height (mm), weight (kg), watts (W) }

export const MOUNT_TYPES = ['Flown', 'Ground Stacked', 'Roof'];
export const CURVE_TYPES = ['Flat', 'Curved'];
export const CURVE_CONTINUITY = ['Continuous', 'Non-Continuous'];

export function createScreen() {
  return {
    id: uuidv4(),
    name: 'New Screen',
    panelTypeId: null,
    widthPanels: 6,
    heightPanels: 4,
    mountType: 'Flown',
    headerSize: 0,
    footerSize: 0,
    curveType: 'Flat',
    curveDegree: 0,
    curveContinuity: 'Continuous',
    columnAngles: [],
    riggingPoints: 2,
    hoistCapacity: 1000,
  };
}

export function calculateScreen(screen, panelTypes) {
  const panelType = panelTypes.find((p) => p.id === screen.panelTypeId);
  const totalPanels = screen.widthPanels * screen.heightPanels;

  if (!panelType) {
    return {
      panelType: null,
      totalPanels,
      totalWeight: 0,
      udl: 0,
      screenWidthMm: 0,
      screenHeightMm: 0,
      totalWatts: 0,
      totalAmps: 0,
      perPhaseAmps: 0,
    };
  }

  const totalWeight = totalPanels * (panelType.weight || 0);
  const riggingPoints = screen.riggingPoints || 0;
  const udl = riggingPoints > 0 ? totalWeight / riggingPoints : 0;
  const screenWidthMm = screen.widthPanels * panelType.width;
  const screenHeightMm = screen.heightPanels * panelType.height;

  // Ground stack rigging counts
  // footerSize = 1 or 2 (panels wide per footer unit); 0 = none
  const footerSize = screen.footerSize || 0;
  let footerCount = 0;
  let rearFooterCount = 0;
  let totalUprights = 0;
  let totalGrabs = 0;

  if (screen.mountType === 'Ground Stacked' && footerSize > 0) {
    footerCount = Math.round(screen.widthPanels / footerSize);
    rearFooterCount = footerSize === 1 ? footerCount : footerCount + 1;
    const screenHeightM = screenHeightMm / 1000;
    const uprightsPerCol = screenHeightM > 0.5 ? Math.floor(screenHeightM) : 0;
    totalUprights = rearFooterCount * uprightsPerCol;
    totalGrabs = totalUprights;
  }

  // Angle blocks: footerCount × (heightPanels − footerSize) × 2
  const angleBlocks = (screen.mountType === 'Ground Stacked' && screen.curveType === 'Curved' && footerSize > 0)
    ? footerCount * (screen.heightPanels - footerSize) * 2
    : 0;

  // Power calculations (230 V supply)
  const totalWatts = totalPanels * (panelType.watts || 0);
  const totalAmps = totalWatts / 230;
  const perPhaseAmps = totalAmps / 3;

  return {
    panelType,
    totalPanels,
    totalWeight,
    udl,
    screenWidthMm,
    screenHeightMm,
    footerCount,
    rearFooterCount,
    totalUprights,
    totalGrabs,
    angleBlocks,
    totalWatts,
    totalAmps,
    perPhaseAmps,
  };
}
