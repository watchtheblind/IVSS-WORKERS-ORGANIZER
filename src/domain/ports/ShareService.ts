export interface ShareOptions {
  dialogTitle?: string;
}

export interface ShareService {
  shareFile(fileUri: string, options?: ShareOptions): Promise<void>;
}