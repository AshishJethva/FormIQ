import Link from 'next/link';
import React from 'react';

const page = () => {
  return (
    <div>
      page
      <Link href={'/'} className='text-blue-50'>
        go to home
      </Link>
    </div>
  );
};

export default page;
