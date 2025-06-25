'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useEffect, useState, useRef } from 'react';

export default function FormLogo() {
  const logo = useSelector((state: RootState) => state.formBuilder.form?.logo);
  const [containerHeight, setContainerHeight] = useState<string>('auto');
  const imgRef = useRef<HTMLImageElement>(null);

  // Adjust container height based on logo size and screen size
  useEffect(() => {
    if (!logo || !logo.src) return;

    // Set initial reasonable height
    setContainerHeight('auto');

    // Once the image loads, adjust container height based on logo size and screen size
    const adjustHeight = () => {
      if (imgRef.current) {
        const size = logo.size || 50;
        const imgHeight = imgRef.current.naturalHeight;
        const imgWidth = imgRef.current.naturalWidth;

        // Get current screen width to adjust heights responsively
        const screenWidth = window.innerWidth;

        // Calculate appropriate height based on aspect ratio, size, and screen size
        // Mobile-first approach with progressive enhancement
        if (size > 70) {
          const aspectRatio = imgWidth / imgHeight;

          let baseHeight: number;
          if (screenWidth < 640) {
            // Mobile
            baseHeight = size > 90 ? 160 : 140;
          } else if (screenWidth < 1024) {
            // Tablet
            baseHeight = size > 90 ? 200 : 160;
          } else {
            // Desktop
            baseHeight = size > 90 ? 220 : 180;
          }

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

        // Also listen for resize events to adjust on orientation change
        const handleResize = () => {
          setTimeout(adjustHeight, 100); // Small delay to ensure layout is stable
        };

        window.addEventListener('resize', handleResize);

        return () => {
          img.removeEventListener('load', adjustHeight);
          window.removeEventListener('resize', handleResize);
        };
      }
    }
  }, [logo?.src, logo?.size, logo]);

  if (!logo || !logo.src) {
    return null;
  }

  // Calculate image style to maintain aspect ratio without cropping - Mobile responsive
  const getImageStyle = () => {
    const size = logo.size || 50;

    // Mobile-first responsive scaling
    let maxHeight: string;
    let maxWidth: string;

    if (size >= 100) {
      // For 100% size, allow much larger dimensions but scale down on mobile
      maxHeight = '200px'; // Mobile
      maxWidth = '100%';

      // Use CSS classes for responsive scaling instead of inline styles when possible
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 640) {
          // sm breakpoint
          maxHeight = '250px';
        }
        if (screenWidth >= 1024) {
          // lg breakpoint
          maxHeight = '300px';
        }
      }
    } else if (size > 90) {
      maxHeight = '180px'; // Mobile
      maxWidth = '90%';

      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        maxHeight = '220px';
      }
    } else if (size > 70) {
      maxHeight = '150px'; // Mobile
      maxWidth = '80%';

      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        maxHeight = '180px';
      }
    } else if (size > 50) {
      maxHeight = '120px'; // Mobile
      maxWidth = '70%';

      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        maxHeight = '150px';
      }
    } else {
      maxHeight = '100px'; // Mobile
      maxWidth = '60%';

      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        maxHeight = '120px';
      }
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

  // onLoad handler with mobile considerations
  const handleImageLoad = () => {
    if (imgRef.current && logo.size && logo.size > 70) {
      const aspectRatio =
        imgRef.current.naturalWidth / imgRef.current.naturalHeight;
      const screenWidth = window.innerWidth;

      let baseHeight: number;
      if (screenWidth < 640) {
        // Mobile
        baseHeight = logo.size > 90 ? 160 : 140;
      } else if (screenWidth < 1024) {
        // Tablet
        baseHeight = logo.size > 90 ? 200 : 160;
      } else {
        // Desktop
        baseHeight = logo.size > 90 ? 220 : 180;
      }

      const calculatedHeight =
        aspectRatio > 2
          ? baseHeight
          : baseHeight * (1 + (logo.size - 70) / 100);
      setContainerHeight(`${calculatedHeight}px`);
    }
  };

  return (
    <div
      className={`flex w-full overflow-visible
        /* Mobile padding and spacing */
        px-2 sm:px-4 lg:px-0

        /* Alignment classes */
        ${
          logo.alignment === 'LEFT'
            ? 'justify-start'
            : logo.alignment === 'RIGHT'
            ? 'justify-end'
            : 'justify-center'
        }`}
      style={{
        minHeight: '60px', // Reduced for mobile
        height: containerHeight === 'auto' ? 'auto' : containerHeight,
        padding: '0 0',
        margin: 0,
      }}
    >
      <div
        className='relative flex items-center justify-center
          /* Mobile-responsive container */
          w-full sm:w-auto

          /* Smooth transitions */
          transition-all duration-300 ease-in-out'
        style={{
          // Let width be determined by size percentage with mobile considerations
          width:
            logo.size >= 100 ? '100%' : `${Math.max(10, logo.size || 50)}%`,
          minHeight: '50px', // Reduced for mobile
          height: containerHeight,
          margin: 0,
        }}
      >
        <img
          ref={imgRef}
          src={logo.src}
          alt='Form Logo'
          className='
            /* Mobile-responsive image */
            max-w-full h-auto

            /* Smooth loading animation */
            transition-all duration-300 ease-in-out

            /* Prevent image stretching */
            object-contain

            /* Mobile-specific adjustments */
            sm:max-w-none
          '
          style={getImageStyle()}
          onLoad={handleImageLoad}
          onError={e => {
            // Fallback handling for broken images
            console.warn('Logo failed to load:', logo.src);
            e.currentTarget.style.display = 'none';
          }}
          loading='lazy' // Improve performance on mobile
        />
      </div>
    </div>
  );
}
