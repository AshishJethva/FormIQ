// src/providers/DragProvider.tsx
'use client';

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CustomDragLayer from '@/components/form-builder/CustomDragLayer';

interface DragProviderProps {
  children: React.ReactNode;
}

export default function DragProvider({ children }: DragProviderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
      <CustomDragLayer />
    </DndProvider>
  );
}
