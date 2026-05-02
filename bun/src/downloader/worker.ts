import * as fs from 'fs';
import * as path from 'path';
import { DownloadItem, downloadQueue } from './index';
import { getLogger } from '../logger/index';
import { ServiceRegistry } from '../services/index';
import { getAccountToken } from '../accounts/index';
import { downloadMedia } from '../utils/ytdlp';
import { decryptAppleMusic, embedMetadata, setMusicThumbnail } from '../metadata/index';
import { formatItemPath } from '../utils/path';
import { config } from '../config/index';
import { Service } from '../types/service';

const logger = getLogger('downloader');

export async function processQueueItem(item: DownloadItem): Promise<void> {
  item.item_status = 'Downloading';
  item.progress = 1;

  const service = item.item_service as Service;
  const token = getAccountToken(service, config.get<boolean>('rotate_active_account_number', false));
  const serviceAdapter = ServiceRegistry[service];

  if (!serviceAdapter || !serviceAdapter.get_track_metadata) {
    throw new Error(`Service adapter for ${service} does not support get_track_metadata`);
  }

  const metadata = await serviceAdapter.get_track_metadata(token, item.item_id);
  
  if (service === Service.YOUTUBE_MUSIC && item.parent_category === 'album') {
    metadata.track_number = item.playlist_number;
  }

  // Adding item_id to metadata for path formatting
  metadata.item_id = item.item_id;

  const itemPathStr = formatItemPath(item as any, metadata);
  const dlRoot = config.get<string>('audio_download_path', './downloads');
  const filePath = path.join(dlRoot, itemPathStr);
  const directory = path.dirname(filePath);
  const fileName = path.basename(filePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const tempFilePath = path.join(directory, `~${fileName}`);
  let defaultFormat = '.m4a';

  if (service === Service.APPLE_MUSIC) {
    defaultFormat = '.m4a';
  } else if (service === Service.YOUTUBE_MUSIC || service === ('generic' as any)) {
    defaultFormat = '.m4a';
  }
  
  const finalFileWithExt = filePath + defaultFormat;

  if (fs.existsSync(finalFileWithExt) && !config.get<boolean>('overwrite_existing_metadata')) {
    item.item_status = 'Already Exists';
    item.progress = 100;
    logger.info(`File already exists, Skipping download for track by id '${item.item_id}'`);
    return;
  }

  // Handle generic and youtube music
  if (service === Service.YOUTUBE_MUSIC || service === ('generic' as any)) {
    let itemUrl = metadata.item_url || `https://music.youtube.com/watch?v=${item.item_id}`;
    
    item.item_status = 'Downloading';
    const extraArgs = [
      '--extract-audio',
      '--audio-format', 'm4a',
      '--audio-quality', '0'
    ];
    await downloadMedia(itemUrl, tempFilePath, extraArgs);
  } else if (service === Service.APPLE_MUSIC) {
    item.item_status = 'Downloading';
    const webplaybackInfo = await serviceAdapter.get_webplayback_info?.(token, item.item_id);
    let streamUrl: string | null = null;

    if (webplaybackInfo && webplaybackInfo.assets) {
      for (const asset of webplaybackInfo.assets) {
        if (asset.flavor === '28:ctrp256') {
          streamUrl = asset.URL;
          break;
        }
      }
    }

    if (!streamUrl) {
      throw new Error(`Apple music playback info invalid or no stream URL found`);
    }

    const decryptionKey = await serviceAdapter.get_decryption_key?.(token, streamUrl, item.item_id);
    if (!decryptionKey) {
       throw new Error(`Failed to get decryption key for Apple Music track`);
    }

    const extraArgs = [
      '--allow-unplayable-formats',
      '--fixup', 'never'
    ];
    
    await downloadMedia(streamUrl, tempFilePath, extraArgs);

    item.item_status = 'Decrypting';
    item.progress = 99;
    await decryptAppleMusic(tempFilePath, decryptionKey);
  } else {
    throw new Error(`Unsupported service for download: ${service}`);
  }

  // Metadata Embedding
  item.item_status = 'Converting';
  fs.renameSync(tempFilePath, finalFileWithExt);
  item.file_path = finalFileWithExt;

  if (!config.get<boolean>('raw_media_download', false)) {
     await embedMetadata(finalFileWithExt, metadata);
     
     if (config.get<boolean>('save_album_cover') || config.get<boolean>('embed_cover')) {
        item.item_status = 'Setting Thumbnail';
        await setMusicThumbnail(finalFileWithExt, metadata);
     }
  } else {
     if (config.get<boolean>('save_album_cover')) {
        item.item_status = 'Setting Thumbnail';
        await setMusicThumbnail(finalFileWithExt, metadata);
     }
  }

  item.item_status = 'Done';
  item.progress = 100;
  logger.info(`Item Successfully Downloaded: ${item.item_id}`);
}
