import { v4 as uuidv4 } from 'uuid';

// Pure, React-free data-cable layout generation. A "string" is one cable
// run: an ordered list of {col, row} panel positions (0-indexed, top-left
// origin), each panel belonging to at most one string.

export const PATTERN_TYPES = [
  { id: 'serpentineRows', label: 'Serpentine (rows)' },
  { id: 'serpentineColumns', label: 'Serpentine (columns)' },
  { id: 'rowComb', label: 'Row comb' },
  { id: 'columnComb', label: 'Column comb' },
];

export const START_CORNERS = [
  { id: 'top-left', label: 'Top-left' },
  { id: 'top-right', label: 'Top-right' },
  { id: 'bottom-left', label: 'Bottom-left' },
  { id: 'bottom-right', label: 'Bottom-right' },
];

// The 16 standard direction presets (4 pattern types × 4 start corners),
// grouped the way tools like led.fyi/Novastar/Brompton present them:
// continuous serpentine runs first, independent per-row/column combs second.
export const CABLE_PRESETS = PATTERN_TYPES.flatMap((pt) =>
  START_CORNERS.map((corner) => ({
    id: `${pt.id}:${corner.id}`,
    patternType: pt.id,
    corner: corner.id,
    label: `${pt.label} · ${corner.label}`,
  }))
);

function chunk(list, size) {
  if (size <= 0 || !Number.isFinite(size)) return [list];
  const chunks = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

// 0..n-1, or reversed (n-1..0) when `reversed` is true.
function orderRange(n, reversed) {
  const range = Array.from({ length: n }, (_, i) => i);
  return reversed ? range.reverse() : range;
}

// One string per column (or per capacity-sized slice of a column), starting from the given corner.
function columnCombPositions(widthPanels, heightPanels, fixturesPerPort, corner) {
  const colOrder = orderRange(widthPanels, corner.includes('right'));
  const rowsReversed = corner.includes('bottom');
  const strings = [];
  for (const col of colOrder) {
    const column = orderRange(heightPanels, rowsReversed).map((row) => ({ col, row }));
    for (const part of chunk(column, fixturesPerPort)) {
      strings.push({ id: uuidv4(), path: part });
    }
  }
  return strings;
}

// One string per row (or per capacity-sized slice of a row), starting from the given corner.
function rowCombPositions(widthPanels, heightPanels, fixturesPerPort, corner) {
  const rowOrder = orderRange(heightPanels, corner.includes('bottom'));
  const colsReversed = corner.includes('right');
  const strings = [];
  for (const row of rowOrder) {
    const rowCells = orderRange(widthPanels, colsReversed).map((col) => ({ col, row }));
    for (const part of chunk(rowCells, fixturesPerPort)) {
      strings.push({ id: uuidv4(), path: part });
    }
  }
  return strings;
}

// Continuous boustrophedon (zigzag) visiting order down/up each column in turn, starting
// from the given corner, then sliced into fixturesPerPort-sized strings so a run can
// continue across a column boundary.
function serpentineColumnsOrder(widthPanels, heightPanels, corner) {
  const colOrder = orderRange(widthPanels, corner.includes('right'));
  const baseReversed = corner.includes('bottom');
  const order = [];
  colOrder.forEach((col, i) => {
    const reversed = i % 2 === 0 ? baseReversed : !baseReversed;
    orderRange(heightPanels, reversed).forEach((row) => order.push({ col, row }));
  });
  return order;
}

// Same idea, zigzagging left/right across each row instead, starting from the given corner.
function serpentineRowsOrder(widthPanels, heightPanels, corner) {
  const rowOrder = orderRange(heightPanels, corner.includes('bottom'));
  const baseReversed = corner.includes('right');
  const order = [];
  rowOrder.forEach((row, i) => {
    const reversed = i % 2 === 0 ? baseReversed : !baseReversed;
    orderRange(widthPanels, reversed).forEach((col) => order.push({ col, row }));
  });
  return order;
}

export function generateCabling(widthPanels, heightPanels, fixturesPerPort, patternType, corner = 'top-left') {
  let strings;
  switch (patternType) {
    case 'rowComb':
      strings = rowCombPositions(widthPanels, heightPanels, fixturesPerPort, corner);
      break;
    case 'serpentineColumns':
      strings = chunk(serpentineColumnsOrder(widthPanels, heightPanels, corner), fixturesPerPort).map((path) => ({
        id: uuidv4(),
        path,
      }));
      break;
    case 'serpentineRows':
      strings = chunk(serpentineRowsOrder(widthPanels, heightPanels, corner), fixturesPerPort).map((path) => ({
        id: uuidv4(),
        path,
      }));
      break;
    case 'columnComb':
    default:
      strings = columnCombPositions(widthPanels, heightPanels, fixturesPerPort, corner);
      patternType = 'columnComb';
      break;
  }
  return { patternType, corner, strings };
}

// A string is "over capacity" if it has more panels than the current port can carry.
export function isStringOverCapacity(string, fixturesPerPort) {
  return fixturesPerPort > 0 && string.path.length > fixturesPerPort;
}

// A string references a position outside the current screen's grid (e.g. after resizing).
export function isStringOutOfBounds(string, widthPanels, heightPanels) {
  return string.path.some((p) => p.col < 0 || p.col >= widthPanels || p.row < 0 || p.row >= heightPanels);
}
