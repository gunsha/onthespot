import { config } from './config/index';
import { getLogger } from './logger/index';
import { makeCall } from './http/client';
import { sanitizeData, formatItemPath } from './utils/path';

const logger = getLogger('test');

async function runTests() {
  logger.info('--- Starting Tests ---');

  logger.info(`Config version: ${config.get('version')}`);
  logger.info(`Audio download path: ${config.get('audio_download_path')}`);

  logger.info(`Sanitized Data "Hello/World?*": ${sanitizeData('Hello/World?*')}`);

  logger.info('--- Tests Complete ---');
}

runTests();
