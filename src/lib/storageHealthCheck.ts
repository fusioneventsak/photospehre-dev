import { supabase } from './supabase';
import { ImageOptimizer } from './imageOptimization';

export class StorageHealthCheck {
  static async checkStorageConfiguration(): Promise<{
    bucketExists: boolean;
    bucketIsPublic: boolean;
    transformationsAvailable: boolean;
    sampleUrlAccessible: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let bucketExists = false;
    let bucketIsPublic = false;
    let transformationsAvailable = false;
    let sampleUrlAccessible = false;

    try {
      // Check if bucket exists and is accessible
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        issues.push(`Cannot list buckets: ${bucketError.message}`);
      } else {
        const photosBucket = buckets?.find(b => b.id === 'photos');
        bucketExists = !!photosBucket;
        bucketIsPublic = photosBucket?.public ?? false;
        
        if (!bucketExists) {
          issues.push('Photos bucket does not exist');
        }
        if (!bucketIsPublic) {
          issues.push('Photos bucket is not public');
        }
      }

      // Test transformations
      transformationsAvailable = await ImageOptimizer.testTransformations();
      if (!transformationsAvailable) {
        issues.push('Image transformations not available (requires Supabase Pro plan)');
      }

      // Test a sample URL if we have photos
      const { data: photos } = await supabase
        .from('photos')
        .select('url')
        .limit(1);

      if (photos && photos.length > 0) {
        try {
          const response = await fetch(photos[0].url, { method: 'HEAD' });
          sampleUrlAccessible = response.ok;
          if (!sampleUrlAccessible) {
            issues.push('Sample photo URL is not accessible');
          }
        } catch (error) {
          issues.push(`Cannot access sample photo: ${error}`);
          sampleUrlAccessible = false;
        }
      }

    } catch (error: any) {
      issues.push(`Health check failed: ${error.message || error}`);
    }

    return {
      bucketExists,
      bucketIsPublic,
      transformationsAvailable,
      sampleUrlAccessible,
      issues
    };
  }

  static async fixCommonIssues(): Promise<string[]> {
    const fixes: string[] = [];

    try {
      // Try to create photos bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('photos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

      if (createError && !createError.message.includes('already exists')) {
        console.error('Failed to create bucket:', createError);
      } else if (!createError) {
        fixes.push('Created photos bucket');
      }

      // Check if we need to update bucket settings
      const { data: buckets } = await supabase.storage.listBuckets();
      const photosBucket = buckets?.find(b => b.id === 'photos');
      
      if (photosBucket && !photosBucket.public) {
        const { error: updateError } = await supabase.storage.updateBucket('photos', {
          public: true
        });
        
        if (!updateError) {
          fixes.push('Made photos bucket public');
        }
      }

    } catch (error: any) {
      console.error('Auto-fix failed:', error.message || error);
    }

    return fixes;
  }
}