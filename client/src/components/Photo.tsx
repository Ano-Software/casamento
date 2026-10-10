import { useCallback, useState, type CSSProperties } from 'react';
import type { PhotoAsset } from '../config/invite';

interface Props {
  photo: PhotoAsset;
  /** Foto da primeira cena: carregamento imediato e prioritário. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Imagem puramente decorativa (ex.: fundo desfocado duplicado). */
  decorative?: boolean;
}

/**
 * Imagem com dimensões declaradas (sem saltos de layout), lazy loading,
 * fade-in ao carregar e fallback elegante caso a foto falhe.
 */
export function Photo({ photo, priority = false, className = '', style, decorative = false }: Props) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Imagens já em cache podem concluir antes do React registrar o onLoad.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setState('loaded');
  }, []);

  if (state === 'error') {
    return (
      <div
        className={`photo-fallback ${className}`}
        style={style}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : photo.alt}
        aria-hidden={decorative || undefined}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={decorative ? '' : photo.alt}
      aria-hidden={decorative || undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
      onLoad={() => setState('loaded')}
      onError={() => setState('error')}
      className={`${className} transition-opacity duration-[1400ms] ease-out ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      style={style}
    />
  );
}
