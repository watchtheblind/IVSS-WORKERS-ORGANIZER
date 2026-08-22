import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleSheet, StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';

interface LogoImageProps {
  uri: string;
  style: StyleProp<ImageStyle>;
  onError?: (message: string) => void;
}

export function isSvgUri(uri: string): boolean {
  return /\.svg$/i.test(uri.split('?')[0] || '');
}

/**
 * Renders a logo from a local file URI. Supports both raster images
 * (PNG/JPG/WEBP) and SVG files. SVGs are read as raw XML and rendered
 * with react-native-svg so they also work inside view-shot captures.
 */
export default function LogoImage({ uri, style, onError }: LogoImageProps) {
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const flat = (StyleSheet.flatten(style) || {}) as ImageStyle;
  const width = typeof flat.width === 'number' ? flat.width : '100%';
  const height = typeof flat.height === 'number' ? flat.height : '100%';

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (!isSvgUri(uri)) {
      setSvgXml(null);
      return;
    }

    FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    })
      .then((content) => {
        if (cancelled) return;
        if (!/<svg[\s>]/i.test(content)) {
          setFailed(true);
          onError?.(
            'El archivo tiene extensión .svg pero no contiene un SVG válido.'
          );
          return;
        }
        setSvgXml(content);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('LogoImage: could not read SVG file:', error);
        setFailed(true);
        onError?.('No se pudo leer el archivo SVG seleccionado.');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  if (failed) return null;

  if (isSvgUri(uri)) {
    if (!svgXml) return null;
    return (
      <SvgXml
        xml={svgXml}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={style}
      />
    );
  }

  return <Image source={{ uri }} style={style} onError={() => {
    setFailed(true);
    onError?.('No se pudo cargar la imagen del logo.');
  }} />;
}
