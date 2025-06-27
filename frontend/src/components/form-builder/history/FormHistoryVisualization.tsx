// src/components/form-builder/history/FormHistoryVisualization.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  Clock,
  Wand2,
  RotateCcw,
  RotateCw,
  Eye,
  Trash2,
  GitBranch,
  Target,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  AIFormHistoryService,
  FormSnapshot,
} from '@/services/aiFormHistoryService';
import { toast } from 'sonner';

interface FormHistoryVisualizationProps {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreSnapshot?: (snapshot: FormSnapshot) => void;
  onUndoToSnapshot?: (snapshotId: string) => void;
  onClearHistory?: () => void;
}

export default function FormHistoryVisualization({
  formId,
  isOpen,
  onClose,
  onRestoreSnapshot,
  onUndoToSnapshot,
  onClearHistory,
}: FormHistoryVisualizationProps) {
  const [snapshots, setSnapshots] = useState<FormSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredSnapshot, setHoveredSnapshot] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && formId) {
      loadSnapshots();
    }
  }, [isOpen, formId]);

  const loadSnapshots = () => {
    const historyState = AIFormHistoryService.getHistoryState(formId);
    setSnapshots(historyState.snapshots);
    setCurrentIndex(historyState.currentIndex);
  };

  const handleRestoreToSnapshot = (snapshot: FormSnapshot) => {
    if (onRestoreSnapshot) {
      onRestoreSnapshot(snapshot);
      toast.success('Form restored to selected snapshot');
      onClose();
    }
  };

  const handleUndoToSnapshot = (snapshotId: string) => {
    if (onUndoToSnapshot) {
      onUndoToSnapshot(snapshotId);
      loadSnapshots(); // Refresh the list
    }
  };

  const handleClearHistory = () => {
    if (onClearHistory) {
      onClearHistory();
      AIFormHistoryService.clearHistory(formId);
      setSnapshots([]);
      toast.success('Form history cleared');
    }
  };

  const getSnapshotIcon = (changeType: FormSnapshot['changeType']) => {
    switch (changeType) {
      case 'ai_update':
        return <Wand2 className='w-4 h-4 text-purple-500' />;
      case 'manual_edit':
        return <History className='w-4 h-4 text-blue-500' />;
      case 'initial_state':
        return <Target className='w-4 h-4 text-green-500' />;
      default:
        return <Clock className='w-4 h-4 text-gray-500' />;
    }
  };

  const getSnapshotColor = (
    changeType: FormSnapshot['changeType'],
    isCurrent: boolean
  ) => {
    if (isCurrent) return 'border-blue-500 bg-blue-50';

    switch (changeType) {
      case 'ai_update':
        return 'border-purple-200 bg-purple-50';
      case 'manual_edit':
        return 'border-blue-200 bg-blue-50';
      case 'initial_state':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className='bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden'
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg'>
                <GitBranch className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Form History Timeline
                </h2>
                <p className='text-sm text-gray-600'>
                  {snapshots.length} snapshots • Current: {currentIndex + 1}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {snapshots.length > 1 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleClearHistory}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Clear History
                </Button>
              )}
              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='flex flex-col h-full max-h-[70vh]'>
          {snapshots.length === 0 ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <History className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No History Available
                </h3>
                <p className='text-gray-600 text-sm'>
                  Start making changes to see form history here.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className='flex-1 px-6'>
              <div className='py-4'>
                <div className='relative'>
                  {/* Timeline line */}
                  <div className='absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200'></div>

                  {/* Snapshots */}
                  <div className='space-y-4'>
                    {snapshots.map((snapshot, index) => {
                      const isCurrent = index === currentIndex;
                      const isSelected = selectedSnapshot === snapshot.id;
                      const isHovered = hoveredSnapshot === snapshot.id;

                      return (
                        <motion.div
                          key={snapshot.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className='relative'
                        >
                          {/* Timeline node */}
                          <div
                            className={`absolute left-6 w-4 h-4 rounded-full border-2 ${
                              isCurrent
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {isCurrent && (
                              <div className='absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75'></div>
                            )}
                          </div>

                          {/* Snapshot card */}
                          <Card
                            className={`ml-16 cursor-pointer transition-all duration-200 ${getSnapshotColor(
                              snapshot.changeType,
                              isCurrent
                            )} ${
                              isHovered || isSelected
                                ? 'shadow-md scale-105 transform'
                                : 'shadow-sm'
                            }`}
                            onMouseEnter={() => setHoveredSnapshot(snapshot.id)}
                            onMouseLeave={() => setHoveredSnapshot(null)}
                            onClick={() =>
                              setSelectedSnapshot(
                                isSelected ? null : snapshot.id
                              )
                            }
                          >
                            <CardContent className='p-4'>
                              <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2 mb-2'>
                                    {getSnapshotIcon(snapshot.changeType)}
                                    <span className='font-medium text-gray-900'>
                                      {snapshot.updateSummary || 'Form updated'}
                                    </span>
                                    {isCurrent && (
                                      <Badge
                                        variant='secondary'
                                        className='text-xs'
                                      >
                                        Current
                                      </Badge>
                                    )}
                                  </div>

                                  <div className='text-sm text-gray-600 mb-2'>
                                    {formatDistanceToNow(snapshot.timestamp, {
                                      addSuffix: true,
                                    })}
                                  </div>

                                  {snapshot.updatePrompt && (
                                    <div className='text-xs text-gray-500 italic bg-white/50 rounded p-2'>
                                      "{snapshot.updatePrompt}"
                                    </div>
                                  )}
                                </div>

                                <div className='flex items-center gap-1 ml-4'>
                                  {!isCurrent && (
                                    <>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleRestoreToSnapshot(snapshot);
                                        }}
                                        className='text-blue-600 hover:text-blue-700'
                                        title='Restore to this snapshot'
                                      >
                                        <RotateCcw className='w-4 h-4' />
                                      </Button>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={e => {
                                          e.stopPropagation();
                                          // Preview functionality could be added here
                                        }}
                                        className='text-gray-600 hover:text-gray-700'
                                        title='Preview this snapshot'
                                      >
                                        <Eye className='w-4 h-4' />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Expanded details */}
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className='overflow-hidden mt-3 pt-3 border-t border-gray-200'
                                  >
                                    <div className='grid grid-cols-2 gap-4 text-xs'>
                                      <div>
                                        <span className='font-medium text-gray-700'>
                                          Change Type:
                                        </span>
                                        <p className='text-gray-600 capitalize'>
                                          {snapshot.changeType.replace(
                                            '_',
                                            ' '
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <span className='font-medium text-gray-700'>
                                          Timestamp:
                                        </span>
                                        <p className='text-gray-600'>
                                          {snapshot.timestamp.toLocaleString()}
                                        </p>
                                      </div>
                                      {snapshot.updatePrompt && (
                                        <div className='col-span-2'>
                                          <span className='font-medium text-gray-700'>
                                            Original Prompt:
                                          </span>
                                          <p className='text-gray-600 mt-1 p-2 bg-gray-100 rounded'>
                                            {snapshot.updatePrompt}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-600'>
              Use the timeline to navigate through your form's history
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-4 text-xs text-gray-500'>
                <div className='flex items-center gap-1'>
                  <Wand2 className='w-3 h-3 text-purple-500' />
                  <span>AI Update</span>
                </div>
                <div className='flex items-center gap-1'>
                  <History className='w-3 h-3 text-blue-500' />
                  <span>Manual Edit</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Target className='w-3 h-3 text-green-500' />
                  <span>Initial State</span>
                </div>
              </div>
              <Button onClick={onClose} variant='outline'>
                Close
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
