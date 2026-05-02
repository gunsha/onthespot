import { $ } from 'bun';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config/index';

export async function extractInfo(url: string, flat: boolean = false, extraArgs: string[] = []): Promise<any> {
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(url);
  const requestKey = hasher.digest("hex");
  
  const cacheDir = path.join(config.get<string>('_cache_dir'), 'reqcache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const cacheFile = path.join(cacheDir, `${requestKey}.json`);

  if (fs.existsSync(cacheFile)) {
    const data = await Bun.file(cacheFile).text();
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn(`Failed to parse cache file ${cacheFile}, re-fetching.`);
    }
  }

  const args = [
    'yt-dlp',
    '--dump-json',
    '--quiet',
    ...extraArgs
  ];

  if (flat) {
    args.push('--flat-playlist');
  }
  
  args.push(url);

  try {
    const proc = Bun.spawn(args, {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const text = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const errorText = await new Response(proc.stderr).text();
      console.error(`yt-dlp error (${exitCode}):`, errorText);
      throw new Error(`yt-dlp failed with exit code ${exitCode}`);
    }

    const lines = text.trim().split('\n').filter(line => line.length > 0);
    
    // yt-dlp might output multiple JSON objects for playlists
    let result: any;
    if (lines.length > 1) {
       result = {
          _type: 'playlist',
          entries: lines.map(line => JSON.parse(line))
       };
    } else if (lines.length === 1) {
       result = JSON.parse(lines[0]);
    } else {
       throw new Error('yt-dlp returned no output');
    }

    await Bun.write(cacheFile, JSON.stringify(result, null, 4));
    return result;
  } catch (err) {
    console.error(`Error running yt-dlp for url: ${url}`, err);
    throw err;
  }
}
