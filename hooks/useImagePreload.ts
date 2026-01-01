/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to preload images for better perceived performance on mobile
 * Preloads the next page's image in the background to reduce loading time
 */
export const useImagePreload = (imageUrls: (string | undefined)[]) => {
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      // Skip if already preloaded
      if (preloadedImagesRef.current.has(url)) return;

      const img = new Image();
      img.src = url;
      
      img.onload = () => {
        preloadedImagesRef.current.add(url);
      };
      
      img.onerror = () => {
        // Silent fail - image will be loaded normally when displayed
        console.warn(`Failed to preload image: ${url.substring(0, 50)}...`);
      };
    };

    // Preload valid image URLs
    imageUrls.forEach(url => {
      if (url && url.startsWith('data:image')) {
        preloadImage(url);
      }
    });

    // Cleanup: no need to remove preloaded images as they're cached by browser
  }, [imageUrls]);

  return preloadedImagesRef.current;
};
