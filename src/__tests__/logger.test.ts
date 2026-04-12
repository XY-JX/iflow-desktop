import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debug, info, warn, error } from '../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages in dev environment', () => {
      // Logger uses import.meta.env.DEV which is true in test environment
      debug('TestModule', 'test message');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages in dev environment', () => {
      // Logger uses import.meta.env.DEV which is true in test environment
      info('TestModule', 'test message');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      warn('TestModule', 'warning message');
      expect(console.warn).toHaveBeenCalledWith('[TestModule] warning message');
    });
  });

  describe('error', () => {
    it('should always log error messages', () => {
      error('TestModule', 'error message');
      expect(console.error).toHaveBeenCalledWith('[TestModule] error message');
    });

    it('should format multiple arguments correctly', () => {
      error('TestModule', 'Error occurred:', new Error('test error'));
      expect(console.error).toHaveBeenCalled();
    });
  });
});
