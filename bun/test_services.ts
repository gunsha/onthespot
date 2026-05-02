import { generic_list_extractors, generic_get_track_metadata } from './src/services/generic/index';
import { youtube_music_get_track_metadata, youtube_music_get_search_results } from './src/services/youtube_music/index';

async function runTests() {
  console.log('--- Testing Generic Service ---');
  
  try {
    const extractors = await generic_list_extractors();
    console.log(`Found ${extractors.length} generic extractors`);
    if (extractors.length > 0) {
      console.log(`First 5 extractors: ${extractors.slice(0, 5).join(', ')}`);
    }

    console.log('\nFetching generic metadata for a youtube video...');
    const genericMeta = await generic_get_track_metadata(undefined, 'https://www.youtube.com/watch?v=jNQXAC9IVRw');
    console.log('Generic Meta:', genericMeta);
  } catch (e) {
    console.error('Generic Service tests failed:', e);
  }

  console.log('\n--- Testing YouTube Music Service ---');
  try {
    console.log('\nSearching for "Rick Astley" on YouTube Music...');
    const searchResults = await youtube_music_get_search_results(undefined, 'Rick Astley Never Gonna Give You Up', ['track']);
    console.log(`Found ${searchResults.length} search results`);
    
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      console.log('First search result:', firstResult);
      
      console.log('\nFetching full metadata for the first result...');
      const fullMeta = await youtube_music_get_track_metadata(undefined, firstResult.item_id as string);
      console.log('Full Metadata:', fullMeta);
    }
  } catch (e) {
    console.error('YouTube Music Service tests failed:', e);
  }
}

runTests().then(() => console.log('\nTests completed.'));
