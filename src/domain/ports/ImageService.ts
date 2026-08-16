import { RefObject } from 'react';
import { View } from 'react-native';

export interface CaptureOptions {
  fileName?: string;
}

export interface ImageService {
  captureView(viewRef: RefObject<View | null>, options?: CaptureOptions): Promise<string>;
}