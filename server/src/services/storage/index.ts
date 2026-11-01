import { IStorageService } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { env } from '../../config/env';

export * from './storage.interface';
export * from './local.storage';

/**
 * Storage service factory ensuring provider agnostic file handling throughout the application.
 */
const createStorageService = (): IStorageService => {
  if (env.STORAGE_PROVIDER === 'cloudinary') {
    // Note: Cloudinary provider implementation is scheduled for the Attachments phase.
    console.log('ℹ️ Storage provider: Cloudinary (configured for upcoming phase)');
    return new LocalStorageService();
  }

  return new LocalStorageService();
};

export const storageService = createStorageService();
