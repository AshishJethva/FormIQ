// // src/components/form-builder/navigation/MainNavigation.tsx
// 'use client';

// interface MainNavigationProps {
//   activeTab: string;
//   onTabChange: (tab: string) => void;
//   isPreviewEnabled?: boolean;
//   onPreviewToggle?: (enabled: boolean) => void;
// }

// export default function MainNavigation({
//   activeTab,
//   onTabChange,
//   isPreviewEnabled = false,
//   onPreviewToggle,
// }: MainNavigationProps) {
//   const tabs = ['BUILD', 'SETTINGS', 'PUBLISH'];

//   const handlePreviewToggle = () => {
//     if (onPreviewToggle) {
//       onPreviewToggle(!isPreviewEnabled);
//     }
//   };

//   return (
//     <nav className='flex items-center justify-between bg-[#F8A030] border-b border-orange-100 h-12'>
//       {/* Left Section (empty in this design) */}
//       <div className='flex-1'></div>

//       {/* Center Section - Tabs */}
//       <div className='flex items-center justify-center flex-1 h-fit'>
//         {tabs.map(tab => (
//           <button
//             key={tab}
//             className={`px-8 py-2 text-lg font-medium transition-colors ${
//               activeTab === tab
//                 ? 'bg-[#F9B568] text-white'
//                 : 'opacity-60 hover:opacity-100 text-white hover:text-[#FFFFFF] hover:bg-[#F9B568]'
//             }`}
//             onClick={() => onTabChange(tab)}
//           >
//             {tab}
//           </button>
//         ))}
//       </div>

//       {/* Right Section - Preview Toggle */}
//       <div className='flex items-center justify-end flex-1 pr-4 h-full'>
//         <span className='mr-2 text-sm font-medium text-white'>
//           Preview Form
//         </span>
//         <div
//           className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
//             isPreviewEnabled ? 'bg-[#A8EB38]' : 'bg-[#E2E3E9]'
//           }`}
//           onClick={handlePreviewToggle}
//         >
//           <span
//             className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
//               isPreviewEnabled ? 'transform translate-x-6' : ''
//             }`}
//           />
//         </div>
//       </div>
//     </nav>
//   );
// }

// src/components/form-builder/navigation/MainNavigation.tsx
'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';

interface MainNavigationProps {
  isPreviewEnabled?: boolean;
  onPreviewToggle?: (enabled: boolean) => void;
}

export default function MainNavigation({
  isPreviewEnabled = false,
  onPreviewToggle,
}: MainNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const formId = params.formId as string;

  const tabs = ['BUILD', 'SETTINGS', 'PUBLISH'];

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname.includes('/settings')) return 'SETTINGS';
    if (pathname.includes('/publish')) return 'PUBLISH';
    if (pathname.includes('#preview')) return 'BUILD';
    return 'BUILD';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'BUILD':
        router.push(`/build/${formId}`);
        break;
      case 'SETTINGS':
        router.push(`/build/${formId}/settings`);
        break;
      case 'PUBLISH':
        router.push(`/build/${formId}/publish`);
        break;
    }
  };

  const handlePreviewToggle = () => {
    if (onPreviewToggle) {
      onPreviewToggle(!isPreviewEnabled);
    }

    // Navigate to preview URL
    if (!isPreviewEnabled) {
      router.push(`/build/${formId}#preview`);
    } else {
      router.push(`/build/${formId}`);
    }
  };

  return (
    <nav className='flex items-center justify-between bg-[#F8A030] border-b border-orange-100 h-12'>
      {/* Left Section (empty in this design) */}
      <div className='flex-1'></div>

      {/* Center Section - Tabs */}
      <div className='flex items-center justify-center flex-1 h-fit'>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`px-8 py-2 text-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#F9B568] text-white'
                : 'opacity-60 hover:opacity-100 text-white hover:text-[#FFFFFF] hover:bg-[#F9B568]'
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right Section - Preview Toggle */}
      <div className='flex items-center justify-end flex-1 pr-4 h-full'>
        <span className='mr-2 text-sm font-medium text-white'>
          Preview Form
        </span>
        <div
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
            isPreviewEnabled ? 'bg-[#A8EB38]' : 'bg-[#E2E3E9]'
          }`}
          onClick={handlePreviewToggle}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isPreviewEnabled ? 'transform translate-x-6' : ''
            }`}
          />
        </div>
      </div>
    </nav>
  );
}
