// Version: v11.1 (2026-01-13)
// Change: Added debug roads-from-code overlay assets and basic existence tests.
// Purpose: Temporary debug to visualize paths strictly from code/JSON, not from manual roads-only image.
// ESM patch v11.4.0 (2026-01-14): convert require() to ESM imports; compute __dirname; keep originals as comments.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ORIGINAL CommonJS (preserved for reference):
// const fs = require('fs');
// const path = require('path');
// Version: v11.1 (2026-01-13)
// Change: Added debug roads-from-code overlay assets and basic existence tests.
// Purpose: Temporary debug to visualize paths strictly from code/JSON, not from manual roads-only image.
describe('Debug roads-from-code overlay assets', () => {
  const root = path.resolve(__dirname, '../../');
  const assets = path.join(root, 'assets');
  const models = path.join(assets, 'models');
  const debug = path.join(assets, 'debug');
  test('generated_network.json exists', () => {
    const p = path.join(assets, 'generated_network.json');
    expect(fs.existsSync(p)).toBe(true);
  });
  test('overlay and alpha textures exist', () => {
    const overlay = path.join(assets, 'carpet_roads_from_code_overlay.png');
    const scanAlpha = path.join(assets, 'carpet_scan_alpha.png');
    const roadsAlpha = path.join(assets, 'carpet_roads_alpha.png');
    expect(fs.existsSync(overlay)).toBe(true);
    expect(fs.existsSync(scanAlpha)).toBe(true);
    expect(fs.existsSync(roadsAlpha)).toBe(true);
  });
  test('OBJ/MTL for planes exist', () => {
    expect(fs.existsSync(path.join(models, 'carpet_plane_scan.obj'))).toBe(true);
    expect(fs.existsSync(path.join(models, 'carpet_plane_scan.mtl'))).toBe(true);
    expect(fs.existsSync(path.join(models, 'carpet_plane_roads.obj'))).toBe(true);
    expect(fs.existsSync(path.join(models, 'carpet_plane_roads.mtl'))).toBe(true);
  });
});
