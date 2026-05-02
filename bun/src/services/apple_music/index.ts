import { config } from '../../config/index';
import { accountPool } from '../../accounts/index';
import { ItemMetadata } from '../../types/track';
import { ServiceItem } from '../../types/service';
import { Account } from '../../types/account';
import { makeCall, MakeCallOptions } from '../../http/client';
import * as fs from 'fs';
import { Widevine, LicenseType } from 'widevine';

const BASE_URL = 'https://amp-api.music.apple.com/v1';
const WVN_LICENSE_URL = 'https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/acquireWebPlaybackLicense';

// Base64 encoded WVD blob matching python constants.py
const WVN_KEY_B64 =
  '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QrSyZcBqHO0QrdPcU35GBT7S7+IJr2AAXvnjqnb8yrtpPWN2ZW/IWUJN2z4vZ7/HV4aj3OZhkxC1DIMNyvsusUKoQQuf8gwKiEe8cFwbwFSicywlFk9la2IPe8oFShcxAzHLCCn/TIYUAvEL3/4LgaZvqWm80qCPYbgIP5HT8hPYkKWJ4WYknEWK+3InbnkzteFfGrQFCq4CCAESEGnj6Ji7LD+4o7MoHYT4jBQYjtW+kQUijgIwggEKAoIBAQDY9um1ifBRIOmkPtDZTqH+CZUBbb0eK0Cn3NHFf8MFUDzPEz+emK/OTub/hNxCJCao//pP5L8tRNUPFDrrvCBMo7Rn+iUb+mA/2yXiJ6ivqcN9Cu9i5qOU1ygon9SWZRsujFFB8nxVreY5Lzeq0283zn1Cg1stcX4tOHT7utPzFG/ReDFQt0O/GLlzVwB0d1sn3SKMO4XLjhZdncrtF9jljpg7xjMIlnWJUqxDo7TQkTytJmUl0kcM7bndBLerAdJFGaXc6oSY4eNy/IGDluLCQR3KZEQsy/mLeV1ggQ44MFr7XOM+rd+4/314q/deQbjHqjWFuVr8iIaKbq+R63ShAgMBAAEo8CISgAMii2Mw6z+Qs1bvvxGStie9tpcgoO2uAt5Zvv0CDXvrFlwnSbo+qR71Ru2IlZWVSbN5XYSIDwcwBzHjY8rNr3fgsXtSJty425djNQtF5+J2jrAhf3Q2m7EI5aohZGpD2E0cr+dVj9o8x0uJR2NWR8FVoVQSXZpad3M/4QzBLNto/tz+UKyZwa7Sc/eTQc2+ZcDS3ZEO3lGRsH864Kf/cEGvJRBBqcpJXKfG+ItqEW1AAPptjuggzmZEzRq5xTGf6or+bXrKjCpBS9G1SOyvCNF1k5z6lG8KsXhgQxL6ADHMoulxvUIihyPY5MpimdXfUdEQ5HA2EqNiNVNIO4qP007jW51yAeThOry4J22xs8RdkIClOGAauLIl0lLA4flMzW+VfQl5xYxP0E5tuhn0h+844DslU8ZF7U1dU2QprIApffXD9wgAACk26Rggy8e96z8i86/+YYyZQkc9hIdCAERrgEYCEbByzONrdRDs1MrS/ch1moV5pJv63BIKvQHGvLkaFwoMY29tcGFueV9uYW1lEgd1bmtub3duGioKCm1vZGVsX25hbWUSHEFuZHJvaWQgU0RLIGJ1aWx0IGZvciB4ODZfNjQaGwoRYXJjaGl0ZWN0dXJlX25hbWUSBng4Nl82NBodCgtkZXZpY2VfbmFtZRIOZ2VuZXJpY194ODZfNjQaIAoMcHJvZHVjdF9uYW1lEhBzZGtfcGhvbmVfeDg2XzY0GmMKCmJ1aWxkX2luZm8SVUFuZHJvaWQvc2RrX3Bob25lX3g4Nl82NC9nZW5lcmljX3g4Nl82NDo5L1BTUjEuMTgwNzIwLjAxMi80OTIzMjE0OnVzZXJkZWJ1Zy90ZXN0LWtleXMaHgoUd2lkZXZpbmVfY2RtX3ZlcnNpb24SBjE0LjAuMBokCh9vZW1fY3J5cHRvX3NlY3VyaXR5X3BhdGNoX2xldmVsEgEwMg4QASAAKA0wAEAASABQAA==';

// Helper to generate consistent headers
function getHeaders(account?: Account): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0',
    Accept: 'application/json',
    'Accept-Language': 'en-US',
    'Accept-Encoding': 'utf-8',
    'Content-Type': 'application/json',
    'x-apple-renewal': 'true',
    DNT: '1',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    origin: 'https://music.apple.com',
  };

  if (account && account.login) {
    if (account.login['media-user-token']) {
      headers['Media-User-Token'] = account.login['media-user-token'];
      headers['Cookie'] = `media-user-token=${account.login['media-user-token']}; itua=${account.login.itua || ''}`;
    }
    if (account.login.token) {
      headers['authorization'] = `Bearer ${account.login.token}`;
    }
  }

  return headers;
}

export function apple_music_add_account(media_user_token: string): void {
  const cfgCopy = [...config.get<Account[]>('accounts', [])];
  const newUser: Account = {
    uuid: crypto.randomUUID(),
    service: 'apple_music',
    active: true,
    login: {
      'media-user-token': media_user_token,
    },
  };
  cfgCopy.push(newUser);
  config.set('accounts', cfgCopy);
  config.save();
}

export async function apple_music_login_user(account: Account): Promise<boolean> {
  console.log('Logging into Apple Music account...');
  try {
    const headers = getHeaders(account);

    // Retrieve token from the homepage
    const homePageReq = await fetch('https://music.apple.com', { headers });
    const homePageText = await homePageReq.text();

    const indexJsMatch = homePageText.match(/\/(assets\/index-legacy[~-][^\/"]+\.js)/);
    if (!indexJsMatch) throw new Error('Could not find index.js URI');

    const indexJsUri = indexJsMatch[1];
    const indexJsReq = await fetch(`https://music.apple.com/${indexJsUri}`, { headers });
    const indexJsText = await indexJsReq.text();

    const tokenMatch = indexJsText.match(/(?=eyJh)(.*?)(?=")/);
    if (!tokenMatch) throw new Error('Could not find bearer token in index.js');

    const token = tokenMatch[1];

    // update account object with token
    if (!account.login) account.login = {};
    account.login.token = token;

    // Fetch account details
    const accountHeaders = getHeaders(account);
    const accountData = await makeCall(`${BASE_URL}/me/account?meta=subscription`, {
      headers: accountHeaders,
      params: { l: 'en-US' },
    });

    const itua = accountData?.meta?.subscription?.storefront || 'us';
    account.login.itua = itua;

    const isActive = accountData?.meta?.subscription?.active ? true : false;

    accountPool.push({
      uuid: account.uuid,
      login: { username: account.login['media-user-token'], ...account.login },
      service: 'apple_music',
      active: true,
      // For types/account compliance we may not map all custom fields directly, but for this port:
      // @ts-ignore
      status: 'active',
      // @ts-ignore
      account_type: isActive ? 'premium' : 'free',
      // @ts-ignore
      bitrate: '256k',
    });
    return true;
  } catch (e: any) {
    console.error(`Unknown Exception: ${e.message}`);
    accountPool.push({
      uuid: account.uuid,
      login: { username: account.login?.['media-user-token'] },
      service: 'apple_music',
      active: false,
      // @ts-ignore
      status: 'error',
      // @ts-ignore
      account_type: 'N/A',
      // @ts-ignore
      bitrate: 'N/A',
    });
    return false;
  }
}

export async function apple_music_get_search_results(account: Account | undefined, searchTerm: string, contentTypes: string[]): Promise<ServiceItem[]> {
  const searchTypes: string[] = [];
  if (contentTypes.includes('track')) searchTypes.push('songs');
  if (contentTypes.includes('album')) searchTypes.push('albums');
  if (contentTypes.includes('artist')) searchTypes.push('artists');
  if (contentTypes.includes('playlist')) searchTypes.push('playlists');

  const headers = getHeaders(account);
  const itua = account?.login?.itua || 'us';
  const params = {
    term: searchTerm,
    limit: String(config.get('max_search_results', 10)),
    types: searchTypes.join(','),
  };

  const results = await makeCall(`${BASE_URL}/catalog/${itua}/search`, { params, headers, skipCache: true });
  const searchResults: ServiceItem[] = [];

  if (!results || !results.results) return searchResults;

  for (const type of Object.keys(results.results)) {
    if (type === 'songs' && results.results.songs?.data) {
      for (const track of results.results.songs.data) {
        searchResults.push({
          item_id: track.id,
          // mapping item_name to playlist_name for basic compatibility with ServiceItem, or using custom fields
          playlist_name: track.attributes?.name,
          playlist_by: track.attributes?.artistName,
          item_type: 'track',
          item_service: 'apple_music',
          file_path: track.attributes?.url,
          // item_thumbnail_url
        } as any);
      }
    }

    if (type === 'albums' && results.results.albums?.data) {
      for (const album of results.results.albums.data) {
        searchResults.push({
          item_id: album.id,
          playlist_name: album.attributes?.name,
          playlist_by: album.attributes?.artistName,
          item_type: 'album',
          item_service: 'apple_music',
          file_path: album.attributes?.url,
        } as any);
      }
    }

    if (type === 'artists' && results.results.artists?.data) {
      for (const artist of results.results.artists.data) {
        searchResults.push({
          item_id: artist.id,
          playlist_name: artist.attributes?.name,
          playlist_by: artist.attributes?.name,
          item_type: 'artist',
          item_service: 'apple_music',
          file_path: artist.attributes?.url,
        } as any);
      }
    }

    if (type === 'playlists' && results.results.playlists?.data) {
      for (const playlist of results.results.playlists.data) {
        searchResults.push({
          item_id: playlist.id,
          playlist_name: playlist.attributes?.name,
          playlist_by: playlist.attributes?.curatorName,
          item_type: 'playlist',
          item_service: 'apple_music',
          file_path: playlist.attributes?.url,
        } as any);
      }
    }
  }

  return searchResults;
}

export async function apple_music_get_track_metadata(account: Account | undefined, itemId: string): Promise<ItemMetadata> {
  const headers = getHeaders(account);
  const itua = account?.login?.itua || 'us';

  const params = { include: 'lyrics' };
  const trackData = await makeCall(`${BASE_URL}/catalog/${itua}/songs/${itemId}`, { params, headers });

  let albumData: any = null;
  try {
    const albumId = trackData?.data?.[0]?.relationships?.albums?.data?.[0]?.id;
    if (albumId) {
      albumData = await makeCall(`${BASE_URL}/catalog/${itua}/albums/${albumId}`, { headers });
    }
  } catch (e) {
    //
  }

  const artists: string[] = [];
  const artistNameStr = trackData?.data?.[0]?.attributes?.artistName || '';
  for (const artist of artistNameStr.replace(/&/g, ',').split(',')) {
    artists.push(artist.trim());
  }

  const info: ItemMetadata = {};

  info.title = trackData?.data?.[0]?.attributes?.name;
  info.album_name = trackData?.data?.[0]?.attributes?.albumName;

  const genres = trackData?.data?.[0]?.attributes?.genreNames || [];
  info.genre = genres.join('; ');

  const releaseDate = trackData?.data?.[0]?.attributes?.releaseDate;
  if (releaseDate) {
    info.release_year = releaseDate.split('-')[0];
  }

  info.length = trackData?.data?.[0]?.attributes?.durationInMillis;
  info.isrc = trackData?.data?.[0]?.attributes?.isrc;

  const artwork = trackData?.data?.[0]?.attributes?.artwork;
  if (artwork) {
    info.image_url = artwork.url?.replace('{w}', String(artwork.width)).replace('{h}', String(artwork.height));
  }

  // custom writer field mapping might not strictly exist in ItemMetadata, sticking to standard fields
  const writer = trackData?.data?.[0]?.attributes?.composerName;
  info.language = trackData?.data?.[0]?.attributes?.audioLocale;
  info.item_url = trackData?.data?.[0]?.attributes?.url;

  // Custom playback flag not strictly in interface
  // info.is_playable = trackData?.data?.[0]?.attributes?.playParams ? true : false;

  info.disc_number = trackData?.data?.[0]?.attributes?.discNumber;
  info.explicit = trackData?.data?.[0]?.attributes?.contentRating === 'explicit';
  info.artists = artists.join('; ');
  info.album_artists = artists[0];

  if (albumData && albumData.data && albumData.data.length > 0) {
    const albumAttr = albumData.data[0].attributes || {};
    info.copyright = albumAttr.copyright;
    info.upc = albumAttr.upc;
    info.label = albumAttr.recordLabel;
    info.total_tracks = albumAttr.trackCount;

    let albumType = 'album';
    if (albumAttr.isSingle) albumType = 'single';
    if (albumAttr.isCompilation) albumType = 'compilation';
    info.album_type = albumType;

    let trackNumber = null;
    const albumTracks = albumData.data[0].relationships?.tracks?.data || [];
    for (let i = 0; i < albumTracks.length; i++) {
      if (albumTracks[i].id === String(itemId)) {
        trackNumber = i + 1;
        break;
      }
    }
    if (!trackNumber) trackNumber = trackData?.data?.[0]?.attributes?.trackNumber;
    info.track_number = trackNumber;

    if (albumTracks.length > 0) {
      info.total_discs = albumTracks[albumTracks.length - 1].attributes?.discNumber;
    }
  }

  return info;
}

export async function apple_music_get_lyrics(account: Account | undefined, itemId: string, itemType: string, metadata: any, filepath: string): Promise<any> {
  const headers = getHeaders(account);
  const itua = account?.login?.itua || 'us';

  const params = { include: 'lyrics' };
  const trackData = await makeCall(`${BASE_URL}/catalog/${itua}/songs/${itemId}`, { params, headers });

  const timeSynced = trackData?.data?.[0]?.attributes?.hasTimeSyncedLyrics;
  if (config.get('only_download_synced_lyrics') && !timeSynced) return false;

  const lyricsData = trackData?.data?.[0]?.relationships?.lyrics?.data || [];
  console.log('Lyrics data length:', lyricsData.length);
  if (lyricsData.length > 0) {
    const ttmlData = lyricsData[0].attributes?.ttml;
    if (!ttmlData) return false;

    const lyricsList: string[] = [];

    if (!config.get('only_download_plain_lyrics')) {
      if (config.get('embed_branding')) lyricsList.push('[re:OnTheSpot]');

      for (const key of Object.keys(metadata)) {
        const value = metadata[key];
        if (['title', 'track_title', 'tracktitle'].includes(key) && config.get('embed_name')) {
          lyricsList.push(`[ti:${value}]`);
        } else if (key === 'artists' && config.get('embed_artist')) {
          lyricsList.push(`[ar:${value}]`);
        } else if (['album_name', 'album'].includes(key) && config.get('embed_album')) {
          lyricsList.push(`[al:${value}]`);
        } else if (['writers'].includes(key) && config.get('embed_writers')) {
          lyricsList.push(`[au:${value}]`);
        }
      }

      if (config.get('embed_length')) {
        const lMs = parseInt(metadata.length || '0', 10);
        const minutes = Math.floor(lMs / 1000 / 60);
        const seconds = Math.round((lMs / 1000) % 60);
        const digit = minutes < 10 ? '0' : '';
        lyricsList.push(`[length:${digit}${minutes}:${seconds < 10 ? '0' + seconds : seconds}]\n`);
      }
    }

    const defaultLength = lyricsList.length;

    // Simple Regex parser for TTML <p> tags
    const pRegex = /<p[^>]*begin="([^"]*)"[^>]*>([^<]*)<\/p>/g;
    let match;
    const cleanTtml = ttmlData.replace(/`/g, '');

    while ((match = pRegex.exec(cleanTtml)) !== null) {
      const beginTime = match[1];
      let lyric = match[2];

      if (lyric) {
        if (timeSynced) {
          let minutes = 0;
          let secondsPart = beginTime;

          if (beginTime.includes(':')) {
            const timeParts = beginTime.split(':');
            if (timeParts.length === 3) {
              minutes = parseInt(timeParts[1]) + parseInt(timeParts[0]) * 60;
              secondsPart = timeParts[2];
            } else if (timeParts.length === 2) {
              minutes = parseInt(timeParts[0]);
              secondsPart = timeParts[1];
            }
          }

          let seconds = '0';
          let milliseconds = '00';
          if (secondsPart?.includes('.')) {
            const split = secondsPart.split('.');
            seconds = split[0];
            milliseconds = split[1].replace('s', '').substring(0, 2);
          } else {
            seconds = secondsPart;
          }

          const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds.padEnd(2, '0')}`;
          if (!config.get('only_download_plain_lyrics')) {
            lyric = `[${formattedTime}] ${lyric}`;
          }
        }
        lyricsList.push(lyric);
      }
    }

    const mergedLyrics = lyricsList.join('\n');
    if (lyricsList.length <= defaultLength) return false;

    if (config.get('save_lrc_file')) {
      fs.writeFileSync(`${filepath}.lrc`, mergedLyrics, 'utf-8');
    }
    if (config.get('embed_lyrics')) {
      return { lyrics: mergedLyrics };
    }
    return false;
  }
  return false;
}

export async function apple_music_get_webplayback_info(account: Account | undefined, itemId: string): Promise<any> {
  const headers = getHeaders(account);

  const response = await makeCall('https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/webPlayback', {
    method: 'POST',
    headers,
    body: { salableAdamId: itemId },
  });

  return response?.songList?.[0] || null;
}

export async function apple_music_get_album_track_ids(account: Account | undefined, albumId: string): Promise<string[]> {
  const headers = getHeaders(account);
  const itua = account?.login?.itua || 'us';

  const albumData = await makeCall(`${BASE_URL}/catalog/${itua}/albums/${albumId}`, { headers });
  const itemIds: string[] = [];

  const tracks = albumData?.data?.[0]?.relationships?.tracks?.data || [];
  for (const track of tracks) {
    if (track.type === 'songs') {
      itemIds.push(track.id);
    }
  }
  return itemIds;
}

export async function apple_music_get_artist_album_ids(account: Account | undefined, artistId: string): Promise<string[]> {
  const headers = getHeaders(account);
  const itua = account?.login?.itua || 'us';

  const params = {
    include: 'albums',
    views: 'full-albums,singles,live-albums',
  };

  const albumData = await makeCall(`${BASE_URL}/catalog/${itua}/artists/${artistId}`, { params, headers });
  const itemIds: string[] = [];

  const albums = albumData?.data?.[0]?.relationships?.albums?.data || [];
  for (const album of albums) {
    itemIds.push(album.id);
  }
  return itemIds;
}

export async function apple_music_get_playlist_data(account: Account | undefined, playlistId: string): Promise<[string, string, string[]]> {
  const headers = getHeaders(account);
  const itua = account?.login?.itua || 'us';

  const playlistData = await makeCall(`${BASE_URL}/catalog/${itua}/playlists/${playlistId}`, { headers, skipCache: true });
  const playlistName = playlistData?.data?.[0]?.attributes?.name || '';
  const playlistBy = playlistData?.data?.[0]?.attributes?.curatorName || '';

  const trackIds: string[] = [];
  let offset = 0;

  while (true) {
    const url = `${BASE_URL}/catalog/${itua}/playlists/${playlistId}/tracks?offset=${offset}`;
    const trackData = await makeCall(url, { headers, skipCache: true });

    if (trackData && trackData.data) {
      for (const track of trackData.data) {
        trackIds.push(track.id);
      }
    }

    if (trackData && trackData.next) {
      offset += 100;
    } else {
      break;
    }
  }

  return [playlistName, playlistBy, trackIds];
}

function buildPsshBox(keyId: Buffer): Buffer {
  const systemId = Buffer.from('edef8ba979d64acea3c827dcd51d21ed', 'hex');
  // Protocol buffer layout for video_widevine.WidevinePsshData
  // field 1 (algorithm) = 1 (AESCTR) -> 08 01
  // field 2 (key_ids) = 16 bytes -> 12 10 <key_id>
  const psshData = Buffer.concat([Buffer.from('08011210', 'hex'), keyId]);
  const size = 32 + psshData.length;
  const box = Buffer.alloc(size);
  box.writeUInt32BE(size, 0);
  box.write('pssh', 4);
  box.writeUInt32BE(0, 8); // version 0, flags 0
  systemId.copy(box, 12);
  box.writeUInt32BE(psshData.length, 28);
  psshData.copy(box, 32);
  return box;
}

export async function apple_music_get_decryption_key(account: Account | undefined, streamUrl: string, itemId: string): Promise<string | null> {
  // Fetch m3u8 playlist
  const m3u8Res = await fetch(streamUrl);
  const m3u8Text = await m3u8Res.text();

  // Extract the PSSH base64 from the first EXT-X-KEY tag
  const uriMatch = m3u8Text.match(/#EXT-X-KEY:.*?URI="(data:.*?;base64,[^"]+)"/);
  if (!uriMatch) {
    console.error('Could not find PSSH URI in m3u8');
    return null;
  }

  const psshB64Raw = uriMatch[1];
  const keyIdB64 = psshB64Raw.split(',')[1];
  const keyId = Buffer.from(keyIdB64, 'base64');

  const psshBox = buildPsshBox(keyId);

  // Initialize Widevine client
  const wvd = Buffer.from(WVN_KEY_B64, 'base64');
  const device = Widevine.initWVD(wvd);
  const session = device.createSession(psshBox, LicenseType.STREAMING);

  // Generate License Challenge
  const challenge = session.generateChallenge();

  const headers = getHeaders(account);
  const json = {
    challenge: challenge.toString('base64'),
    'key-system': 'com.widevine.alpha',
    uri: psshB64Raw,
    adamId: itemId,
    isLibrary: false,
    'user-initiated': true,
  };

  const licenseData = await makeCall(WVN_LICENSE_URL, {
    method: 'POST',
    headers,
    body: json,
    skipCache: true,
  });

  if (!licenseData || !licenseData.license) {
    console.error('Failed to acquire Widevine license');
    return null;
  }

  const wvnLicense = Buffer.from(licenseData.license, 'base64');
  const keys = session.parseLicense(wvnLicense);

  for (const key of keys) {
    if (key && key.key) {
      // In a real scenario we'd return the CONTENT key, assuming the first one or looping.
      return key.key; // Returns the hex string of the decryption key
    }
  }

  return null;
}
