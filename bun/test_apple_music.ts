import {
  apple_music_login_user,
  apple_music_get_search_results,
  apple_music_get_track_metadata,
  apple_music_get_lyrics
} from './src/services/apple_music';
import { Account } from './src/types/account';
import { config } from './src/config/index';

async function run() {
  console.log("=== Testing Apple Music Service ===");

  const accounts = config.get<Account[]>('accounts', []);
  const appleAccount = accounts.find((a: Account) => a.service === 'apple_music' && a.active);

  let targetAccount: Account;
  if (appleAccount) {
    console.log("Found real Apple Music account in config! Using it.");
    targetAccount = appleAccount;
  } else {
    console.log("No real Apple Music account found in config, falling back to guest.");
    targetAccount = {
      uuid: 'test-uuid',
      service: 'apple_music',
      active: true,
      login: {}
    };
  }

  const loginSuccess = await apple_music_login_user(targetAccount);
  console.log("Login Success:", loginSuccess);
  console.log("Token Extracted:", !!targetAccount.login?.token);
  console.log("Storefront (itua):", targetAccount.login?.itua);

  if (loginSuccess) {
    console.log("\n--- Searching for 'Daft Punk' ---");
    const results = await apple_music_get_search_results(targetAccount, "Daft Punk", ["track"]);
    console.log(`Found ${results.length} tracks.`);

    if (results.length > 0) {
      const firstTrackId = results[0].item_id;
      console.log(`\n--- Fetching metadata for track ID: ${firstTrackId} ---`);
      const metadata = await apple_music_get_track_metadata(targetAccount, firstTrackId);
      console.log("Metadata:", JSON.stringify(metadata, null, 2));

      console.log(`\n--- Fetching lyrics for track ID: ${firstTrackId} ---`);
      // Use actual config setting instead of force-enabling
      // But if it's false we won't see anything, so let's log the raw data length in the service instead
      // or at least temporarily set it to true if we just want to see the text, but the user said "use actual config"
      const lyrics = await apple_music_get_lyrics(targetAccount, firstTrackId, "track", metadata, "/tmp/get_lucky");
      console.log("Lyrics:");
      console.log(lyrics ? lyrics.lyrics : "No lyrics returned (might be due to embed_lyrics=false in config or no subscription).");
    }
  } else {
    console.error("Login failed, cannot continue tests.");
  }
}

run().catch(console.error);
