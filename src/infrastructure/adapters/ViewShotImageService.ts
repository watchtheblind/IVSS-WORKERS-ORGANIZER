import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { ImageService, CaptureOptions } from '../../domain/ports/ImageService';

export class ViewShotImageService implements ImageService {
  async captureView(
    viewRef: RefObject<View | null>,
    options?: CaptureOptions
  ): Promise<string> {
    if (!viewRef.current) {
      throw new Error('View reference is not available for capture.');
    }

    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      ...(options?.fileName ? { fileName: options.fileName } : {}),
    });

    return uri;
  }
}