/**
 * Version: v11.2 (2026-01-13)
 * Change: Respect showRoads=true — build debug layer from assets/generated_network.json and call parent.add(...)
 * Notes: Debug-only; does not affect production rendering flow.
 */
import fs from 'fs';
import path from 'path';
function loadGeneratedNetworkJSON(repoRoot) {
  const p = path.join(repoRoot, 'assets', 'generated_network.json');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}
function buildDebugRoadsLayerFromJSON(json, texW, texH) {
  const layer = { type: 'DebugRoadsLayer', lines: [] };
  const W = json.size?.width || 1;
  const H = json.size?.height || 1;
  const sx = texW / W;
  const sy = texH / H;
  for (const e of json.edges || []) {
    let poly = e.poly && e.poly.length >= 2 ? e.poly : null;
    if (!poly) {
      const s = json.nodes?.[e.start];
      const t = json.nodes?.[e.end];
      if (s && t) poly = [[s.x, s.y], [t.x, t.y]];
    }
    if (!poly) continue;
    const pts = poly.map(([x, y]) => {
      const px = ((x + 1) / 2) * W * sx;
      const py = ((y + 1) / 2) * H * sy;
      return [px, py];
    });
    layer.lines.push(pts);
  }
  return layer;
}
export function createRoadNetwork(parent, opts = {}) {
  const {
    showRoads = false,
    repoRoot = process.cwd(),
    targetTextureSize = { w: 1000, h: 2048 },
  } = opts;
  const network = { nodes: [], roads: [], lanes: [] };
  if (showRoads) {
    try {
      const json = loadGeneratedNetworkJSON(repoRoot);
      const debugLayer = buildDebugRoadsLayerFromJSON(json, targetTextureSize.w, targetTextureSize.h);
      if (debugLayer.lines.length > 0 && parent && typeof parent.add === 'function') {
        parent.add(debugLayer);
      }
    } catch (err) {
      console.warn('Debug roads layer failed:', err?.message || err);
    }
  }
  return network;
}
