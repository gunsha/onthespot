import { getLogger } from '../logger/index';
import { processQueueItem } from './worker';

const logger = getLogger('downloader');

export interface DownloadItem {
  local_id: string;
  item_id: string;
  item_service: string;
  item_type: string;
  item_status: string; // "Waiting", "Downloading", "Converting", "Done", "Failed", "Already Exists"
  progress: number;
  parent_category?: string;
  playlist_number?: number;
  playlist_name?: string;
  playlist_by?: string;
  file_path?: string;
  available: boolean; // Controls whether a worker can pick it up
}

export const downloadQueue: Map<string, DownloadItem> = new Map();

let isRunning = false;

export function addDownloadItem(item: Omit<DownloadItem, 'local_id' | 'item_status' | 'progress' | 'available'>): string {
  let suffix = 0;
  let localId = `${item.item_id}-${suffix}`;
  while (downloadQueue.has(localId)) {
    suffix++;
    localId = `${item.item_id}-${suffix}`;
  }

  downloadQueue.set(localId, {
    ...item,
    local_id: localId,
    item_status: 'Waiting',
    progress: 0,
    available: true,
  });

  return localId;
}

export async function startDownloadWorkers(concurrency: number = 2) {
  if (isRunning) return;
  isRunning = true;
  logger.info(`Starting Download Workers with concurrency ${concurrency}`);

  const workers = Array.from({ length: concurrency }).map(async (_, workerId) => {
    while (isRunning) {
      let nextItem: DownloadItem | undefined;

      // Find an available item in the queue
      for (const [id, item] of downloadQueue.entries()) {
        if (item.available && item.item_status === 'Waiting') {
          item.available = false;
          nextItem = item;
          break;
        }
      }

      if (!nextItem) {
        await Bun.sleep(200); // Wait briefly before checking again
        continue;
      }

      try {
        await processQueueItem(nextItem);
      } catch (err: any) {
        logger.error(`Worker ${workerId} failed processing ${nextItem.local_id}: ${err.message}`);
        if (nextItem.item_status !== 'Cancelled') {
           nextItem.item_status = 'Failed';
        }
        nextItem.progress = 0;
      } finally {
        nextItem.available = true; // Free it up in case it needs retry or is done
      }
    }
  });

  // We return immediately, workers run in background
  // await Promise.all(workers);
}

export function stopDownloadWorkers() {
  isRunning = false;
  logger.info('Stopping Download Workers');
}
