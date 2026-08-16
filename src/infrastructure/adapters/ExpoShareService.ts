import * as Sharing from 'expo-sharing';
import { ShareService, ShareOptions } from '../../domain/ports/ShareService';

export class ExpoShareService implements ShareService {
  async shareFile(fileUri: string, options?: ShareOptions): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device.');
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: 'image/png',
      dialogTitle: options?.dialogTitle || 'Compartir Planificación',
    });
  }
}