import { v2 as cloudinary } from 'cloudinary';
import { IStorageService, StorageFilePayload, StorageUploadResult } from './storage.interface';
import { env } from '../../config/env';

export class CloudinaryStorageService implements IStorageService {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadFile(file: StorageFilePayload, folder = 'lotus_caterer/receipts'): Promise<StorageUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileSize: result.bytes,
            mimeType: file.mimetype,
            originalName: file.originalname,
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch {
      return false;
    }
  }

  getFileUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }
}
