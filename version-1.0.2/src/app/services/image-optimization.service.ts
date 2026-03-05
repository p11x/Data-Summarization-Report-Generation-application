import { Injectable } from '@angular/core';

/**
 * Image Optimization Service
 * 
 * Provides utilities for optimizing images in the application.
 * Angular 19+ provides built-in image optimization via ngSrc directive.
 * 
 * Usage in templates:
 * <img [ngSrc]="imageUrl" width="400" height="300" priority>
 * 
 * For external images, add the domain to angular.json -> architect -> build -> options -> assets
 */
@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  
  /**
   * Generate responsive image srcset for lazy loading
   * @param baseUrl - Base image URL
   * @param widths - Array of widths to generate srcset
   */
  generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 960, 1280, 1920]): string {
    return widths
      .map(w => `${this.getOptimizedUrl(baseUrl, w)} ${w}w`)
      .join(', ');
  }

  /**
   * Get optimized URL with width parameter
   * Supports common image CDNs (Imgix, Cloudinary, etc.)
   */
  getOptimizedUrl(url: string, width: number): string {
    if (!url) return url;
    
    // Check if URL already has query parameters
    const separator = url.includes('?') ? '&' : '?';
    
    // Add width parameter for CDN optimization
    // This works with Imgix, Cloudinary, and many other CDNs
    if (!url.includes('w=')) {
      return `${url}${separator}w=${width}&q=80&auto=format`;
    }
    
    return url;
  }

  /**
   * Generate blur placeholder URL
   * For use with blur-up loading technique
   */
  getBlurPlaceholder(url: string): string {
    if (!url) return url;
    return this.getOptimizedUrl(url, 20);
  }

  /**
   * Check if URL is a valid image
   */
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)(\?.*)?$/i;
    return imageExtensions.test(url);
  }

  /**
   * Get image format from URL
   */
  getImageFormat(url: string): string {
    if (!url) return 'unknown';
    const match = url.match(/\.([^.]+)(\?.*)?$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Preload critical images
   * Use for above-the-fold images
   */
  preloadImage(url: string): void {
    if (typeof window !== 'undefined' && url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    }
  }

  /**
   * Lazy load images using Intersection Observer
   * Alternative to Angular's ngSrc for browsers that need more control
   */
  setupLazyLoading(): void {
    if (typeof window === 'undefined') return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src].lazy').forEach(img => {
      imageObserver.observe(img);
    });
  }
}
