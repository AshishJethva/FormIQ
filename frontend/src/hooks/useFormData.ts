// // hooks/useFormData.ts
// import { useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchForms,
//   fetchLabels,
//   selectFormsLoading,
//   selectLabelsLoading,
// } from '@/redux/slices/dashboard/formsSlice';

// export const useFormData = () => {
//   const dispatch = useDispatch();
//   const formsLoading = useSelector(selectFormsLoading);
//   const labelsLoading = useSelector(selectLabelsLoading);

//   // Use refs to track if data has been loaded
//   const formsLoaded = useRef(false);
//   const labelsLoaded = useRef(false);

//   useEffect(() => {
//     // Only load forms once
//     if (!formsLoaded.current && !formsLoading) {
//       dispatch(fetchForms({}) as any);
//       formsLoaded.current = true;
//     }
//   }, [dispatch, formsLoading]);

//   useEffect(() => {
//     // Only load labels once
//     if (!labelsLoaded.current && !labelsLoading) {
//       dispatch(fetchLabels() as any);
//       labelsLoaded.current = true;
//     }
//   }, [dispatch, labelsLoading]);
// };

// src/hooks/useFormData.ts - Complete Working Version

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchForms,
  fetchLabels,
  selectFormsLoading,
  selectLabelsLoading,
  selectFormsCache,
  selectLabelsCache,
  clearAllCache,
  clearFormsCache,
  clearLabelsCache,
} from '@/redux/slices/dashboard/formsSlice';

interface UseFormDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  preloadLabels?: boolean;
  cacheStrategy?: 'default' | 'aggressive' | 'minimal';
}

interface UseFormDataReturn {
  refreshForms: (params?: any) => Promise<void>;
  refreshLabels: (search?: string) => Promise<void>;
  clearAllCache: () => void;
  clearFormsCache: (cacheKey?: string) => void;
  clearLabelsCache: () => void;
  isLoading: boolean;
  formsLoading: boolean;
  labelsLoading: boolean;
  lastRefresh: number;
  cacheStats: {
    formsEntries: number;
    labelsEntries: number;
  };
}

export const useFormData = (
  options: UseFormDataOptions = {}
): UseFormDataReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    preloadLabels = true,
    cacheStrategy = 'default',
  } = options;

  const dispatch = useDispatch();
  const formsLoading = useSelector(selectFormsLoading);
  const labelsLoading = useSelector(selectLabelsLoading);

  // Cache status selectors
  const formsCache = useSelector(selectFormsCache);
  const labelsCache = useSelector(selectLabelsCache);

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastRefreshRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const requestInProgressRef = useRef<Set<string>>(new Set());

  // Generate cache key for forms
  const getCacheKey = useCallback((params: any = {}) => {
    const {
      search = '',
      status = 'all',
      labels = [],
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    return JSON.stringify({
      search,
      status,
      labels: labels.sort(),
      sortBy,
      sortOrder,
    });
  }, []);

  // Smart forms refresh with caching
  const refreshForms = useCallback(
    async (params: any = {}) => {
      const cacheKey = getCacheKey(params);

      // Prevent duplicate requests
      if (requestInProgressRef.current.has(cacheKey)) {
        console.log(
          '⏳ Forms request already in progress, skipping:',
          cacheKey
        );
        return;
      }

      requestInProgressRef.current.add(cacheKey);

      try {
        // Determine if we should force refresh based on cache strategy
        const shouldForceRefresh =
          cacheStrategy === 'minimal'
            ? false
            : cacheStrategy === 'aggressive'
            ? true
            : params.forceRefresh || false; // default strategy

        const result = await dispatch(
          fetchForms({
            ...params,
            forceRefresh: shouldForceRefresh,
          })
        ).unwrap();

        lastRefreshRef.current = Date.now();
        console.log(
          '✅ Forms refreshed successfully:',
          cacheKey,
          result.fromCache ? '(cached)' : '(fresh)'
        );
      } catch (error) {
        console.error('❌ Failed to refresh forms:', error);
        throw error;
      } finally {
        requestInProgressRef.current.delete(cacheKey);
      }
    },
    [dispatch, cacheStrategy, getCacheKey]
  );

  // Smart labels refresh with caching
  const refreshLabels = useCallback(
    async (search?: string) => {
      const cacheKey = search || 'all';

      // Prevent duplicate requests
      if (requestInProgressRef.current.has(`labels-${cacheKey}`)) {
        console.log(
          '⏳ Labels request already in progress, skipping:',
          cacheKey
        );
        return;
      }

      requestInProgressRef.current.add(`labels-${cacheKey}`);

      try {
        const result = await dispatch(fetchLabels(search)).unwrap();
        lastRefreshRef.current = Date.now();
        console.log(
          '✅ Labels refreshed successfully:',
          cacheKey,
          result.fromCache ? '(cached)' : '(fresh)'
        );
      } catch (error) {
        console.error('❌ Failed to refresh labels:', error);
        throw error;
      } finally {
        requestInProgressRef.current.delete(`labels-${cacheKey}`);
      }
    },
    [dispatch]
  );

  // Cache management functions
  const clearAllCacheHandler = useCallback(() => {
    dispatch(clearAllCache());
    console.log('🗑️ All cache cleared via hook');
  }, [dispatch]);

  const clearFormsCacheHandler = useCallback(
    (cacheKey?: string) => {
      dispatch(clearFormsCache(cacheKey));
      console.log('🗑️ Forms cache cleared via hook:', cacheKey || 'all');
    },
    [dispatch]
  );

  const clearLabelsCacheHandler = useCallback(() => {
    dispatch(clearLabelsCache());
    console.log('🗑️ Labels cache cleared via hook');
  }, [dispatch]);

  // Initial data load with smart caching
  useEffect(() => {
    if (!mountedRef.current) return;

    const initializeData = async () => {
      try {
        console.log('🚀 Initializing form data...');

        // Load labels first if preloading is enabled
        if (preloadLabels) {
          await refreshLabels();
        }

        // Load default forms
        await refreshForms({ status: 'all' });

        console.log('✅ Form data initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize data:', error);
      }
    };

    // Add a small delay to prevent race conditions
    const initTimeout = setTimeout(initializeData, 100);

    return () => clearTimeout(initTimeout);
  }, []); // Empty dependency array for mount-only effect

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !mountedRef.current) return;

    const setupAutoRefresh = () => {
      refreshTimeoutRef.current = setTimeout(async () => {
        if (mountedRef.current) {
          try {
            // Only refresh if we're not currently loading
            if (!formsLoading && !labelsLoading) {
              console.log('🔄 Auto-refreshing data...');

              const refreshPromises = [
                refreshForms({ status: 'all', forceRefresh: true }),
              ];

              if (preloadLabels) {
                refreshPromises.push(refreshLabels());
              }

              await Promise.allSettled(refreshPromises);

              console.log('✅ Auto-refresh completed');
            } else {
              console.log('⏭️ Skipping auto-refresh (loading in progress)');
            }
          } catch (error) {
            console.error('❌ Auto-refresh failed:', error);
          }

          // Schedule next refresh
          if (mountedRef.current) {
            setupAutoRefresh();
          }
        }
      }, refreshInterval);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [
    autoRefresh,
    refreshInterval,
    refreshForms,
    refreshLabels,
    formsLoading,
    labelsLoading,
    preloadLabels,
  ]);

  // Page visibility change handler - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;
        const shouldRefresh = timeSinceLastRefresh > refreshInterval / 2;

        if (shouldRefresh && !formsLoading && !labelsLoading) {
          console.log('👁️ Page became visible, refreshing data...');
          refreshForms({ status: 'all', forceRefresh: true });
          if (preloadLabels) {
            refreshLabels();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    refreshForms,
    refreshLabels,
    refreshInterval,
    formsLoading,
    labelsLoading,
    preloadLabels,
  ]);

  // Network status change handler
  useEffect(() => {
    const handleOnline = () => {
      if (mountedRef.current && !formsLoading && !labelsLoading) {
        console.log('🌐 Network reconnected, clearing cache and refreshing...');

        // Clear cache and refresh when coming back online
        clearAllCacheHandler();

        setTimeout(() => {
          refreshForms({ status: 'all', forceRefresh: true });
          if (preloadLabels) {
            refreshLabels();
          }
        }, 1000); // Small delay to ensure connection is stable
      }
    };

    const handleOffline = () => {
      console.log('📵 Network disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [
    refreshForms,
    refreshLabels,
    formsLoading,
    labelsLoading,
    preloadLabels,
    clearAllCacheHandler,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      requestInProgressRef.current.clear();
    };
  }, []);

  // Calculate cache stats
  const cacheStats = {
    formsEntries: Object.keys(formsCache || {}).length,
    labelsEntries: Object.keys(labelsCache || {}).length,
  };

  return {
    refreshForms,
    refreshLabels,
    clearAllCache: clearAllCacheHandler,
    clearFormsCache: clearFormsCacheHandler,
    clearLabelsCache: clearLabelsCacheHandler,
    isLoading: formsLoading || labelsLoading,
    formsLoading,
    labelsLoading,
    lastRefresh: lastRefreshRef.current,
    cacheStats,
  };
};

// Hook for specific form sections with caching
export const useFormSection = (section: string, labelData?: any) => {
  const { refreshForms } = useFormData({ preloadLabels: false });

  const refreshSection = useCallback(async () => {
    console.log('🔄 Refreshing section:', section);

    switch (section) {
      case 'All':
        return refreshForms({ status: 'all' });
      case 'Favorites':
        return refreshForms({ status: 'favorites' });
      case 'Drafts':
        return refreshForms({ status: 'draft' });
      case 'Archive':
        return refreshForms({ status: 'archived' });
      case 'Trash':
        return refreshForms({ status: 'trashed' });
      default:
        if (section.startsWith('label-')) {
          const labelId = section.replace('label-', '');
          return refreshForms({ labels: [labelId] });
        }
        return refreshForms({ status: 'all' });
    }
  }, [section, refreshForms]);

  return { refreshSection };
};

// Hook for cache debugging
export const useCacheDebugger = () => {
  const formsCache = useSelector(selectFormsCache);
  const labelsCache = useSelector(selectLabelsCache);

  const logCacheStatus = useCallback(() => {
    console.group('🔍 Cache Debug Info');
    console.log('Forms cache entries:', Object.keys(formsCache || {}).length);
    console.log('Labels cache entries:', Object.keys(labelsCache || {}).length);
    console.log('Forms cache:', formsCache);
    console.log('Labels cache:', labelsCache);
    console.groupEnd();
  }, [formsCache, labelsCache]);

  const getCacheAge = useCallback(
    (type: 'forms' | 'labels', key: string) => {
      const cache = type === 'forms' ? formsCache?.[key] : labelsCache?.[key];
      if (!cache) return null;

      const age = Date.now() - cache.timestamp;
      return {
        age,
        ageMinutes: Math.floor(age / 60000),
        isStale: age > 2 * 60 * 1000, // 2 minutes
        isExpired: age > 5 * 60 * 1000, // 5 minutes
      };
    },
    [formsCache, labelsCache]
  );

  return {
    logCacheStatus,
    getCacheAge,
    formsCache,
    labelsCache,
  };
};

export default useFormData;
