// src/components/form-builder/navigation/MainNavigation.tsx
'use client';

interface MainNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPreviewEnabled?: boolean;
  onPreviewToggle?: (enabled: boolean) => void;
}

export default function MainNavigation({
  activeTab,
  onTabChange,
  isPreviewEnabled = false,
  onPreviewToggle,
}: MainNavigationProps) {
  const tabs = ['BUILD', 'SETTINGS', 'PUBLISH'];

  const handlePreviewToggle = () => {
    if (onPreviewToggle) {
      onPreviewToggle(!isPreviewEnabled);
    }
  };

  return (
    <nav className='flex items-center justify-between bg-orange-50 border-b border-orange-100'>
      {/* Left Section (empty in this design) */}
      <div className='flex-1'></div>

      {/* Center Section - Tabs */}
      <div className='flex items-center justify-center flex-1'>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`px-8 py-4 font-medium transition-colors ${
              activeTab === tab
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-orange-200'
            }`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right Section - Preview Toggle */}
      <div className='flex items-center justify-end flex-1 pr-4'>
        <span className='mr-2 text-sm font-medium text-gray-700'>
          Preview Form
        </span>
        <div
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
            isPreviewEnabled ? 'bg-blue-500' : 'bg-gray-300'
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
