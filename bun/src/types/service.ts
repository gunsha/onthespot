export enum Service {
  BANDCAMP = 'bandcamp',
  DEEZER = 'deezer',
  SOUNDCLOUD = 'soundcloud',
  YOUTUBE_MUSIC = 'youtube_music',
  CRUNCHYROLL = 'crunchyroll',
  SPOTIFY = 'spotify',
  TIDAL = 'tidal',
  QOBUZ = 'qobuz',
  APPLE_MUSIC = 'apple_music',
}

export interface ServiceItem {
  item_service: Service | string;
  item_id: string | number;
  item_type: 'track' | 'podcast_episode' | 'movie' | 'episode' | string;
  parent_category?: 'playlist' | 'album' | string;
  playlist_name?: string;
  playlist_by?: string;
  playlist_number?: number;
  file_path?: string;
}
