import { config } from '../config/index';

export function convListFormat(items: string[]): string {
  if (!items || items.length === 0) {
    return '';
  }
  const separator = config.get<string>('metadata_separator') || '; ';
  return items.join(separator);
}
