import { config } from '../../config/index';
import { accountPool } from '../../accounts/index';
import { extractInfo } from '../../utils/ytdlp';
import { ItemMetadata } from '../../types/track';
import { ServiceItem } from '../../types/service';
import { Account } from '../../types/account';

export async function youtube_music_login_user(account: Account): Promise<boolean> {
  console.log('Logging into Youtube account...');
  try {
    // Ping to verify connectivity
    const res = await fetch('https://youtube.com', { method: 'HEAD' });
    if (!res.ok && res.status !== 405) {
      throw new Error(`Failed to ping youtube: ${res.status}`);
    }

    if (account.uuid === 'public_youtube_music') {
      accountPool.push({
        uuid: 'public_youtube',
        login: { username: 'yt-dlp' },
        service: 'youtube_music',
        active: true,
      });
      return true;
    }
    return false;
  } catch (e: any) {
    console.error(`Unknown Exception: ${e.message}`);
    accountPool.push({
      uuid: account.uuid,
      login: { username: 'yt-dlp' },
      service: 'youtube_music',
      active: false,
    });
    return false;
  }
}

export function youtube_music_add_account(): void {
  const cfgCopy = [...config.get<Account[]>('accounts', [])];
  const newUser: Account = {
    uuid: 'public_youtube_music',
    service: 'youtube_music',
    active: true,
  };
  cfgCopy.push(newUser);
  config.set('accounts', cfgCopy);
  config.save();
}

export async function youtube_music_get_search_results(_account: Account | undefined, searchTerm: string, contentTypes: string[]): Promise<ServiceItem[]> {
  const searchResults: ServiceItem[] = [];
  
  if (contentTypes.includes('track')) {
    const limit = config.get<number>('max_search_results', 10);
    const searchStr = `ytsearch${limit}:${searchTerm}`;
    
    try {
      const result = await extractInfo(searchStr, true);
      const entries = result.entries || (result.id ? [result] : []);
      
      for (const entry of entries) {
         if (!entry.id) continue;
         searchResults.push({
             item_id: entry.id,
             // Not completely matching original python variable names because ServiceItem has specific fields, we will adapt it slightly
             playlist_name: entry.title, // 'item_name' equivalent
             playlist_by: entry.channel, // 'item_by' equivalent
             item_type: 'track',
             item_service: 'youtube_music',
             file_path: `https://music.youtube.com/watch?v=${entry.id}` // 'item_url' equivalent
         });
      }
    } catch (e) {
      console.error('Error in youtube_music_get_search_results', e);
    }
  }

  console.log(searchResults);
  return searchResults;
}

export async function youtube_music_get_track_metadata(_account: Account | undefined, itemId: string): Promise<ItemMetadata> {
  const url = `https://music.youtube.com/watch?v=${itemId}`;
  const infoDict = await extractInfo(url, false);

  // Convert length to milliseconds
  const timestamp = infoDict.duration_string;
  let length: number | string = 0;
  
  try {
    if (timestamp) {
      const parts = timestamp.split(':');
      let totalSeconds = 0;
      if (parts.length === 3) {
        totalSeconds = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
      } else if (parts.length === 2) {
        totalSeconds = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
      } else if (parts.length === 1) {
        totalSeconds = parseInt(timestamp);
      }
      length = totalSeconds * 1000;
    }
  } catch (e) {
    console.error(`Invalid timestamp: ${timestamp}`);
    length = 0;
  }

  // Get thumbnail url
  let thumbnailUrl: string | undefined = undefined;
  const thumbnails = infoDict.thumbnails || [];
  
  for (const thumbnail of thumbnails) {
    const currentUrl = thumbnail.url;
    if (currentUrl && currentUrl.includes('googleusercontent.com')) {
      thumbnailUrl = currentUrl;
    }
  }

  if (!thumbnailUrl && thumbnails.length > 0) {
    thumbnailUrl = thumbnails[thumbnails.length - 1].url;
  }

  const info: ItemMetadata = {};
  info.title = infoDict.title;
  const album = infoDict.album;
  info.album_name = album ? album : infoDict.title;
  info.artists = infoDict.channel;
  info.album_artists = infoDict.channel;
  info.description = infoDict.description;
  info.image_url = thumbnailUrl;
  info.language = infoDict.language;
  info.item_url = url;
  
  const releaseYear = infoDict.release_year;
  const uploadDate = infoDict.upload_date;
  info.release_year = String(releaseYear ? releaseYear : (uploadDate ? uploadDate.substring(0, 4) : ''));
  info.length = length;
  
  info.isrc = undefined; // Not easily available in yt-dlp generic
  
  return info;
}

export async function youtube_music_get_playlist_data(_account: Account | undefined, playlistId: string): Promise<[string, string, string[]]> {
  const url = `https://music.youtube.com/playlist?list=${playlistId}`;
  const playlistData = await extractInfo(url, true);
  
  const playlistName = playlistData.title || '';
  const playlistBy = playlistData.channel || '';
  
  const trackIds: string[] = [];
  if (playlistData.entries) {
     for (const entry of playlistData.entries) {
       if (entry.id) {
          trackIds.push(entry.id);
       }
     }
  }
  return [playlistName, playlistBy, trackIds];
}

export async function youtube_music_get_channel_track_ids(_account: Account | undefined, channelId: string): Promise<string[]> {
  const url = `https://music.youtube.com/channel/${channelId}`;
  const channelData = await extractInfo(url, true);
  
  const trackIds: string[] = [];
  if (channelData.entries) {
     for (const entry of channelData.entries) {
       if (entry.id) {
          trackIds.push(entry.id);
       }
     }
  }
  return trackIds;
}
