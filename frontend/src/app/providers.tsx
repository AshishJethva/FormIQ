'use client';

import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/redux/store';

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <ReduxProvider store={store}>{children}</ReduxProvider>;
}
