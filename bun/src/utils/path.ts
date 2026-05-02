import { config } from '../config/index';
import { ServiceItem } from '../types/service';
import { ItemMetadata } from '../types/track';

export function sanitizeData(value?: string | number | boolean | null): string {
  if (value === null || value === undefined) {
    return '';
  }

  let strValue = String(value);
  const char = config.get<string>('illegal_character_replacement') || '-';

  if (process.platform === 'win32') {
    const illegalChars = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
    for (const illegalChar of illegalChars) {
      strValue = strValue.split(illegalChar).join(char);
    }
    while (strValue.endsWith('.') || strValue.endsWith(' ')) {
      strValue = strValue.slice(0, -1);
    }
  } else {
    strValue = strValue.split('/').join(char);
  }
  return strValue;
}

export function formatItemPath(item: ServiceItem, itemMetadata: ItemMetadata): string {
  // Skipping translate logic from original for now to keep it simple,
  // as it requires a web request to google translate in original.
  const name = itemMetadata.title || '';
  const album = itemMetadata.album_name || '';

  let pathTemplate = '';

  if (item.parent_category === 'playlist' && config.get<boolean>('use_playlist_path')) {
    pathTemplate = config.get<string>('playlist_path_formatter');
  } else if (item.item_type === 'track') {
    pathTemplate = config.get<string>('track_path_formatter');
  } else if (item.item_type === 'podcast_episode') {
    pathTemplate = config.get<string>('podcast_path_formatter');
  } else if (item.item_type === 'movie') {
    pathTemplate = config.get<string>('movie_path_formatter');
  } else if (item.item_type === 'episode') {
    pathTemplate = config.get<string>('show_path_formatter');
  }

  const useDoubleDigit = config.get<boolean>('use_double_digit_path_numbers');

  const formatNumber = (num: number | string | undefined, defaultVal = 1) => {
    let val = num !== undefined ? num : defaultVal;
    return useDoubleDigit ? String(val).padStart(2, '0') : String(val);
  };

  const replacements: Record<string, string> = {
    // Universal
    '{service}': sanitizeData(String(item.item_service).charAt(0).toUpperCase() + String(item.item_service).slice(1)),
    '{service_id}': String(itemMetadata.item_id || ''),
    '{name}': sanitizeData(name),
    '{year}': sanitizeData(itemMetadata.release_year),
    '{explicit}': sanitizeData(itemMetadata.explicit ? config.get<string>('explicit_label') : ''),

    // Audio
    '{artist}': sanitizeData(itemMetadata.artists),
    '{album}': sanitizeData(album),
    '{album_artist}': sanitizeData(itemMetadata.album_artists),
    '{album_type}': (itemMetadata.album_type || 'single').charAt(0).toUpperCase() + (itemMetadata.album_type || 'single').slice(1),
    '{disc_number}': formatNumber(itemMetadata.disc_number),
    '{track_number}': formatNumber(itemMetadata.track_number),
    '{genre}': sanitizeData(itemMetadata.genre),
    '{label}': sanitizeData(itemMetadata.label),
    '{trackcount}': formatNumber(itemMetadata.total_tracks),
    '{disccount}': formatNumber(itemMetadata.total_discs),
    '{isrc}': String(itemMetadata.isrc || ''),
    '{playlist_name}': sanitizeData(item.playlist_name),
    '{playlist_owner}': sanitizeData(item.playlist_by),
    '{playlist_number}': sanitizeData(item.playlist_number),

    // Show
    '{show_name}': sanitizeData(itemMetadata.show_name),
    '{season_number}': formatNumber(itemMetadata.season_number),
    '{episode_number}': formatNumber(itemMetadata.episode_number),
  };

  let formattedPath = pathTemplate;
  for (const [key, value] of Object.entries(replacements)) {
    formattedPath = formattedPath.split(key).join(value);
  }

  return formattedPath;
}
