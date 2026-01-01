/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retry logic with exponential backoff for failed network requests
 * Useful for handling transient network errors on mobile devices
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry
  } = options;

  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for structured error properties when available (more reliable than string matching)
      const structuredError = error as { status?: number; code?: string; message?: string } | undefined;
      const statusCode = typeof structuredError?.status === 'number' ? structuredError.status : undefined;
      const errorCode = typeof structuredError?.code === 'string' ? structuredError.code : undefined;
      const errorMessage = typeof structuredError?.message === 'string' ? structuredError.message : lastError.message;
      
      // Don't retry on these errors - they are permanent failures
      const isPermanentError = 
        errorCode === 'PERMISSION_DENIED' ||
        errorCode === 'UNAUTHENTICATED' ||
        errorCode === 'API_KEY_INVALID' ||
        statusCode === 403 ||
        statusCode === 401 ||
        statusCode === 404 ||
        errorMessage.includes('API_KEY_INVALID') ||
        errorMessage.includes('Requested entity was not found') ||
        // Fallback to string matching only if structured properties aren't available
        (!statusCode && !errorCode && (
          errorMessage.includes('403') ||
          errorMessage.includes('PERMISSION_DENIED')
        ));
      
      if (isPermanentError) {
        throw lastError;
      }

      // Last attempt - throw error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Debounce function for rate-limiting repeated calls
 * Useful for search inputs and frequent user interactions
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 * Useful for scroll handlers and resize events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
