import { v4 as uuidv4 } from 'uuid';

// Pure, React-free data-cable layout generation. A "string" is one cable
// run: an ordered list of {col, row} panel positions (0-indexed, top-left
// origin), each panel belonging to at most one string.

export const CABLE_PATTERNS = [
  { id: 'columnComb', label: 'Column comb' },
  { id: 'rowComb', label: 'Row comb' },
  { id: 'serpentineColumns', label: 'Serpentine (columns)' },
  { id: 'serpentineRows', label: 'Serpentine (rows)' },
];

function chunk(list, size) {
  if (size <= 0 || !Number.isFinite(size)) return [list];
  const chunks = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

// One string per column (or per capacity-sized slice of a column), top to bottom, left to right.
function columnCombPositions(widthPanels, heightPanels, fixturesPerPort) {
  const strings = [];
  for (let col = 0; col < widthPanels; col++) {
    const column = Array.from({ length: heightPanels }, (_, row) => ({ col, row }));
    for (const part of chunk(column, fixturesPerPort)) {
      strings.push({ id: uuidv4(), path: part });
    }
  }
  return strings;
}

// One string per row (or per capacity-sized slice of a row), left to right, top to bottom.
function rowCombPositions(widthPanels, heightPanels, fixturesPerPort) {
  const strings = [];
  for (let row = 0; row < heightPanels; row++) {
    const rowCells = Array.from({ length: widthPanels }, (_, col) => ({ col, row }));
    for (const part of chunk(rowCells, fixturesPerPort)) {
      strings.push({ id: uuidv4(), path: part });
    }
  }
  return strings;
}

// Continuous boustrophedon (zigzag) visiting order down/up each column, then sliced into
// fixturesPerPort-sized strings so a run can continue across a column boundary.
function serpentineColumnsOrder(widthPanels, heightPanels) {
  const order = [];
  for (let col = 0; col < widthPanels; col++) {
    if (col % 2 === 0) {
      for (let row = 0; row < heightPanels; row++) order.push({ col, row });
    } else {
      for (let row = heightPanels - 1; row >= 0; row--) order.push({ col, row });
    }
  }
  return order;
}

// Same idea, zigzagging left/right across each row instead.
function serpentineRowsOrder(widthPanels, heightPanels) {
  const order = [];
  for (let row = 0; row < heightPanels; row++) {
    if (row % 2 === 0) {
      for (let col = 0; col < widthPanels; col++) order.push({ col, row });
    } else {
      for (let col = widthPanels - 1; col >= 0; col--) order.push({ col, row });
    }
  }
  return order;
}

export function generateCabling(widthPanels, heightPanels, fixturesPerPort, pattern) {
  let strings;
  switch (pattern) {
    case 'rowComb':
      strings = rowCombPositions(widthPanels, heightPanels, fixturesPerPort);
      break;
    case 'serpentineColumns':
      strings = chunk(serpentineColumnsOrder(widthPanels, heightPanels), fixturesPerPort).map((path) => ({
        id: uuidv4(),
        path,
      }));
      break;
    case 'serpentineRows':
      strings = chunk(serpentineRowsOrder(widthPanels, heightPanels), fixturesPerPort).map((path) => ({
        id: uuidv4(),
        path,
      }));
      break;
    case 'columnComb':
    default:
      strings = columnCombPositions(widthPanels, heightPanels, fixturesPerPort);
      pattern = 'columnComb';
      break;
  }
  return { pattern, strings };
}

// A string is "over capacity" if it has more panels than the current port can carry.
export function isStringOverCapacity(string, fixturesPerPort) {
  return fixturesPerPort > 0 && string.path.length > fixturesPerPort;
}

// A string references a position outside the current screen's grid (e.g. after resizing).
export function isStringOutOfBounds(string, widthPanels, heightPanels) {
  return string.path.some((p) => p.col < 0 || p.col >= widthPanels || p.row < 0 || p.row >= heightPanels);
}
