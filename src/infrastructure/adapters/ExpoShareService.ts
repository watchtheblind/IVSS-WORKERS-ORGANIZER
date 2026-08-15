import * as Sharing from 'expo-sharing';
import { ShareService } from '../../domain/ports/ShareService';

export class ExpoShareService implements ShareService {
  async shareFile(fileUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device.');
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Daily Report',
    });
  }
}
