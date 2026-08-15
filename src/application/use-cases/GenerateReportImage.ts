import { RefObject } from 'react';
import { View } from 'react-native';
import { ImageService } from '../../domain/ports/ImageService';
import { ShareService } from '../../domain/ports/ShareService';

export class GenerateReportImageUseCase {
  constructor(
    private readonly imageService: ImageService,
    private readonly shareService: ShareService
  ) {}

  async execute(viewRef: RefObject<View | null>): Promise<string> {
    const imageUri = await this.imageService.captureView(viewRef);
    await this.shareService.shareFile(imageUri);
    return imageUri;
  }
}
