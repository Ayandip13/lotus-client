import { IStorageService, StorageFilePayload, StorageUploadResult } from './storage.interface';

/**
 * LocalStorageService acts as the initial development implementation and contract baseline.
 * In Phase 4, a CloudinaryStorageService implementing the same IStorageService will be plugged in seamlessly.
 */
export class LocalStorageService implements IStorageService {
  async uploadFile(file: StorageFilePayload, folder = 'receipts'): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `${folder}/${timestamp}_${sanitizedName}`;
    const url = `/uploads/${publicId}`;

    return {
      url,
      publicId,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async deleteFile(_publicId: string): Promise<boolean> {
    return true;
  }

  getFileUrl(publicId: string): string {
    return `/uploads/${publicId}`;
  }
}
