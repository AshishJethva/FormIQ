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
  }, [logo?.src, logo?.size, logo]);

  if (!logo || !logo.src) {
    return null;
  }

  // Calculate image style to maintain aspect ratio without cropping
  const getImageStyle = () => {
    const size = logo.size || 50;

    //  ENHANCED: Better scaling for 100% logos
    let maxHeight: string;
    let maxWidth: string;

    if (size >= 100) {
      // For 100% size, allow much larger dimensions
      maxHeight = '300px';
      maxWidth = '100%';
    } else if (size > 90) {
      maxHeight = '220px';
      maxWidth = '90%';
    } else if (size > 70) {
      maxHeight = '180px';
      maxWidth = '80%';
    } else if (size > 50) {
      maxHeight = '150px';
      maxWidth = '70%';
    } else {
      maxHeight = '120px';
      maxWidth = '60%';
    }

    return {
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      width: 'auto',
      height: 'auto',
      objectFit: 'contain' as const,
      transition: 'all 0.3s ease',
    };
  };

  return (
    <div
      className={`flex w-full overflow-visible ${
        logo.alignment === 'LEFT'
          ? 'justify-start'
          : logo.alignment === 'RIGHT'
          ? 'justify-end'
          : 'justify-center'
      }`}
      style={{
        minHeight: '80px',
        height: containerHeight === 'auto' ? 'auto' : containerHeight,
        padding: '0 0',
        margin: 0,
      }}
    >
      <div
        className='relative flex items-center justify-center'
        style={{
          //  FIXED: Let width be determined by size percentage
          width: logo.size >= 100 ? '100%' : `${Math.max(5, logo.size || 50)}%`,
          transition: 'all 0.3s ease',
          minHeight: '60px',
          height: containerHeight,
          margin: 0,
        }}
      >
        <img
          ref={imgRef}
          src={logo.src}
          alt='Form Logo'
          style={getImageStyle()}
          onLoad={() => {
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
