import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/index';
import { getLogger } from '../logger/index';

const logger = getLogger('http-client');

export interface MakeCallOptions {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  skipCache?: boolean;
  text?: boolean;
  method?: string;
  body?: any;
}

export async function makeCall(url: string, options: MakeCallOptions = {}): Promise<any> {
  const { params = {}, headers = {}, skipCache = false, text = false, method = 'GET', body } = options;

  let requestUrl = url;
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    requestUrl += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  let reqCacheFile = '';

  if (!skipCache && method.toUpperCase() === 'GET') {
    const hasher = new Bun.CryptoHasher('md5');
    hasher.update(requestUrl);
    const requestKey = hasher.digest('hex');
    reqCacheFile = path.join(config.get<string>('_cache_dir'), 'reqcache', requestKey + '.json');

    fs.mkdirSync(path.dirname(reqCacheFile), { recursive: true });

    if (await Bun.file(reqCacheFile).exists()) {
      logger.debug(`URL "${requestUrl}" cache found! HASH: ${requestKey}`);
      try {
        const cachedData = await Bun.file(reqCacheFile).text();
        if (text) {
          return cachedData;
        }
        return JSON.parse(cachedData);
      } catch (e) {
        logger.error(`URL "${requestUrl}" cache has invalid data`);
      }
    } else {
      logger.debug(`URL "${requestUrl}" has cache miss! HASH: ${requestKey}; Fetching data`);
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    if (typeof body === 'string') {
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  try {
    const response = await fetch(requestUrl, fetchOptions);

    if (response.ok) {
      const responseText = await response.text();

      if (!skipCache && method.toUpperCase() === 'GET' && reqCacheFile) {
        await Bun.write(reqCacheFile, responseText);
      }

      if (text) {
        return responseText;
      }
      return JSON.parse(responseText);
    } else {
      logger.info(`Request status error ${response.status}: ${requestUrl}`);
      return null;
    }
  } catch (e: any) {
    logger.error(`Request failed to ${requestUrl}: ${e.message}`);
    return null;
  }
}
