// src/providers/DragProvider.tsx
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactNode } from 'react';
import CustomDragLayer from '@/components/form-builder/CustomDragLayer';

interface DragProviderProps {
  children: ReactNode;
}

export default function DragProvider({ children }: DragProviderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
      <CustomDragLayer />
    </DndProvider>
  );
}
