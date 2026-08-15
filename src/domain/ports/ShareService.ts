export interface ShareService {
  shareFile(fileUri: string): Promise<void>;
}
