import { supabase } from './supabase';

interface OptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export class ImageOptimizer {
  private static cache = new Map<string, string>();
  private static transformationSupported: boolean | null = null;
  private static failedUrls = new Set<string>();
  
  // Test if image transformations are available
  static async testTransformations(): Promise<boolean> {
    if (this.transformationSupported !== null) {
      return this.transformationSupported;
    }

    try {
      // Create a test request to see if transformations work
      const testResult = supabase.storage
        .from('photos')
        .getPublicUrl('test', {
          transform: {
            width: 100,
            height: 100,
            quality: 75
          }
        });

      // If transform parameter is included in URL, transformations are supported
      const hasTransform = testResult.data.publicUrl.includes('transform=');
      this.transformationSupported = hasTransform;
      
      console.log('Image transformations supported:', hasTransform);
      return hasTransform;
    } catch (error) {
      console.warn('Image transformations not available:', error);
      this.transformationSupported = false;
      return false;
    }
  }

  static getOptimizedUrl(
    originalUrl: string, 
    options: OptimizedImageOptions = {}
  ): string {
    // Return empty string for empty input
    if (!originalUrl || typeof originalUrl !== 'string') {
      return '';
    }

    // Return original URL if it's not a Supabase URL or previously failed
    if (!originalUrl.includes('/storage/v1/object/public/') || this.failedUrls.has(originalUrl)) {
      return originalUrl;
    }

    const {
      width = 512,
      height = 512,
      quality = 75,
      format = 'webp'
    } = options;

    const cacheKey = `${originalUrl}-${width}x${height}-${quality}-${format}`;
    
    // Return cached version if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Parse Supabase storage URL
      const urlParts = originalUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        this.failedUrls.add(originalUrl);
        return originalUrl;
      }

      const [bucketName, ...pathParts] = urlParts[1].split('/');
      const filePath = pathParts.join('/');

      // Generate optimized URL
      const result = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath, {
          transform: {
            width,
            height,
            resize: 'cover',
            quality,
            format: format === 'webp' ? 'webp' : 'jpeg'
          }
        });

      const optimizedUrl = result.data.publicUrl;
      
      // Cache the result
      this.cache.set(cacheKey, optimizedUrl);
      
      // Start async validation of the URL
      this.validateUrl(optimizedUrl, originalUrl, cacheKey);
      
      return optimizedUrl;
    } catch (error) {
      console.warn('Error generating optimized URL:', error);
      this.failedUrls.add(originalUrl);
      return originalUrl;
    }
  }

  // Asynchronously validate the URL and update cache if needed
  private static async validateUrl(optimizedUrl: string, originalUrl: string, cacheKey: string): Promise<void> {
    // Skip validation in development to avoid CORS issues
    if (import.meta.env.DEV) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(optimizedUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('Optimized URL validation failed, falling back to original:', optimizedUrl);
        this.cache.set(cacheKey, originalUrl);
        this.failedUrls.add(optimizedUrl);
      }
    } catch (error) {
      console.warn('Error validating optimized URL, using original:', error);
      this.cache.set(cacheKey, originalUrl);
      this.failedUrls.add(optimizedUrl);
    }
  }

  // Add cache busting parameter to URL
  static addCacheBust(url: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('t', Date.now().toString());
      return urlObj.toString();
    } catch (error) {
      console.warn('Invalid URL in addCacheBust:', url);
      return url;
    }
  }

  static clearCache(): void {
    this.cache.clear();
    this.failedUrls.clear();
    this.transformationSupported = null;
  }
}