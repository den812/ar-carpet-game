# 🧪 Testing Guide - AR Carpet Game

## 📊 Текущий статус тестов

[![Tests CI/CD](https://github.com/den812/ar-carpet-game/actions/workflows/tests.yml/badge.svg)](https://github.com/den812/ar-carpet-game/actions/workflows/tests.yml)

- ✅ **Unit Tests**: 159/159 passed (100%)
- ✅ **Integration Tests**: включены в unit tests
- ✅ **E2E Tests**: 12/12 passed (100%)
- 📊 **Coverage**: ~81% (отличный результат!)

---

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Запуск всех тестов
```bash
npm test           # Jest unit/integration тесты
npm run test:e2e   # Playwright E2E тесты
npm run test:all   # Все тесты подряд
```

---

## 🧪 Unit & Integration Tests (Jest)

### Запуск тестов
```bash
npm test                    # Запуск всех Jest тестов
npm run test:watch          # Watch режим (перезапуск при изменениях)
npm run test:coverage       # С отчетом о покрытии
npm run test:unit           # Только unit тесты
npm run test:integration    # Только integration тесты
```

### Структура тестов
```
tests/
├── unit/                   # Unit тесты
│   ├── cars/
│   │   ├── Car.test.js
│   │   └── CarModels.test.js
│   ├── roads/
│   │   └── roadNetwork.test.js
│   └── combined.test.js
├── integration/            # Integration тесты
│   └── traffic_flow.test.js
├── mocks/                  # Моки для Three.js
│   ├── three.js
│   └── three-addons.js
└── setup.js               # Настройка окружения
```

### Покрытие кода
После `npm run test:coverage` откройте:
```bash
# Windows
start coverage/lcov-report/index.html

# Linux/Mac
open coverage/lcov-report/index.html
```

---

## 🎭 E2E Tests (Playwright)

### Первый запуск
```bash
# Установите браузеры Playwright (только один раз)
npx playwright install chromium
```

### Запуск тестов
```bash
npm run test:e2e            # Запуск всех E2E тестов
npx playwright test         # То же самое
npx playwright test --ui    # UI режим (интерактивный)
npx playwright test --debug # Режим отладки
```

### Просмотр отчета
```bash
npx playwright show-report
```

### Структура E2E тестов
```
tests/e2e/
└── full_game.spec.js      # Полный сценарий игры
```

### Тестовые сценарии
- ✅ Загрузка стартового экрана
- ✅ Запуск TOUCH режима
- ✅ Переключение режимов (TOUCH/GYRO/AR)
- ✅ Работа UI компонентов (StatsPanel, Logger)
- ✅ Сохранение настроек в localStorage
- ✅ Мобильная версия (touch controls)
- ✅ Проверка производительности

---

## 🤖 CI/CD на GitHub Actions

### Workflow
Тесты запускаются **автоматически** при:
- Push в ветки `main` и `develop`
- Создании Pull Request

### Этапы CI/CD
1. **Unit Tests** (Node 18.x и 20.x)
   - Запуск Jest тестов
   - Генерация coverage
   - Загрузка в Codecov

2. **E2E Tests** (только если Unit прошли)
   - Установка Playwright + Chromium
   - Запуск веб-сервера
   - Запуск E2E тестов
   - Сохранение скриншотов при ошибках

3. **Summary**
   - Общий статус всех тестов

### Просмотр результатов
1. Откройте GitHub → Actions
2. Выберите последний workflow run
3. Посмотрите логи и артефакты

---

## 🐛 Отладка тестов

### Jest тесты падают?
```bash
# Запустите конкретный тест
npm test -- tests/unit/cars/Car.test.js

# Запустите с полным выводом
npm test -- --verbose

# Запустите один тест
npm test -- -t "название теста"
```

### E2E тесты падают?
```bash
# Режим UI (интерактивный)
npx playwright test --ui

# Режим отладки с паузами
npx playwright test --debug

# Только один браузер
npx playwright test --project=chromium

# Посмотрите скриншоты
ls test-results/
```

### Проблемы с моками Three.js?
Проверьте файлы:
- `tests/mocks/three.js` - основные классы
- `tests/mocks/three-addons.js` - дополнения

---

## 📝 Добавление новых тестов

### Добавить Unit тест
```javascript
// tests/unit/myfeature/MyClass.test.js
import { describe, test, expect } from '@jest/globals';
import { MyClass } from '../../../src/myfeature/MyClass.js';

describe('MyClass', () => {
  test('делает что-то', () => {
    const instance = new MyClass();
    expect(instance.doSomething()).toBe('result');
  });
});
```

### Добавить E2E тест
```javascript
// tests/e2e/my_feature.spec.js
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('работает как ожидается', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#my-element')).toBeVisible();
  });
});
```

---

## 🎯 Best Practices

### Jest тесты
- ✅ Один файл = одна фича/класс
- ✅ Группируйте тесты в `describe()`
- ✅ Используйте понятные названия
- ✅ Проверяйте edge cases
- ✅ Мокайте внешние зависимости

### Playwright тесты
- ✅ Используйте `data-testid` для селекторов
- ✅ Добавляйте `waitForTimeout()` там где нужно
- ✅ Проверяйте результат, а не процесс
- ✅ Избегайте хрупких селекторов (типа nth-child)

---

## 📚 Полезные ссылки

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
- [Coverage Reports](./coverage/lcov-report/index.html)

---

## 🎉 Результаты

### Текущее покрытие (по файлам)
| Файл | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| All files | 80.84% | 76.81% | 78.66% | 82.26% |
| Car.js | 87.5% | 81.81% | 92.3% | 89.11% |
| CarModels.js | 84.9% | 83.33% | 92.85% | 84% |
| roadNetwork.js | 85.6% | 81.96% | 86.95% | 84.61% |
| road_system.js | 83.33% | 68.75% | 100% | 84.53% |
| traffic_manager.js | 65.94% | 64.17% | 61.11% | 66.94% |

### E2E Тесты - 12/12 ✅
- Full Game Flow (4 теста)
- Mode Switching (2 теста)
- UI Interactions (2 теста)
- Performance (2 теста)
- Mobile specific (2 теста)

---

## 💡 Советы

1. **Запускайте тесты локально** перед push
2. **Проверяйте coverage** - цель 80%+
3. **Пишите тесты** для новых фич
4. **Обновляйте тесты** при изменении кода
5. **Используйте CI/CD** - пусть GitHub проверяет за вас!

---

Made with ❤️ by AR Carpet Game Team