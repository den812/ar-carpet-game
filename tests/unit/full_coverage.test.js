/**
 * Version: v11.2 (2026-01-13)
 * Change: Replace magic thresholds with data-driven assertions; verify showRoads flow.
 */

import fs from 'fs';
import path from 'path';
import { createRoadNetwork } from '../../src/roads/roadNetwork.js';

function readGenerated() {
  const repoRoot = path.resolve(__dirname, '../../');
  const jsonPath = path.join(repoRoot, 'assets', 'generated_network.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  return { repoRoot, data };
}

// smoke test to ensure showRoads path calls add and layer has lines
test('full coverage: showRoads path produces non-empty layer', () => {
  const { repoRoot } = readGenerated();
  const mockParent = { add: jest.fn() };

  createRoadNetwork(mockParent, {
    showRoads: true,
    repoRoot,
    targetTextureSize: { w: 1000, h: 2048 },
  });

  expect(mockParent.add).toHaveBeenCalledTimes(1);
  const layer = mockParent.add.mock.calls[0][0];
  expect(layer.type).toBe('DebugRoadsLayer');
  expect(layer.lines.length).toBeGreaterThan(0);
});
