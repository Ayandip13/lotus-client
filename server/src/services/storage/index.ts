import { IStorageService } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { CloudinaryStorageService } from './cloudinary.storage';
import { env } from '../../config/env';

export * from './storage.interface';
export * from './local.storage';
export * from './cloudinary.storage';

const createStorageService = (): IStorageService => {
  if (
    env.STORAGE_PROVIDER === 'cloudinary' &&
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  ) {
    return new CloudinaryStorageService();
  }

  return new LocalStorageService();
};

export const storageService = createStorageService();
