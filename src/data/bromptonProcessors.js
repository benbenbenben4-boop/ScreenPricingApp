// Constants verified directly from Brompton's own Tessera processor capacity
// calculator (dl.bromptontech.com/tessera/docs/processor_capacity), decompiled
// from its client-side JS rather than estimated.

export const PROCESSORS = {
  M2: {
    name: 'M2',
    ports: 4,
    maxPanels: 2000,
    maxPixels: 2_100_000,
    maxPixelRate: null,
    supportsUll: false,
    supportsFailover: false,
    hasXd: false,
    cabling: ['simple', 'redundant', 'switches'],
  },
  S4: {
    name: 'S4',
    ports: 4,
    maxPanels: 2000,
    maxPixels: 2_100_000,
    maxPixelRate: null,
    supportsUll: false,
    supportsFailover: false,
    hasXd: false,
    cabling: ['simple', 'redundant', 'switches'],
  },
  S8: {
    name: 'S8',
    ports: 8,
    maxPanels: 2000,
    maxPixels: 4_500_000,
    maxPixelRate: 540_000_000,
    supportsUll: true,
    supportsFailover: false,
    hasXd: false,
    cabling: ['simple', 'redundant', 'switches'],
  },
  SX40: {
    name: 'SX40',
    ports: 40,
    maxPanels: 2000,
    maxPixels: 9_000_000,
    maxPixelRate: 540_000_000,
    supportsUll: true,
    supportsFailover: true,
    hasXd: true,
    cabling: ['simple', 'redundant', 'switches'],
  },
  T1: {
    name: 'T1',
    ports: 1,
    maxPanels: 500,
    maxPixels: 525_000,
    maxPixelRate: null,
    supportsUll: false,
    supportsFailover: false,
    hasXd: false,
    cabling: ['simple', 'switches'],
  },
};

export const PROCESSOR_MODELS = Object.keys(PROCESSORS);

export const BIT_DEPTHS = [8, 10, 12];

export const FRAME_RATES = [24, 25, 30, 48, 50, 60, 72, 100, 120, 144, 150, 180, 192, 200, 240, 250];
