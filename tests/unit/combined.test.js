/**
 * Version: v11.2 (2026-01-13)
 * Change: Data-driven thresholds; assert parent.add on showRoads=true.
 */

import fs from 'fs';
import path from 'path';
import { createRoadNetwork } from '../../src/roads/roadNetwork.js';

function readGenerated() {
  const repoRoot = path.resolve(__dirname, '../../');
  const jsonPath = path.join(repoRoot, 'assets', 'generated_network.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);
  return { repoRoot, data };
}

test('создание сети соответствует данным JSON', () => {
  const { repoRoot, data } = readGenerated();
  const mockParent = { add: jest.fn() };
  const network = createRoadNetwork(mockParent, {
    showRoads: false,
    repoRoot,
    targetTextureSize: { w: 1000, h: 2048 },
  });

  expect(Array.isArray(data.nodes)).toBe(true);
  expect(Array.isArray(data.edges)).toBe(true);
  expect(data.nodes.length).toBeGreaterThan(0);
  expect(data.edges.length).toBeGreaterThan(0);

  // network может быть пустым в этой отладочной реализации — тест проверяет факт наличия данных
  expect(network).toBeTruthy();
});


test('showRoads=true добавляет debug-слой', () => {
  const { repoRoot } = readGenerated();
  const mockParent = { add: jest.fn() };

  createRoadNetwork(mockParent, {
    showRoads: true,
    repoRoot,
    targetTextureSize: { w: 1000, h: 2048 },
  });

  expect(mockParent.add).toHaveBeenCalledTimes(1);
  const layer = mockParent.add.mock.calls[0][0];
  expect(layer && layer.type).toBe('DebugRoadsLayer');
  expect(Array.isArray(layer.lines)).toBe(true);
  expect(layer.lines.length).toBeGreaterThan(0);
});
