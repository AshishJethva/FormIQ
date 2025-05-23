// hooks/useFormData.ts
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchForms,
  fetchLabels,
  selectFormsLoading,
  selectLabelsLoading,
} from '@/redux/slices/dashboard/formsSlice';

export const useFormData = () => {
  const dispatch = useDispatch();
  const formsLoading = useSelector(selectFormsLoading);
  const labelsLoading = useSelector(selectLabelsLoading);

  // Use refs to track if data has been loaded
  const formsLoaded = useRef(false);
  const labelsLoaded = useRef(false);

  useEffect(() => {
    // Only load forms once
    if (!formsLoaded.current && !formsLoading) {
      dispatch(fetchForms({}) as any);
      formsLoaded.current = true;
    }
  }, [dispatch, formsLoading]);

  useEffect(() => {
    // Only load labels once
    if (!labelsLoaded.current && !labelsLoading) {
      dispatch(fetchLabels() as any);
      labelsLoaded.current = true;
    }
  }, [dispatch, labelsLoading]);
};
