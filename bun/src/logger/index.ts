import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/index';

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50,
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BACKUP_COUNT = 2;

class Logger {
  private name: string;
  private logFile: string;
  private currentLogLevel: number;

  constructor(name: string) {
    this.name = name;
    this.logFile = config.get<string>('_log_file');
    this.currentLogLevel = parseInt(process.env.LOG_LEVEL || '20', 10);
  }

  private async rotateIfNecessary() {
    const logFileBun = Bun.file(this.logFile);
    if (!(await logFileBun.exists())) return;

    if (logFileBun.size >= MAX_BYTES) {
      // Basic rotation strategy
      for (let i = BACKUP_COUNT - 1; i > 0; i--) {
        const src = `${this.logFile}.${i}`;
        const dest = `${this.logFile}.${i + 1}`;
        if (fs.existsSync(src)) {
          fs.renameSync(src, dest);
        }
      }
      fs.renameSync(this.logFile, `${this.logFile}.1`);
    }
  }

  private formatMessage(levelName: string, message: string): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    return `[${timestamp} :: ${this.name} :: ${levelName}] -> ${message}`;
  }

  private writeLog(level: number, levelName: string, message: string, ...args: any[]) {
    if (level < this.currentLogLevel) return;

    const formattedMessage = this.formatMessage(levelName, message);

    // Output to console
    if (level >= LOG_LEVELS.ERROR) {
      console.error(formattedMessage, ...args);
    } else if (level >= LOG_LEVELS.WARN) {
      console.warn(formattedMessage, ...args);
    } else if (level >= LOG_LEVELS.INFO) {
      console.info(formattedMessage, ...args);
    } else {
      console.debug(formattedMessage, ...args);
    }

    // Output to file
    try {
      this.rotateIfNecessary().then(() => {
        fs.appendFileSync(this.logFile, formattedMessage + '\n', 'utf-8');
      });
    } catch (e) {
      // Fallback if unable to write to log file
      console.error(`Failed to write to log file ${this.logFile}`, e);
    }
  }

  public debug(message: string, ...args: any[]) {
    this.writeLog(LOG_LEVELS.DEBUG, 'DEBUG', message, ...args);
  }

  public info(message: string, ...args: any[]) {
    this.writeLog(LOG_LEVELS.INFO, 'INFO', message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    this.writeLog(LOG_LEVELS.WARN, 'WARNING', message, ...args);
  }

  public error(message: string, ...args: any[]) {
    this.writeLog(LOG_LEVELS.ERROR, 'ERROR', message, ...args);
  }

  public critical(message: string, ...args: any[]) {
    this.writeLog(LOG_LEVELS.CRITICAL, 'CRITICAL', message, ...args);
  }
}

const loggers: Record<string, Logger> = {};

export function getLogger(name: string): Logger {
  if (!loggers[name]) {
    loggers[name] = new Logger(name);
  }
  return loggers[name] as Logger;
}
