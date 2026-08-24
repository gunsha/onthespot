import * as fs from 'fs';
import * as path from 'path';
import { Account } from '../types/account';

export function configDir(): string {
  let baseDir = '';
  if (Bun.env.ONTHESPOTDIR && fs.existsSync(Bun.env.ONTHESPOTDIR)) {
    return Bun.env.ONTHESPOTDIR;
  } else if (process.platform === 'win32' && Bun.env.APPDATA && fs.existsSync(Bun.env.APPDATA)) {
    baseDir = Bun.env.APPDATA;
  } else if (process.platform === 'win32' && Bun.env.LOCALAPPDATA && fs.existsSync(Bun.env.LOCALAPPDATA)) {
    baseDir = Bun.env.LOCALAPPDATA;
  } else if (Bun.env.XDG_CONFIG_HOME && fs.existsSync(Bun.env.XDG_CONFIG_HOME)) {
    baseDir = Bun.env.XDG_CONFIG_HOME;
  } else {
    baseDir = path.join(Bun.env.HOME || process.env.HOME || '', '.config');
  }
  return path.join(baseDir, 'onthespot');
}

export function cacheDir(): string {
  let baseDir = '';
  if (process.platform === 'win32' && Bun.env.TEMP && fs.existsSync(Bun.env.TEMP)) {
    baseDir = Bun.env.TEMP;
  } else if (Bun.env.XDG_CACHE_HOME && fs.existsSync(Bun.env.XDG_CACHE_HOME)) {
    baseDir = Bun.env.XDG_CACHE_HOME;
  } else {
    baseDir = path.join(Bun.env.HOME || process.env.HOME || '', '.cache');
  }
  return path.join(baseDir, 'onthespot');
}

export class ConfigManager {
  private configPath: string;
  public readonly ext: string;
  public readonly sessionUuid: string;
  private templateData: Record<string, any>;
  private config: Record<string, any>;

  constructor(cfgPath?: string) {
    if (!cfgPath || !fs.existsSync(cfgPath)) {
      cfgPath = path.join(configDir(), 'otsconfig.json');
    }
    this.configPath = cfgPath;
    this.ext = process.platform === 'win32' ? '.exe' : '';
    this.sessionUuid = crypto.randomUUID();

    const templateData: Record<string, any> = {
      // System Variables
      version: 'v1.1.4',
      debug_mode: false,
      language_index: 0,
      total_downloaded_items: 0,
      total_downloaded_data: 0,
      m3u_format: 'm3u8',
      use_double_digit_path_numbers: false,
      ffmpeg_args: [],

      // Accounts
      active_account_number: 0,
      accounts: [
        { uuid: 'public_bandcamp', service: 'bandcamp', active: true },
        { uuid: 'public_deezer', service: 'deezer', active: true, login: { arl: 'public_deezer' } },
        { uuid: 'public_soundcloud', service: 'soundcloud', active: true, login: { client_id: 'null', app_version: 'null', app_locale: 'null' } },
        { uuid: 'public_youtube_music', service: 'youtube_music', active: true },
        { uuid: 'public_crunchyroll', service: 'crunchyroll', active: true },
      ],

      // Web UI Settings
      use_webui_login: false,
      webui_username: '',
      webui_password: '',

      // General Settings
      language: 'en_US',
      theme: 'background-color: #282828; color: white;',
      explicit_label: '🅴',
      download_copy_btn: false,
      download_open_btn: true,
      download_locate_btn: true,
      download_delete_btn: false,
      show_search_thumbnails: true,
      show_download_thumbnails: false,
      thumbnail_size: 60,
      max_search_results: 10,
      disable_download_popups: false,
      windows_10_explorer_thumbnails: false,
      mirror_spotify_playback: false,
      close_to_tray: false,
      check_for_updates: true,
      illegal_character_replacement: '-',
      raw_media_download: false,
      rotate_active_account_number: false,
      download_delay: 3,
      download_chunk_size: 50000,
      maximum_queue_workers: 1,
      maximum_download_workers: 1,
      enable_retry_worker: false,
      retry_worker_delay: 10,

      // Search Settings
      enable_search_tracks: true,
      enable_search_albums: true,
      enable_search_playlists: true,
      enable_search_artists: true,
      enable_search_episodes: true,
      enable_search_podcasts: true,
      enable_search_audiobooks: true,

      // Download Queue Filter Settings
      download_queue_show_waiting: true,
      download_queue_show_failed: true,
      download_queue_show_cancelled: true,
      download_queue_show_unavailable: true,
      download_queue_show_completed: true,

      // Audio Download Settings
      audio_download_path: path.join(Bun.env.HOME || process.env.HOME || '', 'Music', 'OnTheSpot'),
      track_file_format: 'mp3',
      track_path_formatter: `Tracks${path.sep}{album_artist}${path.sep}[{year}] {album}${path.sep}{track_number}. {name}`,
      podcast_file_format: 'mp3',
      podcast_path_formatter: `Episodes${path.sep}{album}${path.sep}{name}`,
      use_playlist_path: false,
      playlist_path_formatter: `Playlists${path.sep}{playlist_name} by {playlist_owner}${path.sep}{playlist_number}. {name} - {artist}`,
      create_m3u_file: false,
      m3u_path_formatter: `M3U${path.sep}{playlist_name} by {playlist_owner}`,
      extinf_separator: '; ',
      extinf_label: '{playlist_number}. {artist} - {name}',
      save_album_cover: false,
      album_cover_format: 'png',
      resize_album_cover: false,
      album_cover_size: 640,
      file_bitrate: '320k',
      file_hertz: 44100,
      use_custom_file_bitrate: true,
      download_lyrics: false,
      only_download_synced_lyrics: false,
      only_download_plain_lyrics: false,
      save_lrc_file: false,
      translate_file_path: false,

      // Audio Metadata Settings
      metadata_separator: '; ',
      overwrite_existing_metadata: false,
      embed_branding: false,
      embed_cover: true,
      embed_artist: true,
      embed_album: true,
      embed_albumartist: true,
      embed_name: true,
      embed_year: true,
      embed_discnumber: true,
      embed_tracknumber: true,
      embed_genre: true,
      embed_performers: true,
      embed_producers: true,
      embed_writers: true,
      embed_label: true,
      embed_copyright: true,
      embed_description: true,
      embed_language: true,
      embed_isrc: true,
      embed_length: true,
      embed_url: true,
      embed_key: true,
      embed_bpm: true,
      embed_compilation: true,
      embed_lyrics: false,
      embed_explicit: false,
      embed_upc: false,
      embed_service_id: false,
      embed_timesignature: false,
      embed_acousticness: false,
      embed_danceability: false,
      embed_energy: false,
      embed_instrumentalness: false,
      embed_liveness: false,
      embed_loudness: false,
      embed_speechiness: false,
      embed_valence: false,

      // Video Download Settings
      video_download_path: path.join(Bun.env.HOME || process.env.HOME || '', 'Videos', 'OnTheSpot'),
      movie_file_format: 'mkv',
      movie_path_formatter: `Movies${path.sep}{name} ({release_year})`,
      show_file_format: 'mkv',
      show_path_formatter: `Shows${path.sep}{show_name}${path.sep}Season {season_number}${path.sep}{episode_number}. {name}`,
      preferred_video_resolution: 1080,
      download_subtitles: false,
      download_chapters: false,
      preferred_audio_language: 'en-US',
      preferred_subtitle_language: 'en-US',
      download_all_available_audio: false,
      download_all_available_subtitles: false,
    };
    this.templateData = templateData;

    // Load Config
    if (fs.existsSync(this.configPath)) {
      try {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(fileContent);
      } catch (e) {
        this.config = JSON.parse(JSON.stringify(this.templateData));
      }
    } else {
      try {
        fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      } catch (e) {
        console.log('Failed to create config dir, attempting fallback path.');
        this.configPath = path.resolve(Bun.env.HOME || process.env.HOME || '', '.config', 'otsconfig.json');
        fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.templateData, null, 4));
      this.config = JSON.parse(JSON.stringify(this.templateData));
    }

    // Make Download Dirs
    try {
      if (!fs.existsSync(this.get('audio_download_path'))) fs.mkdirSync(this.get('audio_download_path'), { recursive: true });
      if (!fs.existsSync(this.get('video_download_path'))) fs.mkdirSync(this.get('video_download_path'), { recursive: true });
    } catch (e) {
      console.log('Failed to create download dir, attempting fallback path.');
      this.set('audio_download_path', this.templateData['audio_download_path']);
      this.set('video_download_path', this.templateData['video_download_path']);
      fs.mkdirSync(this.get('audio_download_path'), { recursive: true });
      fs.mkdirSync(this.get('video_download_path'), { recursive: true });
    }

    // FFMPEG Detection
    const appRoot = path.resolve(import.meta.dir || __dirname, '..', '..');
    const ffmpegCandidates = [
      process.env.FFMPEG_PATH || '',
      '/usr/bin/ffmpeg',
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      path.join(appRoot, 'bin', 'ffmpeg', 'ffmpeg' + this.ext),
    ];

    let ffmpegPath = '';
    for (const p of ffmpegCandidates) {
      if (p && fs.existsSync(p)) {
        try {
          fs.accessSync(p, fs.constants.X_OK);
          ffmpegPath = p;
          break;
        } catch {
          // not executable
        }
      }
    }
    if (!ffmpegPath) {
      console.log('Failed to find ffmpeg binary, please consider installing ffmpeg or defining its path by setting FFMPEG_PATH.');
    } else {
      console.log(`FFMPEG Binary: ${ffmpegPath}`);
    }

    this.set('_ffmpeg_bin_path', ffmpegPath);
    this.set('_log_file', path.join(cacheDir(), 'logs', this.sessionUuid, 'onthespot.log'));
    this.set('_cache_dir', cacheDir());

    try {
      fs.mkdirSync(path.dirname(this.get('_log_file')), { recursive: true });
    } catch (e) {
      const fallbackLogdir = path.resolve('.logs', this.sessionUuid, 'onthespot.log');
      console.log(`Current logging dir cannot be set up at "${this.get('audio_download_path')}"; Falling back to : ${fallbackLogdir}`);
      this.set('_log_file', fallbackLogdir);
      fs.mkdirSync(path.dirname(this.get('_log_file')), { recursive: true });
    }

    this.migration();
  }

  public get<T>(key: string, defaultValue?: T): T {
    if (this.config.hasOwnProperty(key)) {
      return this.config[key] as T;
    } else if (this.templateData.hasOwnProperty(key)) {
      return this.templateData[key] as T;
    }
    return defaultValue as T;
  }

  public set(key: string, value: any): any {
    // Basic clone for objects/arrays
    if (typeof value === 'object' && value !== null) {
      this.config[key] = JSON.parse(JSON.stringify(value));
    } else {
      this.config[key] = value;
    }
    return value;
  }

  public save(): void {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    for (const key of Object.keys(this.templateData)) {
      if (!this.config.hasOwnProperty(key) && !key.startsWith('_')) {
        this.set(key, this.templateData[key]);
      }
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
  }

  public reset(): void {
    fs.writeFileSync(this.configPath, JSON.stringify(this.templateData, null, 4));
    this.config = JSON.parse(JSON.stringify(this.templateData));
  }

  private migration(): void {
    const currentVerStr = this.get<string>('version').replace('v', '').replace(/\./g, '');
    const templateVerStr = this.templateData['version'].replace('v', '').replace(/\./g, '');

    if (parseInt(currentVerStr) < parseInt(templateVerStr)) {
      const oldConfigPath = path.join(configDir(), 'config.json');
      if (fs.existsSync(oldConfigPath)) {
        fs.unlinkSync(oldConfigPath);
      }

      // Migration (>v1.0.3)
      if (typeof this.get('file_hertz') === 'string') {
        this.set('file_hertz', parseInt(this.get('file_hertz')));
      }

      // Migration (>v1.0.4)
      if (this.get('theme') === 'dark') {
        this.set('theme', `background-color: #282828; color: white;`);
      } else if (this.get('theme') === 'light') {
        this.set('theme', `background-color: white; color: black;`);
      }

      // Migration (>v1.0.5)
      const accounts = [...this.get<any[]>('accounts', [])];
      for (const account of accounts) {
        if (account.uuid === 'public_youtube') {
          account.uuid = 'public_youtube_music';
          account.service = 'youtube_music';
        }
      }
      this.set('accounts', accounts);

      // Migration (>v1.0.7)
      if (parseInt(currentVerStr) < 110) {
        const updatedKeys: [string, string | boolean][] = [
          ['active_account_number', 'parsing_acc_sn'],
          ['thumbnail_size', 'search_thumb_height'],
          ['disable_download_popups', 'disable_bulk_dl_notices'],
          ['raw_media_download', 'force_raw'],
          ['download_chunk_size', 'chunk_size'],
          ['rotate_active_account_number', 'rotate_acc_sn'],
          ['audio_download_path', 'download_root'],
          ['track_file_format', 'media_format'],
          ['podcast_file_format', 'podcast_media_format'],
          ['video_download_path', 'generic_download_root'],
          ['create_m3u_file', 'create_m3u_playlists'],
          ['m3u_path_formatter', 'm3u_name_formatter'],
          ['enable_search_podcasts', 'enable_search_shows'],
          ['extinf_separator', 'ext_seperator'],
          ['extinf_label', 'ext_path'],
          ['download_lyrics', 'inp_enable_lyrics'],
          ['save_lrc_file', 'use_lrc_file'],
          ['only_download_synced_lyrics', 'only_synced_lyrics'],
          ['preferred_video_resolution', 'maximum_generic_resolution'],
          ['use_custom_file_bitrate', true], // 'true' is not a string key, handled separately in python? python code uses boolean true here, we will ignore if so.
        ];

        for (const [newKey, oldKey] of updatedKeys) {
          if (typeof oldKey === 'string' && this.config.hasOwnProperty(oldKey)) {
            const val = this.get(oldKey);
            if (val !== undefined) {
              this.set(newKey, val);
              delete this.config[oldKey];
            }
          }
        }
      }

      this.set('version', this.templateData['version']);
      this.save();
    }

    // Language handling
    const langIndex = this.get<number>('language_index');
    switch (langIndex) {
      case 0:
        this.set('language', 'en_US');
        break;
      case 1:
        this.set('language', 'de_DE');
        break;
      case 2:
        this.set('language', 'ja_JP');
        break;
      case 3:
        this.set('language', 'pt_PT');
        break;
      default:
        console.log(`Unknown language index: ${langIndex}`);
        this.set('language', 'en_US');
    }
    this.save();
  }
}

export const config = new ConfigManager();
