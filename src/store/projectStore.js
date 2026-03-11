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

export function createProject({ quoteId, company, date }) {
  return {
    id: uuidv4(),
    quoteId,
    company,
    date,
    createdAt: new Date().toISOString(),
    screens: [],
  };
}

export function cloneProject(project, newName) {
  return {
    ...JSON.parse(JSON.stringify(project)),
    id: uuidv4(),
    quoteId: newName || `${project.quoteId} (Copy)`,
    createdAt: new Date().toISOString(),
  };
}

export const PANEL_TYPES = [
  { id: 'p3', name: 'P3 Indoor', pitch: 3, width: 500, height: 500, price: 450 },
  { id: 'p3-9', name: 'P3.9 Indoor', pitch: 3.9, width: 500, height: 500, price: 380 },
  { id: 'p4', name: 'P4 Indoor', pitch: 4, width: 500, height: 500, price: 320 },
  { id: 'p5', name: 'P5 Outdoor', pitch: 5, width: 500, height: 500, price: 280 },
  { id: 'p6', name: 'P6 Outdoor', pitch: 6, width: 500, height: 500, price: 240 },
  { id: 'p8', name: 'P8 Outdoor', pitch: 8, width: 500, height: 500, price: 200 },
  { id: 'p10', name: 'P10 Outdoor', pitch: 10, width: 500, height: 500, price: 160 },
];

export const MOUNT_TYPES = ['Flown', 'Ground Stacked', 'Roof'];
export const CURVE_TYPES = ['Flat', 'Curved'];
export const CURVE_CONTINUITY = ['Continuous', 'Non-Continuous'];

export function createScreen() {
  return {
    id: uuidv4(),
    name: 'New Screen',
    panelTypeId: PANEL_TYPES[0].id,
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
    riggingPricePerPoint: 150,
  };
}

export function calculateScreen(screen, panelTypes) {
  const panelType = panelTypes.find((p) => p.id === screen.panelTypeId) || panelTypes[0];
  const totalPanels = screen.widthPanels * screen.heightPanels;
  const panelsCost = totalPanels * panelType.price;
  const riggingCost = screen.mountType === 'Flown' || screen.mountType === 'Roof'
    ? screen.riggingPoints * screen.riggingPricePerPoint
    : 0;
  const screenWidthMm = screen.widthPanels * panelType.width;
  const screenHeightMm = screen.heightPanels * panelType.height;
  return {
    panelType,
    totalPanels,
    panelsCost,
    riggingCost,
    totalCost: panelsCost + riggingCost,
    screenWidthMm,
    screenHeightMm,
  };
}
