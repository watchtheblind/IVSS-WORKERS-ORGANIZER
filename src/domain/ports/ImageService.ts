import { RefObject } from 'react';
import { View } from 'react-native';

export interface ImageService {
  captureView(viewRef: RefObject<View | null>): Promise<string>;
}
