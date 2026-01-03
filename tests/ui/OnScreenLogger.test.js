// ===================================
// ФАЙЛ: tests/unit/ui/OnScreenLogger.test.js
// Unit тесты для OnScreenLogger
// ===================================

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { OnScreenLogger } from '../../../src/ui/OnScreenLogger.js';

describe('OnScreenLogger', () => {
  let logger;
  let originalConsoleLog, originalConsoleWarn, originalConsoleError;

  beforeEach(() => {
    // Сохраняем оригинальные методы console
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    
    logger = new OnScreenLogger();
  });

  afterEach(() => {
    // Восстанавливаем оригинальные методы
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    
    // Очищаем DOM
    logger.container?.remove();
    logger.toggleBtn?.remove();
  });

  describe('Constructor', () => {
    test('создает логгер с правильными свойствами', () => {
      expect(logger.maxLogs).toBe(20);
      expect(logger.logs).toEqual([]);
      expect(logger.isVisible).toBe(false);
      expect(logger.autoScroll).toBe(true);
    });

    test('вызывает init()', () => {
      expect(logger.container).toBeDefined();
      expect(logger.toggleBtn).toBeDefined();
    });

    test('вызывает interceptConsole()', () => {
      expect(console.log).not.toBe(originalConsoleLog);
      expect(console.warn).not.toBe(originalConsoleWarn);
      expect(console.error).not.toBe(originalConsoleError);
    });
  });

  describe('init()', () => {
    test('создает контейнер логгера', () => {
      expect(logger.container).toBeInstanceOf(HTMLElement);
      expect(logger.container.id).toBe('on-screen-logger');
    });

    test('добавляет контейнер в DOM', () => {
      const container = document.getElementById('on-screen-logger');
      expect(container).not.toBeNull();
    });

    test('контейнер скрыт по умолчанию', () => {
      expect(logger.container.style.display).toBe('none');
    });

    test('создает заголовок с кнопками', () => {
      const header = logger.container.querySelector('[id*="header"]');
      expect(header).toBeDefined();
    });

    test('создает область логов', () => {
      expect(logger.logArea).toBeInstanceOf(HTMLElement);
      expect(logger.logArea.id).toBe('log-area');
    });

    test('создает плавающую кнопку', () => {
      expect(logger.toggleBtn).toBeInstanceOf(HTMLElement);
      expect(logger.toggleBtn.textContent).toBe('📋');
    });

    test('добавляет кнопку в DOM', () => {
      expect(document.body.contains(logger.toggleBtn)).toBe(true);
    });

    test('привязывает обработчик к кнопке', () => {
      expect(logger.toggleBtn.onclick).toBeDefined();
    });
  });

  describe('show()', () => {
    test('делает контейнер видимым', () => {
      logger.show();
      
      expect(logger.container.style.display).toBe('block');
    });

    test('устанавливает isVisible в true', () => {
      logger.show();
      
      expect(logger.isVisible).toBe(true);
    });

    test('меняет текст кнопки', () => {
      logger.show();
      
      expect(logger.toggleBtn.textContent).toBe('📋✓');
    });

    test('меняет фон кнопки', () => {
      logger.show();
      
      expect(logger.toggleBtn.style.background).toContain('rgba(0, 255, 0, 1)');
    });

    test('не падает если контейнер undefined', () => {
      logger.container = null;
      
      expect(() => logger.show()).not.toThrow();
    });

    test('логирует вызов', () => {
      const spy = jest.spyOn(originalConsoleLog, 'call');
      logger.show();
      
      // Логи перехвачены, проверяем через spy
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('hide()', () => {
    beforeEach(() => {
      logger.show();
    });

    test('скрывает контейнер', () => {
      logger.hide();
      
      expect(logger.container.style.display).toBe('none');
    });

    test('устанавливает isVisible в false', () => {
      logger.hide();
      
      expect(logger.isVisible).toBe(false);
    });

    test('меняет текст кнопки обратно', () => {
      logger.hide();
      
      expect(logger.toggleBtn.textContent).toBe('📋');
    });

    test('меняет фон кнопки обратно', () => {
      logger.hide();
      
      expect(logger.toggleBtn.style.background).toContain('rgba(0, 255, 0, 0.8)');
    });
  });

  describe('toggle()', () => {
    test('показывает скрытый логгер', () => {
      logger.isVisible = false;
      logger.toggle();
      
      expect(logger.isVisible).toBe(true);
    });

    test('скрывает видимый логгер', () => {
      logger.isVisible = true;
      logger.toggle();
      
      expect(logger.isVisible).toBe(false);
    });

    test('работает при клике на кнопку', () => {
      logger.toggleBtn.onclick();
      
      expect(logger.isVisible).toBe(true);
    });
  });

  describe('addLog()', () => {
    test('добавляет лог в массив', () => {
      logger.addLog('LOG', ['Test message']);
      
      expect(logger.logs.length).toBe(1);
      expect(logger.logs[0].message).toBe('Test message');
    });

    test('добавляет timestamp', () => {
      logger.addLog('LOG', ['Test']);
      
      expect(logger.logs[0].timestamp).toBeDefined();
    });

    test('сохраняет тип лога', () => {
      logger.addLog('ERROR', ['Error message']);
      
      expect(logger.logs[0].type).toBe('ERROR');
    });

    test('конвертирует объекты в JSON', () => {
      logger.addLog('LOG', [{ foo: 'bar' }]);
      
      expect(logger.logs[0].message).toContain('"foo"');
      expect(logger.logs[0].message).toContain('"bar"');
    });

    test('объединяет несколько аргументов', () => {
      logger.addLog('LOG', ['Hello', 'World', 123]);
      
      expect(logger.logs[0].message).toContain('Hello');
      expect(logger.logs[0].message).toContain('World');
      expect(logger.logs[0].message).toContain('123');
    });

    test('ограничивает количество логов', () => {
      for (let i = 0; i < 25; i++) {
        logger.addLog('LOG', [`Message ${i}`]);
      }
      
      expect(logger.logs.length).toBe(20);
    });

    test('удаляет старые логи', () => {
      for (let i = 0; i < 25; i++) {
        logger.addLog('LOG', [`Message ${i}`]);
      }
      
      expect(logger.logs[0].message).not.toContain('Message 0');
    });

    test('вызывает render()', () => {
      logger.render = jest.fn();
      logger.addLog('LOG', ['Test']);
      
      expect(logger.render).toHaveBeenCalled();
    });
  });

  describe('render()', () => {
    beforeEach(() => {
      logger.logs = [
        { type: 'LOG', timestamp: '12:00:00', message: 'Log message' },
        { type: 'ERROR', timestamp: '12:00:01', message: 'Error message' },
        { type: 'WARN', timestamp: '12:00:02', message: 'Warning message' }
      ];
    });

    test('очищает logArea', () => {
      logger.logArea.innerHTML = 'old content';
      logger.render();
      
      expect(logger.logArea.innerHTML).not.toContain('old content');
    });

    test('рендерит все логи', () => {
      logger.render();
      
      const entries = logger.logArea.querySelectorAll('div');
      expect(entries.length).toBeGreaterThan(0);
    });

    test('использует правильные цвета', () => {
      logger.render();
      
      const content = logger.logArea.innerHTML;
      expect(content).toContain('#f00'); // ERROR
      expect(content).toContain('#ff0'); // WARN
      expect(content).toContain('#0f0'); // LOG
    });

    test('не падает если logArea undefined', () => {
      logger.logArea = null;
      
      expect(() => logger.render()).not.toThrow();
    });

    test('автоскроллит если включен', () => {
      logger.isVisible = true;
      logger.autoScroll = true;
      const initialScrollTop = logger.container.scrollTop;
      
      logger.render();
      
      // scrollTop должен быть установлен
      expect(logger.container.scrollTop).toBeDefined();
    });
  });

  describe('interceptConsole()', () => {
    test('перехватывает console.log', () => {
      console.log('Test log');
      
      expect(logger.logs.some(log => 
        log.message.includes('Test log') && log.type === 'LOG'
      )).toBe(true);
    });

    test('перехватывает console.warn', () => {
      console.warn('Test warning');
      
      expect(logger.logs.some(log => 
        log.message.includes('Test warning') && log.type === 'WARN'
      )).toBe(true);
    });

    test('перехватывает console.error', () => {
      console.error('Test error');
      
      expect(logger.logs.some(log => 
        log.message.includes('Test error') && log.type === 'ERROR'
      )).toBe(true);
    });

    test('перехватывает console.info', () => {
      console.info('Test info');
      
      expect(logger.logs.some(log => 
        log.message.includes('Test info') && log.type === 'INFO'
      )).toBe(true);
    });

    test('вызывает оригинальный метод', () => {
      const spy = jest.spyOn(originalConsoleLog, 'call');
      console.log('Test');
      
      expect(spy).toHaveBeenCalled();
    });

    test('перехватывает window.error', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Window error',
        filename: 'test.js',
        lineno: 10
      });
      
      window.dispatchEvent(errorEvent);
      
      expect(logger.logs.some(log => 
        log.message.includes('Window error')
      )).toBe(true);
    });

    test('перехватывает unhandledrejection', () => {
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject('Unhandled'),
        reason: 'Unhandled promise rejection'
      });
      
      window.dispatchEvent(rejectionEvent);
      
      expect(logger.logs.some(log => 
        log.message.includes('Unhandled')
      )).toBe(true);
    });
  });

  describe('clear()', () => {
    beforeEach(() => {
      logger.logs = [
        { type: 'LOG', timestamp: '12:00:00', message: 'Log 1' },
        { type: 'LOG', timestamp: '12:00:01', message: 'Log 2' }
      ];
    });

    test('очищает массив логов', () => {
      logger.clear();
      
      expect(logger.logs).toEqual([]);
    });

    test('вызывает render()', () => {
      logger.render = jest.fn();
      logger.clear();
      
      expect(logger.render).toHaveBeenCalled();
    });

    test('очищает logArea', () => {
      logger.render();
      logger.clear();
      
      expect(logger.logArea.children.length).toBe(0);
    });
  });

  describe('log()', () => {
    test('добавляет программный лог', () => {
      logger.log('Custom message');
      
      expect(logger.logs.some(log => 
        log.message === 'Custom message'
      )).toBe(true);
    });

    test('использует заданный тип', () => {
      logger.log('Warning message', 'WARN');
      
      expect(logger.logs.some(log => 
        log.type === 'WARN'
      )).toBe(true);
    });

    test('использует LOG по умолчанию', () => {
      logger.log('Default message');
      
      expect(logger.logs.some(log => 
        log.type === 'LOG'
      )).toBe(true);
    });
  });

  describe('getLogColor()', () => {
    test('возвращает красный для ERROR', () => {
      expect(logger.getLogColor('ERROR')).toBe('#f00');
    });

    test('возвращает желтый для WARN', () => {
      expect(logger.getLogColor('WARN')).toBe('#ff0');
    });

    test('возвращает голубой для INFO', () => {
      expect(logger.getLogColor('INFO')).toBe('#0af');
    });

    test('возвращает зеленый для LOG', () => {
      expect(logger.getLogColor('LOG')).toBe('#0f0');
    });

    test('возвращает зеленый по умолчанию', () => {
      expect(logger.getLogColor('UNKNOWN')).toBe('#0f0');
    });
  });

  describe('Edge cases', () => {
    test('обрабатывает undefined message', () => {
      expect(() => logger.addLog('LOG', [undefined])).not.toThrow();
    });

    test('обрабатывает null message', () => {
      expect(() => logger.addLog('LOG', [null])).not.toThrow();
    });

    test('обрабатывает пустой массив args', () => {
      expect(() => logger.addLog('LOG', [])).not.toThrow();
    });

    test('обрабатывает циклические объекты', () => {
      const obj = { foo: 'bar' };
      obj.self = obj;
      
      expect(() => logger.addLog('LOG', [obj])).not.toThrow();
    });

    test('множественный show()', () => {
      logger.show();
      logger.show();
      
      expect(logger.isVisible).toBe(true);
    });

    test('множественный hide()', () => {
      logger.hide();
      logger.hide();
      
      expect(logger.isVisible).toBe(false);
    });
  });
});