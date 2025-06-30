import { supabase } from './supabase';

interface OptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}

export class ImageOptimizer {
  private static cache = new Map<string, string>();
  
  static getOptimizedUrl(
    originalUrl: string, 
    options: OptimizedImageOptions = {}
  ): string {
    const {
      width = 512,
      height = 512,
      quality = 75,
      format = 'webp'
    } = options;

    // Return original URL if it's not a Supabase URL
    if (!originalUrl || !originalUrl.includes('/storage/v1/object/public/')) {
      return originalUrl;
    }

    const cacheKey = `${originalUrl}-${width}x${height}-${quality}-${format}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const urlParts = originalUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) return originalUrl;

    const [bucketName, ...pathParts] = urlParts[1].split('/');
    const filePath = pathParts.join('/');

    const optimizedUrl = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath, {
        transform: {
          width,
          height,
          resize: 'cover',
          quality,
          format
        }
      }).data.publicUrl;

    this.cache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }

  static getResponsiveUrls(originalUrl: string): {
    thumbnail: string;
    medium: string;
    large: string;
  } {
    return {
      thumbnail: this.getOptimizedUrl(originalUrl, { width: 150, height: 150, quality: 70 }),
      medium: this.getOptimizedUrl(originalUrl, { width: 400, height: 400, quality: 75 }),
      large: this.getOptimizedUrl(originalUrl, { width: 800, height: 800, quality: 80 })
    };
  }

  static clearCache(): void {
    this.cache.clear();
  }
}