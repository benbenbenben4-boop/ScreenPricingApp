// Port/processor/XD capacity math, verified against Brompton's own Tessera
// processor capacity calculator (dl.bromptontech.com/tessera/docs/processor_capacity).
//
// One simplification vs. the original tool: Brompton's calculator assigns at
// most one processor per canvas and reports "doesn't fit" if it's too big.
// Screens here are often larger than a single processor's capacity, so this
// module auto-scales the processor/port/XD count instead of failing —
// ceil(totalPanels / fixturesPerX) — which is the same underlying math
// applied per unit rather than a single all-or-nothing check.
//
// Not modelled: Brompton's "interpolated mapping" toggle (mapping a fixture
// onto a virtual canvas pixel pitch). Pixel penalty here uses only the
// fixture's own loadPenalty, which is 1 for the large majority of fixtures.

export function nominalPortCapacity(bitDepth, frameRate, usingUll) {
  return Math.floor(252_000_000 / (bitDepth * frameRate * (usingUll ? 2 : 1)));
}

export function processorPixelLimit(processor, frameRate, usingUll) {
  if (processor.maxPixelRate) {
    return Math.min(processor.maxPixelRate / (frameRate * (usingUll ? 2 : 1)), processor.maxPixels);
  }
  return processor.maxPixels;
}

// panelType: { pixelsWide, pixelsTall, loadPenalty? }
// processor: an entry from PROCESSORS (bromptonProcessors.js)
// settings: { bitDepth, frameRate, usingRedundancy, usingUll, usingSwitches, usingFailover }
export function calculateFixtureCapacities(panelType, processor, settings) {
  const fixtureSize = panelType.pixelsWide * panelType.pixelsTall;
  const effectiveFixtureSize = fixtureSize * (panelType.loadPenalty || 1);

  const usingUll = settings.usingUll && processor.supportsUll;
  const portCapacity = nominalPortCapacity(settings.bitDepth, settings.frameRate, usingUll);

  const fixturesPerPort = Math.min(
    Math.floor(portCapacity / effectiveFixtureSize),
    settings.usingSwitches ? Infinity : 50
  );

  const portsPerProcessor = processor.ports / (settings.usingRedundancy ? 2 : 1);
  const pixelLimit = processorPixelLimit(processor, settings.frameRate, usingUll);

  const fixturesPerProcessor = Math.floor(
    Math.min(fixturesPerPort * portsPerProcessor, pixelLimit / effectiveFixtureSize, processor.maxPanels)
  );

  const fixturesPerXD = processor.hasXd
    ? Math.floor(Math.min(fixturesPerPort * 10, fixturesPerProcessor, 500))
    : null;

  return { fixturesPerPort, fixturesPerProcessor, fixturesPerXD, portCapacity };
}

// screen: { widthPanels, heightPanels }
export function calculateScreenWiring(screen, panelType, processor, settings) {
  if (!panelType || !processor) {
    return {
      fixturesPerPort: 0,
      fixturesPerProcessor: 0,
      fixturesPerXD: null,
      totalPanels: screen ? screen.widthPanels * screen.heightPanels : 0,
      portsNeeded: 0,
      processorsNeeded: 0,
      xdsNeeded: 0,
    };
  }

  const totalPanels = screen.widthPanels * screen.heightPanels;
  const { fixturesPerPort, fixturesPerProcessor, fixturesPerXD } = calculateFixtureCapacities(
    panelType,
    processor,
    settings
  );

  const redundancyMultiplier = settings.usingRedundancy ? 2 : 1;
  const failoverMultiplier = settings.usingFailover && processor.supportsFailover ? 2 : 1;

  const portsNeeded = fixturesPerPort > 0 ? Math.ceil(totalPanels / fixturesPerPort) * redundancyMultiplier : 0;
  const processorsNeeded =
    fixturesPerProcessor > 0 ? Math.ceil(totalPanels / fixturesPerProcessor) * failoverMultiplier : 0;
  const xdsNeeded =
    fixturesPerXD && fixturesPerXD > 0 ? Math.ceil(totalPanels / fixturesPerXD) * redundancyMultiplier : 0;

  return { fixturesPerPort, fixturesPerProcessor, fixturesPerXD, totalPanels, portsNeeded, processorsNeeded, xdsNeeded };
}
