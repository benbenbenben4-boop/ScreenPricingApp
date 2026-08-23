import { v4 as uuidv4 } from 'uuid';
import { loadProjects } from './projectStore';

const PANEL_TYPES_KEY = 'screen_pricing_panel_types';

// Panel shape: { id, name, pixelsWide, pixelsTall, width (mm), height (mm), weight (kg), watts (W) }

export function loadPanelTypes() {
  const raw = localStorage.getItem(PANEL_TYPES_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return migrateLegacyPanelTypes();
}

// Older versions stored panel types per-project (project.customPanelTypes).
// The first time there's no global list yet, pull any of those in so existing
// projects keep working with a shared library.
function migrateLegacyPanelTypes() {
  const seen = new Set();
  const merged = [];
  for (const project of loadProjects()) {
    for (const panelType of project.customPanelTypes || []) {
      if (!seen.has(panelType.id)) {
        seen.add(panelType.id);
        merged.push(panelType);
      }
    }
  }
  if (merged.length > 0) savePanelTypes(merged);
  return merged;
}

export function savePanelTypes(panelTypes) {
  localStorage.setItem(PANEL_TYPES_KEY, JSON.stringify(panelTypes));
}

export function createPanelType(data) {
  return { id: uuidv4(), ...data };
}
