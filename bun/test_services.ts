import { config } from './src/config/index';
import { fillAccountPool, getAccountToken, accountPool } from './src/accounts/index';
import { ServiceRegistry } from './src/services/index';
import { Service } from './src/types/service';

async function main() {
  console.log('--- Config initialization ---');
  // Config loads automatically on import
  console.log('Config accounts:', JSON.stringify(config.get('accounts'), null, 2));

  console.log('\n--- Testing fillAccountPool ---');
  await fillAccountPool((msg, success) => {
    console.log(`[Progress] ${msg.replace(/\n/g, ' ')} - Success: ${success}`);
  });

  console.log('\nAccount Pool loaded:');
  console.log(accountPool.map(a => `${a.uuid} (${a.service}) [active: ${a.active}]`));

  console.log('\n--- Testing getAccountToken ---');
  const ytAcc = getAccountToken(Service.YOUTUBE_MUSIC);
  console.log('Youtube Music Account:', ytAcc ? ytAcc.uuid : 'None');

  const amAcc = getAccountToken(Service.APPLE_MUSIC);
  console.log('Apple Music Account:', amAcc ? amAcc.uuid : 'None');

  console.log('\n--- Testing Service Registry calls ---');
  if (true) {
    const ytService = ServiceRegistry[Service.YOUTUBE_MUSIC];
    if (ytService && ytService.get_search_results) {
        console.log('Executing youtube search for "Rick Astley Never Gonna Give You Up"');
        const results = await ytService.get_search_results(ytAcc, 'Rick Astley Never Gonna Give You Up', ['track']);
        console.log('Search Results count:', results.length);
        if (results.length > 0) {
            console.log('First result:', results[0]);
        }
    }
  }

  console.log('\nDone.');
}

main().catch(console.error);
