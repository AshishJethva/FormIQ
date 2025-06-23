// // src/components/skeletons/SupportLoadingSkeleton.tsx
// 'use client';

// import React from 'react';
// import { Skeleton } from '@/components/ui/skeleton';

// const SupportLoadingSkeleton: React.FC = () => {
//   return (
//     <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
//       {/* Header Section Skeleton */}
//       <div className='bg-white shadow-sm border-b'>
//         <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
//           <div className='text-center'>
//             {/* Icon Skeleton */}
//             <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
//               <Skeleton className='w-8 h-8 bg-blue-400 rounded' />
//             </div>

//             {/* Title Skeleton */}
//             <div className='mb-4 flex justify-center'>
//               <Skeleton className='w-80 h-12' />
//             </div>

//             {/* Description Skeleton */}
//             <div className='max-w-2xl mx-auto space-y-2'>
//               <Skeleton className='w-full h-6' />
//               <Skeleton className='w-3/4 h-6 mx-auto' />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
//         <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
//           {/* Contact Information Cards Skeleton */}
//           <div className='lg:col-span-1 space-y-6'>
//             {/* Section Title Skeleton */}
//             <Skeleton className='w-40 h-8 mb-6' />

//             {/* Contact Method Cards Skeleton */}
//             {Array.from({ length: 3 }, (_, index) => (
//               <ContactCardSkeleton key={`contact-${index}`} />
//             ))}

//             {/* Office Information Card Skeleton */}
//             <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
//               <div className='flex items-start space-x-4'>
//                 <div className='flex-shrink-0'>
//                   <Skeleton className='w-12 h-12 rounded-lg' />
//                 </div>
//                 <div className='flex-1 space-y-2'>
//                   <Skeleton className='w-32 h-5' />
//                   <Skeleton className='w-24 h-4' />
//                   <div className='space-y-1'>
//                     <Skeleton className='w-full h-4' />
//                     <Skeleton className='w-16 h-4' />
//                     <Skeleton className='w-24 h-4' />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Response Time Card Skeleton */}
//             <div className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white'>
//               <div className='flex items-center space-x-3 mb-3'>
//                 <Skeleton className='w-6 h-6 bg-blue-400' />
//                 <Skeleton className='w-48 h-5 bg-blue-400' />
//               </div>
//               <div className='space-y-2'>
//                 {Array.from({ length: 3 }, (_, index) => (
//                   <div key={index} className='flex justify-between'>
//                     <Skeleton className='w-20 h-4 bg-blue-400' />
//                     <Skeleton className='w-24 h-4 bg-blue-400' />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Contact Form Skeleton */}
//           <div className='lg:col-span-2'>
//             <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
//               {/* Form Header Skeleton */}
//               <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6'>
//                 <Skeleton className='w-48 h-7 bg-blue-400 mb-2' />
//                 <Skeleton className='w-full h-5 bg-blue-400' />
//               </div>

//               {/* Form Content Skeleton */}
//               <div className='p-8 space-y-6'>
//                 {/* Name and Email Row Skeleton */}
//                 <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
//                   <FormFieldSkeleton />
//                   <FormFieldSkeleton />
//                 </div>

//                 {/* Category and Priority Row Skeleton */}
//                 <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
//                   <FormFieldSkeleton isSelect />
//                   <FormFieldSkeleton isSelect />
//                 </div>

//                 {/* Subject Field Skeleton */}
//                 <FormFieldSkeleton />

//                 {/* Message Field Skeleton */}
//                 <div className='space-y-2'>
//                   <Skeleton className='w-20 h-5' />
//                   <Skeleton className='w-full h-32 rounded-lg' />
//                 </div>

//                 {/* Submit Button Skeleton */}
//                 <div className='flex flex-col sm:flex-row gap-4 items-center'>
//                   <Skeleton className='w-full sm:w-40 h-12 rounded-lg' />
//                 </div>

//                 {/* Footer Text Skeleton */}
//                 <div className='text-center sm:text-left'>
//                   <Skeleton className='w-80 h-4 mx-auto sm:mx-0' />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* FAQ Section Skeleton */}
//         <div className='mt-16'>
//           {/* FAQ Header Skeleton */}
//           <div className='text-center mb-12'>
//             <Skeleton className='w-80 h-9 mx-auto mb-4' />
//             <div className='max-w-2xl mx-auto space-y-2'>
//               <Skeleton className='w-full h-5' />
//               <Skeleton className='w-3/4 h-5 mx-auto' />
//             </div>
//           </div>

//           {/* FAQ Grid Skeleton */}
//           <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
//             {Array.from({ length: 4 }, (_, index) => (
//               <FAQCardSkeleton key={`faq-${index}`} />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Contact Card Skeleton Component
// const ContactCardSkeleton: React.FC = () => {
//   return (
//     <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
//       <div className='flex items-start space-x-4'>
//         <div className='flex-shrink-0'>
//           <Skeleton className='w-12 h-12 rounded-lg' />
//         </div>
//         <div className='flex-1 space-y-2'>
//           <Skeleton className='w-32 h-5' />
//           <Skeleton className='w-40 h-4' />
//           <Skeleton className='w-36 h-5' />
//           <Skeleton className='w-28 h-3' />
//         </div>
//       </div>
//     </div>
//   );
// };

// // Form Field Skeleton Component
// interface FormFieldSkeletonProps {
//   isSelect?: boolean;
// }

// const FormFieldSkeleton: React.FC<FormFieldSkeletonProps> = ({
//   isSelect = false,
// }) => {
//   return (
//     <div className='space-y-2'>
//       <Skeleton className='w-24 h-5' />
//       <Skeleton className={`w-full ${isSelect ? 'h-12' : 'h-12'} rounded-lg`} />
//     </div>
//   );
// };

// // FAQ Card Skeleton Component
// const FAQCardSkeleton: React.FC = () => {
//   return (
//     <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
//       <Skeleton className='w-3/4 h-6 mb-3' />
//       <div className='space-y-2'>
//         <Skeleton className='w-full h-4' />
//         <Skeleton className='w-full h-4' />
//         <Skeleton className='w-2/3 h-4' />
//       </div>
//     </div>
//   );
// };

// export default SupportLoadingSkeleton;

// src/components/skeletons/SupportLoadingSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SupportLoadingSkeleton: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Header Section Skeleton */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            {/* Icon Skeleton */}
            <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
              <Skeleton className='w-8 h-8 bg-blue-400 rounded' />
            </div>

            {/* Title Skeleton */}
            <div className='mb-4 flex justify-center'>
              <Skeleton className='w-80 h-12 bg-gray-300' />
            </div>

            {/* Description Skeleton */}
            <div className='max-w-2xl mx-auto space-y-2'>
              <Skeleton className='w-full h-6 bg-gray-300' />
              <Skeleton className='w-3/4 h-6 mx-auto bg-gray-300' />
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Contact Information Cards Skeleton */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Section Title Skeleton */}
            <Skeleton className='w-40 h-8 mb-6 bg-gray-300' />

            {/* Contact Method Cards Skeleton */}
            {Array.from({ length: 3 }, (_, index) => (
              <ContactCardSkeleton key={`contact-${index}`} />
            ))}

            {/* Office Information Card Skeleton */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <Skeleton className='w-12 h-12 rounded-lg bg-gray-300' />
                </div>
                <div className='flex-1 space-y-2'>
                  <Skeleton className='w-32 h-5 bg-gray-300' />
                  <Skeleton className='w-24 h-4 bg-gray-200' />
                  <div className='space-y-1'>
                    <Skeleton className='w-full h-4 bg-gray-200' />
                    <Skeleton className='w-16 h-4 bg-gray-200' />
                    <Skeleton className='w-24 h-4 bg-gray-200' />
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time Card Skeleton */}
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white'>
              <div className='flex items-center space-x-3 mb-3'>
                <Skeleton className='w-6 h-6 bg-blue-400' />
                <Skeleton className='w-48 h-5 bg-blue-400' />
              </div>
              <div className='space-y-2'>
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className='flex justify-between'>
                    <Skeleton className='w-20 h-4 bg-blue-400' />
                    <Skeleton className='w-24 h-4 bg-blue-400' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form Skeleton */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
              {/* Form Header Skeleton */}
              <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6'>
                <Skeleton className='w-48 h-7 bg-blue-400 mb-2' />
                <Skeleton className='w-full h-5 bg-blue-400/70' />
              </div>

              {/* Form Content Skeleton */}
              <div className='p-8 space-y-6'>
                {/* Name and Email Row Skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>

                {/* Category and Priority Row Skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormFieldSkeleton isSelect />
                  <FormFieldSkeleton isSelect />
                </div>

                {/* Subject Field Skeleton */}
                <FormFieldSkeleton />

                {/* Message Field Skeleton */}
                <div className='space-y-2'>
                  <Skeleton className='w-20 h-5 bg-gray-300' />
                  <Skeleton className='w-full h-32 rounded-lg bg-gray-200' />
                </div>

                {/* Submit Button Skeleton */}
                <div className='flex flex-col sm:flex-row gap-4 items-center'>
                  <Skeleton className='w-full sm:w-40 h-12 rounded-lg bg-gradient-to-r from-blue-200 to-indigo-200' />
                </div>

                {/* Footer Text Skeleton */}
                <div className='text-center sm:text-left'>
                  <Skeleton className='w-80 h-4 mx-auto sm:mx-0 bg-gray-200' />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section Skeleton */}
        <div className='mt-16'>
          {/* FAQ Header Skeleton */}
          <div className='text-center mb-12'>
            <Skeleton className='w-80 h-9 mx-auto mb-4 bg-gray-300' />
            <div className='max-w-2xl mx-auto space-y-2'>
              <Skeleton className='w-full h-5 bg-gray-200' />
              <Skeleton className='w-3/4 h-5 mx-auto bg-gray-200' />
            </div>
          </div>

          {/* FAQ Grid Skeleton */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {Array.from({ length: 4 }, (_, index) => (
              <FAQCardSkeleton key={`faq-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Contact Card Skeleton Component
const ContactCardSkeleton: React.FC = () => {
  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
      <div className='flex items-start space-x-4'>
        <div className='flex-shrink-0'>
          <Skeleton className='w-12 h-12 rounded-lg bg-gray-300' />
        </div>
        <div className='flex-1 space-y-2'>
          <Skeleton className='w-32 h-5 bg-gray-300' />
          <Skeleton className='w-40 h-4 bg-gray-200' />
          <Skeleton className='w-36 h-5 bg-gray-300' />
          <Skeleton className='w-28 h-3 bg-gray-200' />
        </div>
      </div>
    </div>
  );
};

// Form Field Skeleton Component
interface FormFieldSkeletonProps {
  isSelect?: boolean;
}

const FormFieldSkeleton: React.FC<FormFieldSkeletonProps> = ({
  isSelect = false,
}) => {
  return (
    <div className='space-y-2'>
      <Skeleton className='w-24 h-5 bg-gray-300' />
      <Skeleton
        className={cn(
          'w-full rounded-lg',
          isSelect ? 'h-12 bg-gray-200' : 'h-12 bg-gray-200'
        )}
      />
    </div>
  );
};

// FAQ Card Skeleton Component
const FAQCardSkeleton: React.FC = () => {
  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
      <Skeleton className='w-3/4 h-6 mb-3 bg-gray-300' />
      <div className='space-y-2'>
        <Skeleton className='w-full h-4 bg-gray-200' />
        <Skeleton className='w-full h-4 bg-gray-200' />
        <Skeleton className='w-2/3 h-4 bg-gray-200' />
      </div>
    </div>
  );
};

export default SupportLoadingSkeleton;
