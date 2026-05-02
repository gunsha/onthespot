import { config } from '../../config/index';
import { accountPool } from '../../accounts/index';
import { extractInfo } from '../../utils/ytdlp';
import { ItemMetadata } from '../../types/track';
import { Account } from '../../types/account';
import { $ } from 'bun';

export function generic_login_user(_account?: Account): boolean {
  accountPool.push({
    uuid: 'yt-dlp',
    login: { username: 'yt-dlp' },
    service: 'generic',
    active: true,
  });
  return true;
}

export function generic_add_account(): void {
  const cfgCopy = [...config.get<Account[]>('accounts', [])];
  const newUser: Account = {
    uuid: 'yt-dlp',
    service: 'generic',
    active: true,
  };
  cfgCopy.push(newUser);
  config.set('accounts', cfgCopy);
  config.save();
}

export async function generic_get_track_metadata(_account: Account | undefined, url: string): Promise<ItemMetadata | boolean> {
  const infoDict = await extractInfo(url, true);

  if (infoDict.entries && infoDict.entries.length > 1) {
    // In Python this would call parse_url. We will just log for now as parse_item is likely not migrated yet.
    console.log('Multiple entries found, parse_url should be called for each:');
    for (const entry of infoDict.entries) {
      console.log(entry.webpage_url || entry.url);
    }
    return false;
  }

  const info: ItemMetadata = {};
  info.title = infoDict.title;
  info.artists = infoDict.extractor;
  info.image_url = infoDict.thumbnail;
  info.item_url = url;

  return info;
}

export async function generic_list_extractors(): Promise<string[]> {
  try {
    const proc = Bun.spawn(['yt-dlp', '--list-extractors'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    
    const text = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
       console.error('Failed to list extractors');
       return [];
    }
    
    const lines = text.trim().split('\n');
    const extractorList: string[] = [];
    
    for (const line of lines) {
       const ieName = line.trim();
       if (ieName && !ieName.includes(':')) {
           extractorList.push(ieName);
       }
    }
    return extractorList;
  } catch (err) {
    console.error('Error fetching extractors', err);
    return [];
  }
}
