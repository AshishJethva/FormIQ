// src/components/form-builder/canvas/SignatureField.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if any
    if (value && value !== 'Signature added') {
      try {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasSignature(true);
        };
        img.src = value;
      } catch (error) {
        console.error('Error loading signature:', error);
      }
    }
  }, [value]);

  const getCanvasPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (readOnly) return;

    e.preventDefault();
    setIsDrawing(true);
    const position = getCanvasPosition(e);
    setLastPosition(position);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || readOnly) return;

    e.preventDefault();
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
    onChange('');
  };

  return (
    <div className='mb-6'>
      <label className='block text-gray-700 mb-2 font-medium'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>

      <div
        className={`border-2 border-dashed rounded-md bg-white relative ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <canvas
          ref={canvasRef}
          className='w-full h-32 cursor-crosshair'
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />

        {!hasSignature && !readOnly && (
          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <span className='text-gray-400 text-sm'>
              Sign here with your mouse or finger
            </span>
          </div>
        )}

        {!readOnly && (
          <div className='absolute top-2 right-2 flex gap-1'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={clearSignature}
              className='h-8 w-8 p-0'
              title='Clear signature'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className='text-red-500 text-sm mt-2 flex items-center'>
          <span className='mr-1'>⚠️</span>
          {error}
        </div>
      )}

      {helpText && <div className='text-sm text-gray-500 mt-2'>{helpText}</div>}
    </div>
  );
}
