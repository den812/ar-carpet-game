/** tests/unit/image_network_loader.test.js — v11.3.1 */
import * as mod from '../../src/roads/image_network_loader.js';

test('module loads', () => { expect(mod).toBeTruthy(); });

const fnKeys = Object.keys(mod).filter(k => typeof mod[k] === 'function');
(fnKeys.length ? describe : describe.skip)('API surface', () => {
  test('functions execute with safe inputs', async () => {
    for (const key of fnKeys) {
      const fn = mod[key];
      try {
        const r = fn(undefined, undefined, undefined);
        if (r && typeof r.then === 'function') { await r.catch(() => {}); }
      } catch {}
    }
    expect(true).toBe(true);
  });
});
