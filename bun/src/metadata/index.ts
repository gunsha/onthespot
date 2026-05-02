import * as fs from 'fs';
import * as path from 'path';
import { ItemMetadata } from '../types/track';
import { config } from '../config/index';

export async function decryptAppleMusic(tempFilePath: string, decryptionKey: string): Promise<string> {
    const ffmpegPath = config.get<string>('_ffmpeg_bin_path', 'ffmpeg');
    const decryptedTempFilePath = tempFilePath + '.m4a';

    const args = [
        ffmpegPath,
        '-loglevel', 'error',
        '-y',
        '-decryption_key', decryptionKey,
        '-i', tempFilePath,
        '-c', 'copy',
        '-movflags', '+faststart',
        decryptedTempFilePath
    ];

    const proc = Bun.spawn(args, { stdout: 'ignore', stderr: 'pipe' });
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        const errorText = await new Response(proc.stderr).text();
        throw new Error(`FFmpeg decryption failed (${exitCode}): ${errorText}`);
    }

    if (fs.existsSync(tempFilePath)) {
        fs.rmSync(tempFilePath);
    }
    fs.renameSync(decryptedTempFilePath, tempFilePath);
    return tempFilePath;
}

export async function setMusicThumbnail(filePath: string, metadata: ItemMetadata): Promise<void> {
    if (!metadata.image_url) return;

    const ffmpegPath = config.get<string>('_ffmpeg_bin_path', 'ffmpeg');
    const fileExt = path.extname(filePath);
    const fileStem = path.basename(filePath, fileExt);
    const tempName = path.join(path.dirname(filePath), `~${fileStem}${fileExt}`);
    
    // Download cover
    const coverPath = path.join(path.dirname(filePath), 'cover.jpg');
    const resp = await fetch(metadata.image_url);
    const buffer = await resp.arrayBuffer();
    await Bun.write(coverPath, buffer);

    if (fs.existsSync(tempName)) fs.rmSync(tempName);
    fs.renameSync(filePath, tempName);

    const args = [
        ffmpegPath,
        '-loglevel', 'error', '-hide_banner', '-nostats',
        '-i', tempName,
        '-i', coverPath,
        '-map', '0:a',
        '-map', '1:v',
        '-c', 'copy',
        '-disposition:v:0', 'attached_pic',
        '-metadata:s:v', 'title=Cover',
        '-metadata:s:v', 'comment=Cover (front), -id3v2_version 1',
        filePath
    ];

    const proc = Bun.spawn(args, { stdout: 'ignore', stderr: 'pipe' });
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        const errorText = await new Response(proc.stderr).text();
        throw new Error(`FFmpeg thumbnail embedding failed (${exitCode}): ${errorText}`);
    }

    if (fs.existsSync(tempName)) fs.rmSync(tempName);
    if (!config.get<boolean>('save_album_cover', false) && fs.existsSync(coverPath)) {
        fs.rmSync(coverPath);
    }
}

export async function embedMetadata(filePath: string, metadata: ItemMetadata): Promise<void> {
    const ffmpegPath = config.get<string>('_ffmpeg_bin_path', 'ffmpeg');
    const fileExt = path.extname(filePath);
    const fileStem = path.basename(filePath, fileExt);
    const tempName = path.join(path.dirname(filePath), `~${fileStem}${fileExt}`);

    if (fs.existsSync(tempName)) fs.rmSync(tempName);
    fs.renameSync(filePath, tempName);

    const args = [
        ffmpegPath,
        '-loglevel', 'error', '-hide_banner', '-nostats',
        '-i', tempName,
        '-c:a', 'copy'
    ];

    if (metadata.artists) args.push('-metadata', `artist=${metadata.artists}`);
    if (metadata.album_name) args.push('-metadata', `album=${metadata.album_name}`);
    if (metadata.album_artists) args.push('-metadata', `album_artist=${metadata.album_artists}`);
    if (metadata.title) args.push('-metadata', `title=${metadata.title}`);
    if (metadata.release_year) args.push('-metadata', `date=${metadata.release_year}`);
    if (metadata.disc_number) args.push('-metadata', `disc=${metadata.disc_number}/${metadata.total_discs || 1}`);
    if (metadata.track_number) args.push('-metadata', `track=${metadata.track_number}/${metadata.total_tracks || 1}`);
    if (metadata.genre) args.push('-metadata', `genre=${metadata.genre}`);
    if (metadata.copyright) args.push('-metadata', `copyright=${metadata.copyright}`);

    args.push(filePath);

    const proc = Bun.spawn(args, { stdout: 'ignore', stderr: 'pipe' });
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        const errorText = await new Response(proc.stderr).text();
        throw new Error(`FFmpeg metadata embedding failed (${exitCode}): ${errorText}`);
    }

    if (fs.existsSync(tempName)) fs.rmSync(tempName);
}
