import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function useFormId(): string | null {
  const params = useParams();
  const pathname = usePathname();

  const formId = useMemo(() => {
    if (params?.formId && typeof params.formId === 'string') {
      return params.formId;
    }

    const pathSegments = pathname.split('/').filter(Boolean);

    const buildIndex = pathSegments.indexOf('build');
    if (buildIndex > 0) {
      const formIdCandidate =
        pathSegments[buildIndex + 1] || pathSegments[buildIndex - 1];
      if (formIdCandidate && formIdCandidate !== 'build') {
        return formIdCandidate;
      }
    }

    const formsIndex = pathSegments.indexOf('forms');
    if (formsIndex >= 0 && pathSegments[formsIndex + 1]) {
      return pathSegments[formsIndex + 1];
    }

    for (const segment of pathSegments) {
      if (/^[a-f\d]{24}$/i.test(segment)) {
        return segment;
      }
    }

    return null;
  }, [params, pathname]);

  return formId;
}
