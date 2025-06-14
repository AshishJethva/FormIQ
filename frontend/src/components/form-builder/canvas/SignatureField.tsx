// src/components/form-builder/canvas/SignatureField.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Pen, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignatureFieldProps {
  fieldId: string;
  label: string;
  required?: boolean;
  helpText?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  readOnly?: boolean;
}

export default function SignatureField({
  label,
  required = false,
  helpText,
  value,
  onChange,
  error,
  readOnly = false,
}: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [justCleared, setJustCleared] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);

  // Responsive canvas setup
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const containerWidth = container.offsetWidth;
      const isMobile = window.innerWidth < 640;
      const canvasHeight = isMobile ? 160 : 128; // Taller on mobile for better UX

      canvas.width = containerWidth;
      canvas.height = canvasHeight;

      setCanvasSize({ width: containerWidth, height: canvasHeight });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set drawing styles with responsive line width
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = isMobile ? 3 : 2; // Thicker on mobile
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Load existing signature if any
      if (value && value !== 'Signature added') {
        try {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasSignature(true);
            setSignatureComplete(true);
          };
          img.src = value;
        } catch (error) {
          console.error('Error loading signature:', error);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [value]);

  // Touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];
      const position = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };

      setIsDrawing(true);
      setJustCleared(false);
      setLastPosition(position);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];
      const currentPosition = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };

      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      ctx.lineTo(currentPosition.x, currentPosition.y);
      ctx.stroke();

      setLastPosition(currentPosition);
      setHasSignature(true);
    };

    const handleTouchEnd = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      setSignatureComplete(true);
      saveSignature();
    };

    // Add touch event listeners with passive: false
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, lastPosition, readOnly]);

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    setIsDrawing(true);
    setJustCleared(false);
    const position = getCanvasPosition(e);
    setLastPosition(position);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPosition = getCanvasPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.stroke();

    setLastPosition(currentPosition);
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setSignatureComplete(true);
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataURL = canvas.toDataURL('image/png');
      onChange(dataURL);
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureComplete(false);
    setJustCleared(true);
    onChange('');

    // Reset the cleared state after animation
    setTimeout(() => setJustCleared(false), 1000);
  };

  return (
    <motion.div
      className='mb-6 px-2 sm:px-0'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Label */}
      <motion.label
        className='block text-gray-700 mb-3 font-medium text-base sm:text-sm'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className='flex items-center'>
          <Pen className='w-4 h-4 mr-2 text-gray-500' />
          {label}
          {required && (
            <motion.span
              className='text-red-500 ml-1 text-lg'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              *
            </motion.span>
          )}
        </div>
      </motion.label>

      {/* Signature Canvas Container */}
      <motion.div
        ref={containerRef}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300 ${
          error
            ? 'border-red-400 bg-red-50/30'
            : hasSignature
            ? 'border-green-400 bg-green-50/30'
            : isHovered
            ? 'border-blue-400 bg-blue-50/30'
            : 'border-gray-300 bg-white'
        } ${!readOnly ? 'hover:shadow-md' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={!readOnly ? { scale: 1.005 } : {}}
        layout
      >
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className={`w-full ${
            canvasSize.height > 0
              ? `h-[${canvasSize.height}px]`
              : 'h-40 sm:h-32'
          } ${
            !readOnly ? 'cursor-crosshair' : 'cursor-default'
          } relative z-10 touch-none`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

        {/* Placeholder Text */}
        <AnimatePresence>
          {!hasSignature && !readOnly && (
            <motion.div
              className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Pen className='w-6 h-6 sm:w-5 sm:h-5 text-gray-400 mb-2' />
              </motion.div>
              <span className='text-gray-500 text-sm sm:text-xs font-medium text-center px-4'>
                <span className='block sm:inline'>Sign here with your </span>
                <span className='block sm:inline'>mouse or finger</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Indicator */}
        <AnimatePresence>
          {signatureComplete && hasSignature && (
            <motion.div
              className='absolute top-2 left-2 flex items-center bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg'
              initial={{ opacity: 0, scale: 0, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Check className='w-3 h-3 mr-1' />
              <span className='hidden sm:inline'>Signed</span>
              <span className='sm:hidden'>✓</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Confirmation */}
        <AnimatePresence>
          {justCleared && (
            <motion.div
              className='absolute inset-0 flex items-center justify-center bg-blue-50/90 z-30'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className='text-blue-600 font-medium text-sm flex items-center'
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: -10 }}
              >
                <RotateCcw className='w-4 h-4 mr-2' />
                Signature cleared
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {!readOnly && (
          <AnimatePresence>
            <motion.div
              className='absolute top-2 right-2 flex gap-1 z-50'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isHovered || hasSignature ? 1 : 0.7, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={e => {
                    e.stopPropagation();
                    clearSignature();
                  }}
                  className='h-8 w-8 p-0 cursor-pointer bg-white/95 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 shadow-md backdrop-blur-sm border-2'
                  title='Clear signature'
                >
                  <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Read-only overlay */}
        {readOnly && <div className='absolute inset-0 bg-gray-100/50 z-10' />}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className='mt-3 flex items-center text-red-600 text-sm font-medium'
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <AlertCircle className='w-4 h-4 mr-2' />
            </motion.div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <AnimatePresence>
        {helpText && (
          <motion.div
            className='text-sm text-gray-600 mt-3 leading-relaxed'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {helpText}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
