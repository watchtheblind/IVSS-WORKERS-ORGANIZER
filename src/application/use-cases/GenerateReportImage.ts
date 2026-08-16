import { RefObject } from 'react';
import { View } from 'react-native';
import { ImageService, CaptureOptions } from '../../domain/ports/ImageService';
import { ShareService, ShareOptions } from '../../domain/ports/ShareService';

export interface GenerateReportOptions extends CaptureOptions, ShareOptions {}

export class GenerateReportImageUseCase {
  constructor(
    private readonly imageService: ImageService,
    private readonly shareService: ShareService
  ) {}

  async execute(
    viewRef: RefObject<View | null>,
    options?: GenerateReportOptions
  ): Promise<string> {
    const imageUri = await this.imageService.captureView(viewRef, {
      fileName: options?.fileName,
    });
    await this.shareService.shareFile(imageUri, {
      dialogTitle: options?.dialogTitle,
    });
    return imageUri;
  }
}