// tests/testLogger.spec.ts (lub vectra.spec.ts)
import { test, expect } from '@playwright/test';
// Zmieniamy tę linię:
// import { Logger } from '../utils/logger';
// Na tę:
import Logger from '../utils/logger';

test('should initialize Logger successfully', ({}) => {
    const logger = new Logger('TestLogger');
    expect(logger).toBeInstanceOf(Logger);
    logger.info('Logger initialized successfully in a test!');
});