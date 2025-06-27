// src/components/form-builder/canvas/UpdateHistoryPanel.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  Clock,
  Wand2,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { apiConfig } from '@/config/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateHistoryProps {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateEntry {
  id: string;
  prompt: string;
  summary: string;
  timestamp: string;
  model: string;
}

export default function UpdateHistoryPanel({
  formId,
  isOpen,
  onClose,
}: UpdateHistoryProps) {
  const [updates, setUpdates] = useState<UpdateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );
  const [formTitle, setFormTitle] = useState('');

  useEffect(() => {
    if (isOpen && formId) {
      fetchUpdateHistory();
    }
  }, [isOpen, formId]);

  const fetchUpdateHistory = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${apiConfig.url}/ai/update-history/${formId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUpdates(response.data.data.updates);
        setFormTitle(response.data.data.formTitle);
      }
    } catch (error: any) {
      toast.error('Failed to fetch update history');
      console.error('Error fetching update history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiConfig.url}/ai/update-history/${formId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUpdates([]);
      toast.success('Update history cleared');
    } catch {
      toast.error('Failed to clear history');
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
        className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden'
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg'>
                <History className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Update History
                </h2>
                <p className='text-sm text-gray-600'>
                  {formTitle || 'Form Updates'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchUpdateHistory}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
              </Button>
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
        <div className='flex flex-col h-full max-h-[60vh]'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-500 mx-auto mb-4' />
                <p className='text-gray-600'>Loading update history...</p>
              </div>
            </div>
          ) : updates.length === 0 ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <Wand2 className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No Updates Yet
                </h3>
                <p className='text-gray-600 text-sm'>
                  AI form updates will appear here when you make changes.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header Actions */}
              <div className='px-6 py-3 border-b border-gray-100 flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  {updates.length} update{updates.length !== 1 ? 's' : ''}
                </div>
                {updates.length > 0 && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={clearHistory}
                    className='text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='w-4 h-4 mr-2' />
                    Clear History
                  </Button>
                )}
              </div>

              {/* Updates List */}
              <ScrollArea className='flex-1 px-6'>
                <div className='space-y-4 py-4'>
                  {updates.map((update, index) => (
                    <Card key={update.id} className='border border-gray-200'>
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <Badge variant='secondary' className='text-xs'>
                                Update #{updates.length - index}
                              </Badge>
                              <div className='flex items-center gap-1 text-xs text-gray-500'>
                                <Clock className='w-3 h-3' />
                                {formatDistanceToNow(
                                  new Date(update.timestamp),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </div>
                            </div>

                            <div className='mb-2'>
                              <p className='text-sm font-medium text-gray-900 mb-1'>
                                {update.summary}
                              </p>

                              <AnimatePresence>
                                {expandedEntries.has(update.id) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className='overflow-hidden'
                                  >
                                    <div className='mt-2 p-3 bg-gray-50 rounded-md'>
                                      <p className='text-xs font-medium text-gray-700 mb-1'>
                                        Original Prompt:
                                      </p>
                                      <p className='text-xs text-gray-600 italic'>
                                        &ldquo;{update.prompt}&rdquo;
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className='flex items-center gap-2'>
                              <Badge variant='outline' className='text-xs'>
                                {update.model}
                              </Badge>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleExpanded(update.id)}
                            className='p-1 hover:bg-gray-100 rounded transition-colors ml-2'
                          >
                            {expandedEntries.has(update.id) ? (
                              <ChevronUp className='w-4 h-4 text-gray-500' />
                            ) : (
                              <ChevronDown className='w-4 h-4 text-gray-500' />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end'>
            <Button onClick={onClose} variant='outline'>
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
