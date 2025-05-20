// src/components/form-builder/logo/FormLogo.tsx
'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useEffect, useState, useRef } from 'react';

export default function FormLogo() {
  const logo = useSelector((state: RootState) => state.formBuilder.form?.logo);
  const [containerHeight, setContainerHeight] = useState<string>('auto');
  const imgRef = useRef<HTMLImageElement>(null);

  // Adjust container height based on logo size
  useEffect(() => {
    if (!logo || !logo.src) return;

    // Set initial reasonable height
    setContainerHeight('auto');

    // Once the image loads, adjust container height based on logo size
    const adjustHeight = () => {
      if (imgRef.current) {
        const size = logo.size || 50;
        const imgHeight = imgRef.current.naturalHeight;
        const imgWidth = imgRef.current.naturalWidth;

        // Calculate appropriate height based on aspect ratio and size
        // For larger logos (>70%), provide more height
        if (size > 70) {
          const aspectRatio = imgWidth / imgHeight;
          const baseHeight = size > 90 ? 220 : 180;
          // If image is wider than tall, keep height reasonable
          const calculatedHeight =
            aspectRatio > 2 ? baseHeight : baseHeight * (1 + (size - 70) / 100);
          setContainerHeight(`${calculatedHeight}px`);
        } else {
          // For smaller logos, use standard height
          setContainerHeight('auto');
        }
      }
    };

    // Handle image load
    const img = imgRef.current;
    if (img) {
      if (img.complete) {
        adjustHeight();
      } else {
        img.addEventListener('load', adjustHeight);
        return () => {
          img.removeEventListener('load', adjustHeight);
        };
      }
    }
  }, [logo?.src, logo?.size]);

  if (!logo || !logo.src) {
    return null;
  }

  // Get the alignment class
  const getAlignmentClass = () => {
    switch (logo.alignment) {
      case 'LEFT':
        return 'justify-start';
      case 'RIGHT':
        return 'justify-end';
      case 'CENTER':
      default:
        return 'justify-center';
    }
  };

  // Calculate container width based on logo size percentage (0-100)
  const getContainerStyle = () => {
    // Ensure minimum size is 5% for visibility
    const minSize = 5;
    const effectiveSize = Math.max(minSize, logo.size || 50);

    return {
      width: `${effectiveSize}%`,
      transition: 'all 0.3s ease',
      minHeight: '60px',
      height: containerHeight,
    };
  };

  // Calculate image style to maintain aspect ratio without cropping
  const getImageStyle = () => {
    const size = logo.size || 50;
    // Increase max height for larger logos
    const maxHeight =
      size > 90 ? '220px' : size > 70 ? '180px' : size > 50 ? '150px' : '120px';

    return {
      maxWidth: '100%',
      maxHeight: maxHeight,
      width: 'auto',
      height: 'auto',
      objectFit: 'contain' as const,
      transition: 'all 0.3s ease',
    };
  };

  return (
    <div
      className={`flex ${getAlignmentClass()} w-full overflow-visible py-4`}
      style={{
        minHeight: '80px',
        height: containerHeight === 'auto' ? 'auto' : containerHeight,
      }}
    >
      <div
        className='relative flex items-center justify-center'
        style={getContainerStyle()}
      >
        <img
          ref={imgRef}
          src={logo.src}
          alt='Form Logo'
          style={getImageStyle()}
          onLoad={() => {
            // Additional trigger for height adjustment on load
            if (imgRef.current && logo.size && logo.size > 70) {
              const aspectRatio =
                imgRef.current.naturalWidth / imgRef.current.naturalHeight;
              const baseHeight = logo.size > 90 ? 220 : 180;
              const calculatedHeight =
                aspectRatio > 2
                  ? baseHeight
                  : baseHeight * (1 + (logo.size - 70) / 100);
              setContainerHeight(`${calculatedHeight}px`);
            }
          }}
        />
      </div>
    </div>
  );
}
