// src/components/form-builder/preview/PreviewPage.tsx
'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PreviewHeader from './PreviewHeader';
import PreviewForm from './PreviewForm';
import {
  submitForm,
  prepareFileDataForSubmission,
} from '@/services/formSubmission';

interface PreviewPageProps {
  formId: string;
}

type DeviceType = 'phone' | 'tablet' | 'desktop';

export default function PreviewPage({ formId }: PreviewPageProps) {
  const form = useSelector((state: RootState) => state.formBuilder.form);

  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fileData, setFileData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ensure form has proper ID for preview mode
  const formWithId = form
    ? { ...form, id: form.id || formId || 'preview' }
    : null;

  if (!formWithId) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading form preview...</p>
        </div>
      </div>
    );
  }

  const shareableLink = `${window.location.origin}/form/${formId}`;

  //  FULLY : Complete dummy data generation with safe placeholders
  const generateDummyData = () => {
    const dummyFormData: Record<string, any> = {};
    const dummyFileData: Record<string, any> = {};

    //  Realistic data pools for Indian context
    const names = {
      firstNames: [
        'Arjun',
        'Priya',
        'Rahul',
        'Sneha',
        'Vikram',
        'Ananya',
        'Karan',
        'Pooja',
        'Amit',
        'Riya',
        'Sanjay',
        'Kavya',
        'Rohan',
        'Meera',
        'Aditya',
        'Ishita',
        'Nikhil',
        'Shreya',
        'Varun',
        'Divya',
        'Ashish',
        'Neha',
        'Rajesh',
        'Sunita',
      ],
      lastNames: [
        'Sharma',
        'Patel',
        'Singh',
        'Gupta',
        'Kumar',
        'Agarwal',
        'Jain',
        'Shah',
        'Mehta',
        'Verma',
        'Reddy',
        'Iyer',
        'Chopra',
        'Bansal',
        'Malhotra',
        'Kapoor',
        'Mishra',
        'Joshi',
        'Pandey',
        'Nair',
        'Bhatia',
        'Sinha',
        'Yadav',
        'Tiwari',
      ],
    };

    const emails = [
      'arjun.sharma@gmail.com',
      'priya.patel@yahoo.co.in',
      'rahul.singh@outlook.com',
      'sneha.gupta@hotmail.com',
      'vikram.kumar@techcorp.com',
      'ananya.jain@innovate.co.in',
      'karan.mehta@startup.io',
      'pooja.reddy@university.edu',
      'amit.verma@consulting.com',
      'riya.chopra@design.studio',
      'rohan.singh@software.com',
      'meera.nair@finance.org',
      'aditya.kumar@marketing.net',
      'ishita.sharma@healthcare.in',
      'nikhil.patel@tech.io',
      'shreya.gupta@education.ac.in',
      'varun.reddy@business.com',
      'divya.joshi@creative.studio',
    ];

    const phones = [
      '9876543210',
      '8765432109',
      '7654321098',
      '9123456789',
      '8234567890',
      '7345678901',
      '6789012345',
      '9012345678',
      '8901234567',
      '7890123456',
      '6234567890',
      '9345678901',
      '8456789012',
      '7567890123',
      '6678901234',
      '9789012345',
      '8890123456',
      '7901234567',
      '6012345678',
      '9123456780',
    ];

    const addresses = [
      {
        street: '123 MG Road, Koramangala 5th Block',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560034',
      },
      {
        street: '45 Park Street, Andheri West, Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400058',
      },
      {
        street: '78 Connaught Place, Central Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
      },
      {
        street: '92 Salt Lake City, Sector V, IT Hub',
        city: 'Kolkata',
        state: 'West Bengal',
        zipCode: '700091',
      },
      {
        street: '156 Banjara Hills, Road No. 12',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500034',
      },
      {
        street: '234 Anna Nagar, 2nd Avenue',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zipCode: '600040',
      },
      {
        street: '567 FC Road, Shivajinagar',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411005',
      },
      {
        street: '890 Satellite Road, Vastrapur',
        city: 'Ahmedabad',
        state: 'Gujarat',
        zipCode: '380015',
      },
    ];

    const companies = [
      'TCS',
      'Infosys',
      'Wipro',
      'HCL Technologies',
      'Accenture',
      'IBM India',
      'Microsoft India',
      'Google India',
      'Amazon',
      'Flipkart',
      'Paytm',
      'Zomato',
      'Swiggy',
      "BYJU'S",
      'Ola',
      'PhonePe',
      'Razorpay',
      'Freshworks',
      'Zoho',
    ];

    const jobTitles = [
      'Software Engineer',
      'Senior Developer',
      'Team Lead',
      'Project Manager',
      'Business Analyst',
      'UI/UX Designer',
      'DevOps Engineer',
      'QA Engineer',
      'Data Scientist',
      'Product Manager',
      'Technical Architect',
      'Scrum Master',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile Developer',
    ];

    const skills = [
      'JavaScript',
      'Python',
      'React',
      'Node.js',
      'Java',
      'SQL',
      'AWS',
      'Docker',
      'MongoDB',
      'TypeScript',
      'Angular',
      'Vue.js',
      'Spring Boot',
      'PostgreSQL',
      'Redis',
      'Kubernetes',
      'GraphQL',
      'Firebase',
      'Express.js',
      'Next.js',
    ];

    const cities = [
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Chennai',
      'Hyderabad',
      'Pune',
      'Kolkata',
      'Ahmedabad',
      'Jaipur',
      'Lucknow',
      'Kanpur',
      'Nagpur',
      'Indore',
      'Bhopal',
      'Visakhapatnam',
      'Patna',
      'Vadodara',
      'Ghaziabad',
      'Ludhiana',
      'Coimbatore',
    ];

    // Helper functions
    const randomChoice = (arr: any[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    const randomNumber = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const randomDate = (daysFromNow: number, variance: number = 30) => {
      const date = new Date();
      const randomDays = daysFromNow + randomNumber(-variance, variance);
      date.setDate(date.getDate() + randomDays);
      return date;
    };

    const formatDate = (date: Date): string => date.toISOString().split('T')[0];

    const generateValidTime = (): string => {
      const hours = randomNumber(9, 17).toString().padStart(2, '0');
      const minutes = randomChoice(['00', '15', '30', '45']);
      return `${hours}:${minutes}`;
    };

    //  SAFE IMAGE PLACEHOLDERS - No external URLs
    const generateSafeImagePlaceholder = (type: string = 'general') => {
      const placeholders = {
        profile:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBmMmZlIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI2MCIgZmlsbD0iIzM3NzNkYyIvPjxwYXRoIGQ9Im0xMjAgMjgwIGMwLTQ0IDM2LTgwIDgwLTgwczgwIDM2IDgwIDgwIiBmaWxsPSIjMzc3M2RjIi8+PHRleHQgeD0iMjAwIiB5PSIzNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NzNkYyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZmlsZSBQaG90bzwvdGV4dD48L3N2Zz4=',
        document:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOWZmIi8+PHJlY3QgeD0iMTAwIiB5PSI4MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxMjAiIHkxPSIxMjAiIHgyPSIyODAiIHkyPSIxMjAiIHN0cm9rZT0iIzY2NzNhZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjEyMCIgeTE9IjE1MCIgeDI9IjI2MCIgeTI9IjE1MCIgc3Ryb2tlPSIjOWZhNmI3IiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTIwIiB5MT0iMTgwIiB4Mj0iMjQwIiB5Mj0iMTgwIiBzdHJva2U9IiM5ZmE2YjciIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjIwMCIgeT0iMzUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjczYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRvY3VtZW50IEltYWdlPC90ZXh0Pjwvc3ZnPg==',
        general:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmFmYWZhIi8+PHJlY3QgeD0iMTQwIiB5PSIxNDAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMTAiIGZpbGw9IiNlNWU3ZWIiIHN0cm9rZT0iI2Q0ZDRkOCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTgwIiBjeT0iMTgwIiByPSIxNSIgZmlsbD0iI2Y5ZmJmZiIvPjxwYXRoIGQ9Im0yMDUgMTk1IGwyNSAyNSBtLTI1IDAgbDI1IC0yNSIgc3Ryb2tlPSIjZjlmYmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSIyMDAiIHk9IjMwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==',
      };
      return (
        placeholders[type as keyof typeof placeholders] || placeholders.general
      );
    };

    //  SAFE FILE PLACEHOLDERS
    const generateSafeFileData = (fileName: string, mimeType: string) => ({
      originalName: fileName,
      fileName: `${fileName.split('.')[0]}_${Date.now()}.${fileName
        .split('.')
        .pop()}`,
      url: `data:${mimeType};base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKeCByZWYKMCAxCjAwMDAwMDAwMDAgNjU1MzUgZiAKdHJhaWxlcgo8PAovU2l6ZSAxCi9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo5CiUlRU9G`,
      publicId: `form-submissions/files/${
        fileName.split('.')[0]
      }_${Date.now()}`,
      size: randomNumber(200000, 2000000),
      mimeType,
      uploadedAt: new Date().toISOString(),
    });

    // Generate data for each field
    form?.pages?.forEach(page => {
      page.fields?.forEach(field => {
        if (field.type === 'heading') return;

        const fieldLabel = field.label?.toLowerCase() || '';

        switch (field.type) {
          case 'fullName':
            dummyFormData[field.id] = {
              firstName: randomChoice(names.firstNames),
              lastName: randomChoice(names.lastNames),
            };
            break;

          case 'email':
            dummyFormData[field.id] = randomChoice(emails);
            break;

          case 'phone':
            dummyFormData[field.id] = randomChoice(phones);
            break;

          case 'address':
            dummyFormData[field.id] = randomChoice(addresses);
            break;

          case 'datePicker':
            if (fieldLabel.includes('birth') || fieldLabel.includes('dob')) {
              const birthDate = new Date();
              birthDate.setFullYear(
                birthDate.getFullYear() - randomNumber(22, 65)
              );
              dummyFormData[field.id] = formatDate(birthDate);
            } else if (
              fieldLabel.includes('start') ||
              fieldLabel.includes('join')
            ) {
              const startDate = new Date();
              startDate.setFullYear(
                startDate.getFullYear() - randomNumber(1, 10)
              );
              dummyFormData[field.id] = formatDate(startDate);
            } else {
              const futureDate = randomDate(7, 90);
              dummyFormData[field.id] = formatDate(futureDate);
            }
            break;

          case 'appointment':
            const appointmentDate = randomDate(3, 14);
            dummyFormData[field.id] = {
              date: formatDate(appointmentDate),
              time: generateValidTime(),
            };
            break;

          case 'signature':
            const signatureName = `${randomChoice(
              names.firstNames
            )} ${randomChoice(names.lastNames)}`;
            dummyFormData[field.id] = `${signatureName} Digital Signature`;
            break;

          case 'fillBlank':
            const fillBlankOptions = [
              'terms and conditions',
              'privacy policy',
              'user agreement',
              'company policies',
              'code of conduct',
              'safety guidelines',
              'data protection rules',
              'employment contract',
              'service agreement',
            ];
            dummyFormData[field.id] = randomChoice(fillBlankOptions);
            break;

          case 'productList':
            //  ENHANCED: Realistic product selection with quantities
            if (
              field.productListConfig?.products &&
              field.productListConfig.products.length > 0
            ) {
              const products = field.productListConfig.products;
              const selectedProducts = [];
              const numProducts = randomNumber(1, Math.min(3, products.length));
              const shuffledProducts = [...products].sort(
                () => Math.random() - 0.5
              );

              for (let i = 0; i < numProducts; i++) {
                const product = shuffledProducts[i];
                selectedProducts.push({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: randomNumber(1, 5),
                });
              }
              dummyFormData[field.id] = selectedProducts;
            } else {
              dummyFormData[field.id] = [
                {
                  id: 'sample1',
                  name: 'Sample Product',
                  price: 29.99,
                  quantity: 2,
                },
              ];
            }
            break;

          case 'shortText':
            if (
              fieldLabel.includes('company') ||
              fieldLabel.includes('organization')
            ) {
              dummyFormData[field.id] = randomChoice(companies);
            } else if (
              fieldLabel.includes('position') ||
              fieldLabel.includes('title') ||
              fieldLabel.includes('job')
            ) {
              dummyFormData[field.id] = randomChoice(jobTitles);
            } else if (
              fieldLabel.includes('skill') ||
              fieldLabel.includes('technology')
            ) {
              dummyFormData[field.id] = randomChoice(skills);
            } else if (
              fieldLabel.includes('city') ||
              fieldLabel.includes('location')
            ) {
              dummyFormData[field.id] = randomChoice(cities);
            } else if (
              fieldLabel.includes('name') &&
              !fieldLabel.includes('full')
            ) {
              dummyFormData[field.id] = randomChoice(names.firstNames);
            } else {
              dummyFormData[field.id] = 'Professional response text';
            }
            break;

          case 'longText':
            if (
              fieldLabel.includes('experience') ||
              fieldLabel.includes('background')
            ) {
              const yearsExp = randomNumber(2, 12);
              const skill1 = randomChoice(skills);
              const skill2 = randomChoice(skills.filter(s => s !== skill1));
              dummyFormData[
                field.id
              ] = `I have ${yearsExp} years of experience in the technology industry, specializing in ${skill1} and ${skill2}. During my career, I have successfully delivered multiple projects and gained expertise in modern development practices, including agile methodologies and cloud technologies.`;
            } else if (
              fieldLabel.includes('project') ||
              fieldLabel.includes('work')
            ) {
              const teamSize = randomNumber(3, 8);
              const frontend = randomChoice(['React', 'Angular', 'Vue.js']);
              const backend = randomChoice([
                'Node.js',
                'Python Django',
                'Java Spring',
              ]);
              dummyFormData[
                field.id
              ] = `Led a team of ${teamSize} developers to build a comprehensive web application using ${frontend} for the frontend and ${backend} for the backend. The project was completed successfully within the planned timeline and received excellent feedback from stakeholders and end users.`;
            } else {
              dummyFormData[field.id] =
                'This is a detailed response providing comprehensive information about the topic with relevant examples and insights from practical experience in the field.';
            }
            break;

          case 'paragraph':
            if (
              fieldLabel.includes('goal') ||
              fieldLabel.includes('objective') ||
              fieldLabel.includes('future')
            ) {
              const skill1 = randomChoice(skills);
              const skill2 = randomChoice(skills.filter(s => s !== skill1));
              const timeframe = randomNumber(2, 5);
              dummyFormData[
                field.id
              ] = `My professional goals include advancing my expertise in ${skill1} and ${skill2}, while taking on greater leadership responsibilities. I aim to contribute to innovative projects that create meaningful impact on users and drive business outcomes. In the next ${timeframe} years, I plan to expand my knowledge in emerging technologies, lead cross-functional teams, and mentor junior developers to help them grow in their careers.`;
            } else if (
              fieldLabel.includes('challenge') ||
              fieldLabel.includes('problem')
            ) {
              const solution = randomChoice([
                'caching strategies',
                'database optimization',
                'load balancing',
                'microservices architecture',
              ]);
              const improvement = randomNumber(40, 80);
              dummyFormData[
                field.id
              ] = `One of the most challenging projects I worked on involved optimizing system performance under high load conditions. The solution required implementing ${solution} and collaborating closely with the infrastructure and DevOps teams. Through systematic analysis and iterative improvements, we achieved a ${improvement}% performance improvement and significantly enhanced user experience across all platforms.`;
            } else {
              dummyFormData[field.id] =
                'This comprehensive response covers multiple aspects of the topic, providing detailed insights, practical examples, and thoughtful analysis based on extensive experience and knowledge in the field. The approach includes both technical and strategic considerations.';
            }
            break;

          case 'dropdown':
          case 'singleChoice':
            if (field.options && field.options.length > 0) {
              const randomOption = randomChoice(field.options);
              dummyFormData[field.id] = randomOption.value;
            } else {
              dummyFormData[field.id] = 'option1';
            }
            break;

          case 'multipleChoice':
            if (field.options && field.options.length > 0) {
              const numSelections = randomNumber(
                1,
                Math.min(3, field.options.length)
              );
              const selectedOptions = [];
              const availableOptions = [...field.options];

              for (let i = 0; i < numSelections; i++) {
                const randomIndex = randomNumber(
                  0,
                  availableOptions.length - 1
                );
                selectedOptions.push(availableOptions[randomIndex].value);
                availableOptions.splice(randomIndex, 1);
              }
              dummyFormData[field.id] = selectedOptions;
            } else {
              dummyFormData[field.id] = ['option1', 'option2'];
            }
            break;

          case 'number':
            let numberValue: number;

            if (field.min !== undefined && field.max !== undefined) {
              numberValue = randomNumber(field.min, field.max);
            } else if (field.min !== undefined) {
              const maxValue = field.min < 1950 ? 2024 : field.min + 100;
              numberValue = randomNumber(field.min, maxValue);
            } else if (field.max !== undefined) {
              const minValue =
                field.max > 2024 ? 1950 : Math.max(1, field.max - 100);
              numberValue = randomNumber(minValue, field.max);
            } else {
              if (
                fieldLabel.includes('year') &&
                (fieldLabel.includes('passing') ||
                  fieldLabel.includes('graduation'))
              ) {
                numberValue = randomNumber(1950, new Date().getFullYear());
              } else if (
                fieldLabel.includes('year') &&
                (fieldLabel.includes('birth') || fieldLabel.includes('born'))
              ) {
                numberValue = randomNumber(1950, 2002);
              } else if (
                fieldLabel.includes('year') &&
                fieldLabel.includes('experience')
              ) {
                numberValue = randomNumber(1, 15);
              } else if (fieldLabel.includes('age')) {
                numberValue = randomNumber(22, 65);
              } else if (
                fieldLabel.includes('salary') ||
                fieldLabel.includes('package')
              ) {
                numberValue = randomNumber(300000, 2500000);
              } else if (
                fieldLabel.includes('rating') ||
                fieldLabel.includes('score')
              ) {
                numberValue = randomNumber(1, 10);
              } else if (
                fieldLabel.includes('percentage') ||
                fieldLabel.includes('marks')
              ) {
                numberValue = randomNumber(60, 95);
              } else if (
                fieldLabel.includes('pin') ||
                fieldLabel.includes('zip')
              ) {
                numberValue = randomNumber(100000, 999999);
              } else {
                numberValue = randomNumber(1, 100);
              }
            }
            dummyFormData[field.id] = numberValue.toString();
            break;

          case 'time':
            dummyFormData[field.id] = generateValidTime();
            break;

          case 'image':
            //  SAFE IMAGE HANDLING
            const imageType = fieldLabel.includes('profile')
              ? 'profile'
              : fieldLabel.includes('document')
              ? 'document'
              : 'general';

            if (field.multiple) {
              const numImages = randomNumber(2, 3);
              dummyFileData[field.id] = Array.from(
                { length: numImages },
                (_, i) => ({
                  originalName: `sample_image_${i + 1}.jpg`,
                  fileName: `sample_image_${Date.now() + i}.jpg`,
                  url: generateSafeImagePlaceholder(imageType),
                  publicId: `form-submissions/images/sample_${Date.now() + i}`,
                  size: randomNumber(150000, 500000),
                  mimeType: 'image/jpeg',
                  uploadedAt: new Date().toISOString(),
                })
              );
            } else {
              dummyFileData[field.id] = {
                originalName: 'sample_image.jpg',
                fileName: `sample_image_${Date.now()}.jpg`,
                url: generateSafeImagePlaceholder(imageType),
                publicId: `form-submissions/images/sample_${Date.now()}`,
                size: randomNumber(200000, 400000),
                mimeType: 'image/jpeg',
                uploadedAt: new Date().toISOString(),
              };
            }
            break;

          case 'fileUpload':
            //  SAFE FILE HANDLING
            const sampleFiles = [
              { name: 'resume.pdf', type: 'application/pdf' },
              { name: 'cover_letter.pdf', type: 'application/pdf' },
              { name: 'portfolio.pdf', type: 'application/pdf' },
              { name: 'certificates.pdf', type: 'application/pdf' },
              {
                name: 'project_report.docx',
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              },
              {
                name: 'data_analysis.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
            ];

            if (field.multiple) {
              const numFiles = randomNumber(2, 4);
              dummyFileData[field.id] = Array.from(
                { length: numFiles },
                (_, i) => {
                  const sample = sampleFiles[i % sampleFiles.length];
                  return generateSafeFileData(
                    `${sample.name.split('.')[0]}_${i + 1}.${sample.name
                      .split('.')
                      .pop()}`,
                    sample.type
                  );
                }
              );
            } else {
              const sample = randomChoice(sampleFiles);
              dummyFileData[field.id] = generateSafeFileData(
                sample.name,
                sample.type
              );
            }
            break;

          default:
            dummyFormData[field.id] = `Sample ${field.label || 'response'}`;
        }
      });
    });

    console.log('🎯 Generated safe dummy data:', {
      dataFields: Object.keys(dummyFormData).length,
      fileFields: Object.keys(dummyFileData).length,
      totalFiles: Object.values(dummyFileData).reduce(
        (total: number, files: any) => {
          if (Array.isArray(files)) return total + files.length;
          return total + (files ? 1 : 0);
        },
        0
      ),
    });

    return { dummyFormData, dummyFileData };
  };

  const handleFillForm = () => {
    const { dummyFormData, dummyFileData } = generateDummyData();
    setFormData(dummyFormData);
    setFileData(dummyFileData);
    setErrors({});

    const totalFiles = Object.values(dummyFileData).reduce(
      (total: number, files: any) => {
        if (Array.isArray(files)) return total + files.length;
        return total + (files ? 1 : 0);
      },
      0
    );

    toast.success('Form filled with sample data', {
      description: `Filled ${
        Object.keys(dummyFormData).length
      } fields and ${totalFiles} files with realistic data`,
    });
  };

  const validateField = (field: any, value: any, files?: any): string => {
    if (field.type === 'heading') return '';

    // Required field validation
    if (field.required) {
      // For file/image fields, check if files were uploaded
      if (field.type === 'fileUpload' || field.type === 'image') {
        const hasFiles =
          files && (Array.isArray(files) ? files.length > 0 : !!files);
        if (!hasFiles) {
          return `${field.label} is required`;
        }
      } else {
        // For other fields, check regular value
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return `${field.label} is required`;
        }

        if (field.type === 'fullName') {
          if (typeof value === 'object') {
            if (!value.firstName || !value.lastName) {
              return 'Both first and last name are required';
            }
          } else if (typeof value === 'string' && value.trim().length < 2) {
            return 'Full name must be at least 2 characters';
          }
        }

        if (field.type === 'address') {
          if (typeof value === 'object') {
            if (!value.street || !value.city || !value.state) {
              return 'Street address, city, and state are required';
            }
          }
        }

        if (field.type === 'appointment') {
          if (typeof value === 'object') {
            if (!value.date || !value.time) {
              return 'Both date and time are required';
            }
          }
        }

        if (field.type === 'productList') {
          if (!Array.isArray(value) || value.length === 0) {
            return 'Please select at least one product';
          }
        }

        if (field.type === 'multipleChoice') {
          if (!Array.isArray(value) || value.length === 0) {
            return 'Please select at least one option';
          }
        }
      }
    }

    if (!value && !files) return '';

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'phone':
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          return 'Please enter a valid 10-digit phone number';
        }
        if (!['6', '7', '8', '9'].includes(cleanPhone[0])) {
          return 'Phone number must start with 6, 7, 8, or 9';
        }
        break;

      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return 'Please enter a valid number';
        }
        if (field.min !== undefined && numValue < field.min) {
          return `Value must be at least ${field.min}`;
        }
        if (field.max !== undefined && numValue > field.max) {
          return `Value must not exceed ${field.max}`;
        }
        break;

      case 'datePicker':
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          return 'Please enter a valid date';
        }
        break;

      case 'time':
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) {
          return 'Please enter a valid time (HH:MM)';
        }
        break;

      case 'image':
        if (files) {
          const fileArray = Array.isArray(files) ? files : [files];
          for (const file of fileArray) {
            if (!file.mimeType?.startsWith('image/')) {
              return 'Only image files are allowed';
            }
            if (file.size > 10 * 1024 * 1024) {
              return 'Image files must be smaller than 10MB';
            }
          }
          if (!field.multiple && fileArray.length > 1) {
            return 'Only one image is allowed';
          }
        }
        break;

      case 'fileUpload':
        if (files) {
          const fileArray = Array.isArray(files) ? files : [files];
          for (const file of fileArray) {
            if (file.size > 25 * 1024 * 1024) {
              return 'Files must be smaller than 25MB';
            }

            // FIXED: Better accept validation that matches frontend
            if (
              field.accept &&
              field.accept !== '*/*' &&
              field.accept !== '*'
            ) {
              const allowedTypes = field.accept
                .split(',')
                .map((type: string) => type.trim());

              const isTypeAllowed = allowedTypes.some((type: string) => {
                // Handle wildcard MIME types
                if (type.endsWith('/*')) {
                  const baseType = type.slice(0, -2);
                  return file.mimeType?.toLowerCase().startsWith(baseType);
                }
                // Handle file extensions
                if (type.startsWith('.')) {
                  return file.originalName
                    ?.toLowerCase()
                    .endsWith(type.toLowerCase());
                }
                // Handle exact MIME types
                return file.mimeType?.toLowerCase() === type.toLowerCase();
              });

              if (!isTypeAllowed) {
                return `File "${file.originalName}" is not an allowed file type. Accepted: ${field.accept}`;
              }
            }
          }
          if (!field.multiple && fileArray.length > 1) {
            return 'Only one file is allowed';
          }
        }
        break;

      case 'signature':
        if (typeof value === 'string' && value.trim().length < 3) {
          return 'Please provide a valid signature';
        }
        break;

      case 'fillBlank':
        if (typeof value === 'string' && value.trim().length < 1) {
          return 'Please fill in the blank';
        }
        break;

      case 'productList':
        if (Array.isArray(value)) {
          for (const product of value) {
            if (
              !product.id ||
              !product.name ||
              typeof product.quantity !== 'number' ||
              product.quantity < 1
            ) {
              return 'Invalid product selection';
            }
          }
        }
        break;

      case 'shortText':
      case 'longText':
      case 'paragraph':
        if (field.minLength && value.length < field.minLength) {
          return `Minimum ${field.minLength} characters required`;
        }
        if (field.maxLength && value.length > field.maxLength) {
          return `Maximum ${field.maxLength} characters allowed`;
        }
        break;
    }

    return '';
  };

  const handleSubmit = async () => {
    // Validate all pages before submission
    let isValid = true;
    const allErrors: Record<string, string> = {};

    if (!form?.pages) {
      toast.error('Form data is not available');
      return;
    }

    form.pages.forEach(page => {
      page.fields?.forEach(field => {
        const value = formData[field.id];
        const files = fileData[field.id];
        const error = validateField(field, value, files);
        if (error) {
          allErrors[field.id] = error;
          isValid = false;
        }
      });
    });

    setErrors(allErrors);

    if (!isValid) {
      toast.error(
        'Please check all pages for required fields and validation errors'
      );
      // Navigate to first page with errors
      for (let i = 0; i < form.pages.length; i++) {
        const pageHasError = form.pages[i].fields?.some(
          (field: any) => allErrors[field.id]
        );
        if (pageHasError) {
          setCurrentPageIndex(i);
          break;
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(' Submitting form with enhanced field types:', {
        formId,
        dataKeys: Object.keys(formData),
        fileKeys: Object.keys(fileData),
        totalFields: Object.keys(formData).length,
        totalFiles: Object.values(fileData).reduce(
          (total: number, files: any) => {
            if (Array.isArray(files)) return total + files.length;
            return total + (files ? 1 : 0);
          },
          0
        ),
        hasSignature: Object.keys(formData).some(key =>
          form.pages.some((page: any) =>
            page.fields?.some(
              (field: any) => field.id === key && field.type === 'signature'
            )
          )
        ),
        hasProductList: Object.keys(formData).some(key =>
          form.pages.some((page: any) =>
            page.fields?.some(
              (field: any) => field.id === key && field.type === 'productList'
            )
          )
        ),
        hasFillBlank: Object.keys(formData).some(key =>
          form.pages.some((page: any) =>
            page.fields?.some(
              (field: any) => field.id === key && field.type === 'fillBlank'
            )
          )
        ),
      });

      // Prepare file data for submission
      const preparedFileData = prepareFileDataForSubmission(fileData);

      // Submit form with both regular data and file data
      const result = await submitForm(formId, formData, preparedFileData);

      console.log(' Form submission successful with enhanced fields:', result);

      setIsSubmitted(true);
      setSubmissionId(result.data.submissionId);

      toast.success('Form submitted successfully!', {
        description: `${
          result.data.message || 'Your response has been recorded'
        }${
          result.data.fileCount
            ? ` (${result.data.fileCount} files uploaded)`
            : ''
        }`,
      });

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({});
        setFileData({});
        setCurrentPageIndex(0);
        setErrors({});
      }, 100);
    } catch (error: any) {
      // console.error('❌ Form submission failed:', error);
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeviceChange = (device: DeviceType) => {
    setSelectedDevice(device);
  };

  const getDeviceStyles = () => {
    switch (selectedDevice) {
      case 'phone':
        return {
          width: '375px',
          height: '667px',
          className:
            'mx-auto border-8 border-gray-800 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden mt-7',
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          className:
            'mx-auto border-4 border-gray-600 rounded-2xl bg-white shadow-2xl overflow-hidden mt-7',
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          className:
            'w-full h-full bg-white shadow-lg rounded-lg overflow-hidden mt-7',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  //  SUCCESS STATE with enhanced animations
  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-gray-100 flex flex-col'>
        <PreviewHeader
          shareableLink={shareableLink}
          onFillForm={handleFillForm}
          selectedDevice={selectedDevice}
          onDeviceChange={handleDeviceChange}
          formId={formId}
        />

        <div className='flex-1 flex items-center justify-center p-8'>
          <div
            className={deviceStyles.className}
            style={{
              width: deviceStyles.width,
              height:
                selectedDevice !== 'desktop' ? deviceStyles.height : 'auto',
              maxHeight:
                selectedDevice !== 'desktop' ? deviceStyles.height : 'none',
            }}
          >
            <div className='p-8 flex items-center justify-center h-full'>
              <motion.div
                className='text-center max-w-md mx-auto'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <svg
                    className='w-12 h-12 text-green-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </motion.div>

                <motion.h1
                  className='text-3xl font-bold text-gray-900 mb-4'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Thank You!
                </motion.h1>

                <motion.p
                  className='text-gray-600 mb-6'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {form?.settings?.thankyouMessage ||
                    'Your submission has been received successfully.'}
                </motion.p>

                {submissionId && (
                  <motion.div
                    className='bg-gray-50 rounded-lg p-4 mb-6'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className='text-sm text-gray-600'>Submission ID:</p>
                    <p className='font-mono text-sm text-gray-800'>
                      {submissionId}
                    </p>
                  </motion.div>
                )}

                <motion.div
                  className='space-y-3'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmissionId('');
                      setFormData({});
                      setFileData({});
                      setCurrentPageIndex(0);
                      setErrors({});
                    }}
                    className='w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md transition-colors font-medium'
                  >
                    Submit Another Response
                  </button>

                  <button
                    onClick={() => window.open(shareableLink, '_blank')}
                    className='w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-md transition-colors font-medium'
                  >
                    Open Form in New Tab
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  MAIN PREVIEW INTERFACE
  return (
    <div className='min-h-screen bg-[#F3F3FE] flex flex-col'>
      <PreviewHeader
        shareableLink={shareableLink}
        onFillForm={handleFillForm}
        selectedDevice={selectedDevice}
        onDeviceChange={handleDeviceChange}
        formId={formId}
      />

      <div className='flex-1 flex items-center justify-center p-8'>
        <div
          className={deviceStyles.className}
          style={{
            width: deviceStyles.width,
            height: selectedDevice !== 'desktop' ? deviceStyles.height : 'auto',
            maxHeight:
              selectedDevice !== 'desktop' ? deviceStyles.height : 'none',
          }}
        >
          <div className='h-full overflow-y-auto'>
            <PreviewFormWithFileSupport
              form={formWithId} // Pass form with proper ID
              formData={formData}
              setFormData={setFormData}
              fileData={fileData}
              setFileData={setFileData}
              currentPageIndex={currentPageIndex}
              setCurrentPageIndex={setCurrentPageIndex}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errors={errors}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

//  WRAPPER COMPONENT for file support
function PreviewFormWithFileSupport({
  form,
  formData,
  setFormData,
  fileData,
  setFileData,
  currentPageIndex,
  setCurrentPageIndex,
  onSubmit,
  isSubmitting,
  errors,
}: {
  form: any;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  fileData: Record<string, any>;
  setFileData: (data: Record<string, any>) => void;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: Record<string, string>;
}) {
  return (
    <PreviewForm
      form={form}
      formData={formData}
      setFormData={setFormData}
      fileData={fileData}
      setFileData={setFileData}
      currentPageIndex={currentPageIndex}
      setCurrentPageIndex={setCurrentPageIndex}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      errors={errors}
    />
  );
}
