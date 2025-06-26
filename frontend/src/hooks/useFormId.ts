// src/hooks/useFormId.ts
import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function useFormId(): string | null {
  const params = useParams();
  const pathname = usePathname();

  const formId = useMemo(() => {
    // Try to get formId from params first
    if (params?.formId && typeof params.formId === 'string') {
      return params.formId;
    }

    // If params don't work, try to extract from pathname
    // Expected patterns: /build/[formId], /forms/[formId]/build, etc.
    const pathSegments = pathname.split('/').filter(Boolean);

    // Look for common patterns
    const buildIndex = pathSegments.indexOf('build');
    if (buildIndex > 0) {
      // Pattern: /build/[formId] or /forms/[formId]/build
      const formIdCandidate =
        pathSegments[buildIndex + 1] || pathSegments[buildIndex - 1];
      if (formIdCandidate && formIdCandidate !== 'build') {
        return formIdCandidate;
      }
    }

    // Look for forms pattern
    const formsIndex = pathSegments.indexOf('forms');
    if (formsIndex >= 0 && pathSegments[formsIndex + 1]) {
      return pathSegments[formsIndex + 1];
    }

    // Fallback: look for any MongoDB ObjectId pattern (24 hex characters)
    for (const segment of pathSegments) {
      if (/^[a-f\d]{24}$/i.test(segment)) {
        return segment;
      }
    }

    return null;
  }, [params, pathname]);

  console.log('🔍 useFormId:', {
    params,
    pathname,
    extractedFormId: formId,
    pathSegments: pathname.split('/').filter(Boolean),
  });

  return formId;
}
