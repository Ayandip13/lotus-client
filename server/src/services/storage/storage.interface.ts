export interface StorageUploadResult {
  url: string;
  publicId: string;
  fileSize: number;
  mimeType: string;
  originalName?: string;
}

export interface StorageFilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface IStorageService {
  /**
   * Uploads a file to the active storage provider
   */
  uploadFile(file: StorageFilePayload, folder?: string): Promise<StorageUploadResult>;

  /**
   * Deletes a file by its public identifier
   */
  deleteFile(publicId: string): Promise<boolean>;

  /**
   * Generates or retrieves a secure accessible URL for a given publicId
   */
  getFileUrl(publicId: string): string;
}
