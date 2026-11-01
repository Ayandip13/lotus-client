import fs from 'fs';
import path from 'path';
import { IStorageService, StorageFilePayload, StorageUploadResult } from './storage.interface';

export class LocalStorageService implements IStorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(file: StorageFilePayload, folder = 'receipts'): Promise<StorageUploadResult> {
    const targetFolder = path.join(this.uploadsDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(targetFolder, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    const publicId = `${folder}/${filename}`;
    const url = `/uploads/${folder}/${filename}`;

    return {
      url,
      publicId,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadsDir, publicId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  getFileUrl(publicId: string): string {
    return `/uploads/${publicId}`;
  }
}
