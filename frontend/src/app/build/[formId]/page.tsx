// app/build/[formId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Settings, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FormBuilderPage({
  params,
}: {
  params: { formId: string };
}) {
  const router = useRouter();
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formElements, setFormElements] = useState([]);
  const [activeTab, setActiveTab] = useState('builder');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate that the formId is 15 digits
    if (!/^\d{15}$/.test(params.formId)) {
      console.error('Invalid form ID format');
      router.push('/forms');
      return;
    }

    // In a real app, you would fetch the form data if it exists
    // For now, we'll just set a timeout to simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.formId, router]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header with form title and actions */}
      <header className='bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/forms')}
              className='text-gray-600 hover:text-gray-900'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>

            <Input
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className='border-none font-medium text-xl focus-visible:ring-transparent'
              placeholder='Untitled Form'
            />
          </div>

          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='text-gray-700'
              onClick={() => setActiveTab('settings')}
            >
              <Settings className='h-4 w-4 mr-2' />
              Settings
            </Button>

            <Button className='bg-indigo-600 text-white hover:bg-indigo-700'>
              <Save className='h-4 w-4 mr-2' />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs for Build and Settings */}
      <div className='border-b border-gray-200 bg-white'>
        <div className='max-w-7xl mx-auto px-6'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='w-full justify-start bg-transparent h-12 p-0'>
              <TabsTrigger
                value='builder'
                className='h-12 px-6 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent'
              >
                Builder
              </TabsTrigger>
              <TabsTrigger
                value='settings'
                className='h-12 px-6 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent'
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content area with appropriate tab content */}
      <main className='max-w-7xl mx-auto px-6 py-8'>
        <TabsContent value='builder' className='mt-0'>
          {/* Empty state for the form builder */}
          <div className='bg-white border border-gray-200 rounded-lg p-12 text-center mt-8'>
            <div className='mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4'>
              <PlusCircle className='h-8 w-8 text-indigo-600' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Your form is empty
            </h3>
            <p className='text-gray-500 mb-8 max-w-lg mx-auto'>
              Start by adding form elements. You can add text fields, multiple
              choice questions, dropdown menus, and more from the element panel.
            </p>
            <Button className='bg-indigo-600 text-white hover:bg-indigo-700'>
              <PlusCircle className='h-4 w-4 mr-2' />
              Add elements
            </Button>
          </div>
        </TabsContent>

        <TabsContent value='settings' className='mt-0'>
          <div className='bg-white border border-gray-200 rounded-lg p-6 mt-8'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Form Settings
            </h2>
            <p className='text-gray-500'>
              Configure your form settings here including notifications,
              submission handling, and appearance options.
            </p>
          </div>
        </TabsContent>
      </main>
    </div>
  );
}
