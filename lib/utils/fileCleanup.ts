/**
 * File cleanup utility to prevent disk space exhaustion
 * Critical for serverless environments with limited storage
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const FILE_RETENTION_HOURS = parseInt(process.env.FILE_RETENTION_HOURS || '24');
const UPLOAD_DIR = process.env.UPLOAD_TMP_DIR || '/tmp/uploads';
const EXPORT_DIR = path.join(process.cwd(), 'tmp', 'exports');

/**
 * Cleans up files older than retention period
 */
export async function cleanupOldFiles(): Promise<void> {
  const now = Date.now();
  const maxAge = FILE_RETENTION_HOURS * 60 * 60 * 1000;
  
  const directories = [UPLOAD_DIR, EXPORT_DIR];
  let deletedCount = 0;

  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        continue;
      }

      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        
        try {
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtimeMs;

          if (fileAge > maxAge) {
            fs.unlinkSync(filePath);
            deletedCount++;
            logger.debug('Deleted old file', { filePath, ageHours: fileAge / (60 * 60 * 1000) });
          }
        } catch (error) {
          logger.warn('Failed to process file during cleanup', { filePath, error });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup directory', error as Error, { dir });
    }
  }

  if (deletedCount > 0) {
    logger.info('File cleanup completed', { deletedCount });
  }
}

/**
 * Ensures temporary directories exist
 */
export function ensureTempDirectories(): void {
  const directories = [UPLOAD_DIR, EXPORT_DIR];

  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created temporary directory', { dir });
      }
    } catch (error) {
      logger.error('Failed to create directory', error as Error, { dir });
    }
  }
}

/**
 * Deletes a specific file safely
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Deleted file', { filePath });
      return true;
    }
    return false;
  } catch (error) {
    logger.warn('Failed to delete file', { filePath, error });
    return false;
  }
}

/**
 * Gets directory size in bytes
 */
export function getDirectorySize(dirPath: string): number {
  let totalSize = 0;

  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    logger.error('Failed to calculate directory size', error as Error, { dirPath });
  }

  return totalSize;
}

/**
 * Checks if disk space is available
 */
export function hasAvailableSpace(requiredBytes: number): boolean {
  try {
    const uploadDirSize = getDirectorySize(UPLOAD_DIR);
    const exportDirSize = getDirectorySize(EXPORT_DIR);
    const totalUsed = uploadDirSize + exportDirSize;
    
    // Netlify has 2GB max for /tmp
    const maxStorage = 2 * 1024 * 1024 * 1024; // 2GB
    const availableSpace = maxStorage - totalUsed;

    return availableSpace > requiredBytes;
  } catch (error) {
    logger.error('Failed to check available space', error as Error);
    return true; // Fail open to not block uploads
  }
}
