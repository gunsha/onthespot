import { Account } from '../types/account';
import { ServiceItem, Service } from '../types/service';
import { ItemMetadata } from '../types/track';

import * as appleMusic from './apple_music/index';
import * as youtubeMusic from './youtube_music/index';

export interface IService {
  login_user(account: Account): Promise<boolean>;
  add_account?(token?: string): void;
  get_search_results?(account: Account | undefined, searchTerm: string, contentTypes: string[]): Promise<ServiceItem[]>;
  get_track_metadata?(account: Account | undefined, itemId: string): Promise<ItemMetadata>;
  get_playlist_data?(account: Account | undefined, playlistId: string): Promise<[string, string, string[]]>;
  [key: string]: any;
}

export const ServiceRegistry: Partial<Record<Service | string, IService>> = {
  [Service.APPLE_MUSIC]: {
    login_user: appleMusic.apple_music_login_user,
    add_account: appleMusic.apple_music_add_account,
    get_search_results: appleMusic.apple_music_get_search_results,
    get_track_metadata: appleMusic.apple_music_get_track_metadata,
    get_playlist_data: appleMusic.apple_music_get_playlist_data,
    get_lyrics: appleMusic.apple_music_get_lyrics,
    get_webplayback_info: appleMusic.apple_music_get_webplayback_info,
    get_album_track_ids: appleMusic.apple_music_get_album_track_ids,
    get_artist_album_ids: appleMusic.apple_music_get_artist_album_ids,
    get_decryption_key: appleMusic.apple_music_get_decryption_key,
  },
  [Service.YOUTUBE_MUSIC]: {
    login_user: youtubeMusic.youtube_music_login_user,
    add_account: youtubeMusic.youtube_music_add_account,
    get_search_results: youtubeMusic.youtube_music_get_search_results,
    get_track_metadata: youtubeMusic.youtube_music_get_track_metadata,
    get_playlist_data: youtubeMusic.youtube_music_get_playlist_data,
    get_channel_track_ids: youtubeMusic.youtube_music_get_channel_track_ids,
  }
};
