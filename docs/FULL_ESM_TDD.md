# Full ESM & TDD — v11.3.1 (2026-01-13)

- **E2E** в корне (`e2e/`), конфиг в `playwright.config.js`.
- **Jest**: 100% глобальные пороги в `jest.config.js`.
- **ESM**: используем `type: module` и `babel-jest`.
- **e2e/a11y.e2e.spec.js**: аудит доступности через @axe-core/playwright.

## Как запустить локально
1. `npm ci`
2. Запусти своё приложение на `http://localhost:3000` (или экспортируй `BASE_URL`).
3. `npx playwright install --with-deps`
4. `npm run test:unit && npm run test:e2e`

## Как запустить в CI
- Добавьте шаги: `npm ci`, `npm run test:unit -- --coverage`, `npx playwright install --with-deps`, `npm run test:e2e`.
