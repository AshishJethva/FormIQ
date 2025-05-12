import React from 'react';
import Link from 'next/link';

const DashboardPage = () => {
  return (
    <div>
      DashboardPage
      <Link href={'/forms'} className='text-blue-50'>go to forms</Link>
    </div>
  );
};

export default DashboardPage;
