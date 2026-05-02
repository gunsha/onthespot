import { config } from './src/config/index';
import { fillAccountPool, getAccountToken } from './src/accounts/index';
import { addDownloadItem, startDownloadWorkers, downloadQueue, stopDownloadWorkers } from './src/downloader/index';
import { ServiceRegistry } from './src/services/index';
import { Service } from './src/types/service';

async function main() {
  console.log('Loading configuration and accounts...');
  const poolSize = await fillAccountPool();
  console.log(`Loaded ${poolSize} accounts.`);

  const amAcc = getAccountToken(Service.APPLE_MUSIC);
  if (!amAcc) {
     console.error('No Apple Music account available. Aborting.');
     process.exit(1);
  }

  const amService = ServiceRegistry[Service.APPLE_MUSIC];
  if (!amService || !amService.get_search_results) {
     console.error('Apple Music service not properly loaded.');
     process.exit(1);
  }

  console.log('Searching for an Apple Music track...');
  const results = await amService.get_search_results(amAcc, 'Rick Astley Never Gonna Give You Up', ['track']);
  if (results.length === 0) {
      console.error('No results found.');
      process.exit(1);
  }

  const testTrack = results[0];
  console.log(`Found track: ${testTrack.name} (${testTrack.item_id})`);

  console.log('Adding test track to queue...');
  const itemId = addDownloadItem({
    item_id: testTrack.item_id,
    item_service: Service.APPLE_MUSIC,
    item_type: 'track'
  });

  console.log(`Item added with local ID: ${itemId}`);

  console.log('Starting workers...');
  startDownloadWorkers(1);

  // Poll until it's done
  const pollInterval = setInterval(() => {
    const item = downloadQueue.get(itemId);
    if (!item) {
      console.error('Item disappeared from queue!');
      clearInterval(pollInterval);
      stopDownloadWorkers();
      process.exit(1);
    }

    console.log(`[Status] ${item.item_status} - Progress: ${item.progress}%`);

    if (item.item_status === 'Done' || item.item_status === 'Failed' || item.item_status === 'Already Exists') {
      clearInterval(pollInterval);
      stopDownloadWorkers();
      console.log(`Download finished with status: ${item.item_status}`);
      if (item.file_path) {
         console.log(`File saved to: ${item.file_path}`);
      }
      process.exit(item.item_status === 'Failed' ? 1 : 0);
    }
  }, 1000);
}

main().catch(console.error);
