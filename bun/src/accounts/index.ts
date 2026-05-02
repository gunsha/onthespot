import { Account } from '../types/account';
import { Service } from '../types/service';
import { config } from '../config/index';
import { getLogger } from '../logger/index';
import { ServiceRegistry } from '../services/index';

const logger = getLogger('accounts');

export const accountPool: Account[] = [];

export async function fillAccountPool(
  onProgress?: (msg: string, success: boolean) => void
): Promise<number> {
  const accounts = config.get<Account[]>('accounts', []);
  
  // Clear the existing pool
  accountPool.length = 0;
  
  for (const account of accounts) {
    const service = account.service;
    if (!account.active) continue;

    if (onProgress) {
      onProgress(`Attempting to create session for\n${account.uuid}...`, true);
    }

    const serviceAdapter = ServiceRegistry[service];
    let validLogin = false;

    if (serviceAdapter && typeof serviceAdapter.login_user === 'function') {
      try {
        validLogin = await serviceAdapter.login_user(account);
      } catch (e: any) {
        logger.error(`Login error for ${account.uuid}: ${e.message}`);
      }
    } else {
      logger.warn(`No login adapter found for service: ${service}`);
    }

    if (validLogin) {
      if (onProgress) {
        onProgress(`Session created for\n${account.uuid}!`, true);
      }
      // accountPool is usually populated directly by the service (like youtube_music does),
      // but let's make sure it's in the pool if not already added.
      if (!accountPool.some(a => a.uuid === account.uuid)) {
        accountPool.push(account);
      }
    } else {
      if (onProgress) {
        onProgress(`Login failed for\n${account.uuid}!`, false);
      }
    }
  }
  
  return accountPool.length;
}

export function getAccountToken(itemService: Service | string, rotate: boolean = false): Account | undefined {
  if (['bandcamp', 'youtube_music', 'generic'].includes(itemService as string)) {
    const genericAcc = accountPool.find(a => a.service === itemService);
    return genericAcc;
  }

  let parsingIndex = config.get<number>('active_account_number', 0);
  
  if (accountPool.length === 0) return undefined;
  
  parsingIndex = parsingIndex % accountPool.length;

  if (itemService === accountPool[parsingIndex]?.service && !rotate) {
    return accountPool[parsingIndex];
  } else {
    for (let i = parsingIndex + 1; i <= parsingIndex + accountPool.length; i++) {
      const index = i % accountPool.length;
      if (itemService === accountPool[index]?.service) {
        if (config.get<boolean>('rotate_active_account_number', false)) {
          logger.debug(`Returning ${accountPool[index].service} account number ${index}: ${accountPool[index].uuid}`);
          config.set('active_account_number', index);
          config.save();
        }
        return accountPool[index];
      }
    }
  }
  
  return undefined;
}

export const getAccount = getAccountToken;
