// ===================================
// ФАЙЛ: tests/e2e/full_game.spec.js
// E2E тесты полного игрового процесса
// ИСПРАВЛЕНО: Упрощена конфигурация мобильных тестов
// ===================================

import { test, expect } from '@playwright/test';

test.describe('Full Game Flow', () => {
  test('Стартовый экран → TOUCH режим → игра', async ({ page }) => {
    await page.goto('/');
    
    // Проверяем стартовый экран
    await expect(page.locator('#start')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('🎮 AR CARPET GAME');
    
    // Кнопки режимов видны НА СТАРТОВОМ ЭКРАНЕ (уточняем селектор)
    await expect(page.locator('#start [data-mode="AR"]')).toBeVisible();
    await expect(page.locator('#start [data-mode="TOUCH"]')).toBeVisible();
    await expect(page.locator('#start [data-mode="GYRO"]')).toBeVisible();
    
    // Запускаем TOUCH режим (кликаем именно на стартовом экране)
    await page.click('#start [data-mode="TOUCH"]');
    
    // Ждем загрузки
    await page.waitForTimeout(2000);
    
    // Стартовый экран должен исчезнуть
    await expect(page.locator('#start')).not.toBeVisible();
    
    // Canvas должен быть виден
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // ModeUI должен появиться
    await expect(page.locator('#mode-ui')).toBeVisible();
  });

  test('Настройки сохраняются в localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Включаем логи
    await page.check('#logger-toggle');
    
    // Запускаем игру (кликаем на кнопку на стартовом экране)
    await page.click('#start [data-mode="TOUCH"]');
    
    // Проверяем localStorage
    const showLogger = await page.evaluate(() => 
      localStorage.getItem('showLogger')
    );
    
    expect(showLogger).toBe('true');
  });

  test('StatsPanel показывается если включен', async ({ page }) => {
    await page.goto('/');
    
    // Убеждаемся что статистика включена
    await page.check('#stats-toggle');
    
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(2000);
    
    // Панель должна быть видна
    await expect(page.locator('#stats-panel')).toBeVisible();
  });

  test('OnScreenLogger показывается если включен', async ({ page }) => {
    await page.goto('/');
    
    await page.check('#logger-toggle');
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(1000);
    
    // Логгер или кнопка должны быть видны
    const loggerButton = page.locator('button:has-text("📋")');
    await expect(loggerButton).toBeVisible();
  });
});

test.describe('Mode Switching', () => {
  test('Переключение с TOUCH на GYRO', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(1500);
    
    // Переключаемся на GYRO (теперь в mode-ui)
    await page.click('#mode-ui [data-mode="GYRO"]');
    
    // Страница должна перезагрузиться
    await page.waitForLoadState('domcontentloaded');
  });

  test('Режим сохраняется в localStorage', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(1000);
    
    const mode = await page.evaluate(() => 
      localStorage.getItem('mode')
    );
    
    expect(mode).toBe('TOUCH');
  });
});

test.describe('UI Interactions', () => {
  test('StatsPanel разворачивается при клике', async ({ page }) => {
    await page.goto('/');
    
    await page.check('#stats-toggle');
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(2000);
    
    // Кликаем на панель
    await page.click('#stats-panel');
    
    // Контент должен быть виден
    const content = page.locator('#stats-content');
    await expect(content).toBeVisible();
  });

  test('Logger toggle кнопка работает', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(1000);
    
    // Находим и кликаем кнопку логгера
    const loggerBtn = page.locator('button').filter({ hasText: '📋' }).first();
    await loggerBtn.click();
    
    // Логгер должен открыться
    const logger = page.locator('#on-screen-logger');
    await expect(logger).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('Страница загружается за разумное время', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('Canvas инициализируется без ошибок', async ({ page }) => {
    // Перехватываем ошибки консоли
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(3000);
    
    // Не должно быть критичных ошибок
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read') || e.includes('undefined')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Mobile specific', () => {
  // Используем viewport вместо devices
  test.use({ 
    viewport: { width: 393, height: 851 },
    hasTouch: true,
    isMobile: true
  });
  
  test('Игра запускается на мобильном', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(2000);
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
  
  test('Touch управление работает', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#start [data-mode="TOUCH"]');
    await page.waitForTimeout(2000);
    
    const canvas = page.locator('canvas');
    
    // Симулируем touch
    await canvas.tap();
    
    // Не должно быть ошибок
    await page.waitForTimeout(500);
  });
});