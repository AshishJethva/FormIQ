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

  if (!form) {
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

  // Generate comprehensive dummy data for all field types including files
  // Enhanced generateDummyData function that passes backend validation
  const generateDummyData = () => {
    const dummyFormData: Record<string, any> = {};
    const dummyFileData: Record<string, any> = {};

    // ✅ BACKEND-COMPLIANT: Realistic data pools that pass validation
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
      ],
    };

    // ✅ BACKEND VALIDATION: Valid email addresses that pass regex
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
    ];

    // ✅ BACKEND VALIDATION: 10-digit Indian phone numbers starting with valid digits
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
    ];

    // ✅ BACKEND COMPLIANT: Complete address objects with all required fields
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
    ];

    // Professional context data
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
    ];

    // ✅ BACKEND COMPLIANT: Helper functions for realistic data generation
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

    // ✅ BACKEND VALIDATION: Generate valid date strings in YYYY-MM-DD format
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // ✅ BACKEND VALIDATION: Generate valid time strings in HH:MM format
    const generateValidTime = (): string => {
      const hours = randomNumber(9, 17).toString().padStart(2, '0');
      const minutes = randomChoice(['00', '15', '30', '45']);
      return `${hours}:${minutes}`;
    };

    form.pages.forEach(page => {
      page.fields?.forEach(field => {
        // Skip heading fields as they don't collect data
        if (field.type === 'heading') return;

        // Generate realistic data based on field type and label
        const fieldLabel = field.label?.toLowerCase() || '';

        switch (field.type) {
          case 'fullName':
            // ✅ BACKEND COMPLIANT: Complete name object with both firstName and lastName
            dummyFormData[field.id] = {
              firstName: randomChoice(names.firstNames),
              lastName: randomChoice(names.lastNames),
            };
            break;

          case 'email':
            // ✅ BACKEND VALIDATION: Valid email format that passes regex
            dummyFormData[field.id] = randomChoice(emails);
            break;

          case 'phone':
            // ✅ BACKEND VALIDATION: 10-digit number starting with valid digit (6-9)
            dummyFormData[field.id] = randomChoice(phones);
            break;

          case 'address':
            // ✅ BACKEND COMPLIANT: Complete address with all required fields
            dummyFormData[field.id] = randomChoice(addresses);
            break;

          case 'datePicker':
            // ✅ BACKEND VALIDATION: Valid date format YYYY-MM-DD
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
            } else if (
              fieldLabel.includes('end') ||
              fieldLabel.includes('completion')
            ) {
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() - randomNumber(6, 60));
              dummyFormData[field.id] = formatDate(endDate);
            } else {
              const futureDate = randomDate(7, 90);
              dummyFormData[field.id] = formatDate(futureDate);
            }
            break;

          case 'appointment':
            // ✅ BACKEND COMPLIANT: Complete appointment object with valid date and time
            const appointmentDate = randomDate(3, 14);
            dummyFormData[field.id] = {
              date: formatDate(appointmentDate),
              time: generateValidTime(),
            };
            break;

          case 'signature':
            // ✅ BACKEND VALIDATION: Non-empty signature string
            const signatureName = `${randomChoice(
              names.firstNames
            )} ${randomChoice(names.lastNames)}`;
            dummyFormData[field.id] = `${signatureName} Digital Signature`;
            break;

          case 'fillBlank':
            // ✅ BACKEND VALIDATION: Non-empty string
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

          case 'shortText':
            // ✅ BACKEND COMPLIANT: Context-aware realistic short text
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
            // ✅ BACKEND VALIDATION: Meaningful long text responses
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
            // ✅ BACKEND VALIDATION: Detailed paragraph responses
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
            // ✅ BACKEND VALIDATION: Valid option from dropdown
            if (field.options && field.options.length > 0) {
              const randomOption = randomChoice(field.options);
              dummyFormData[field.id] = randomOption.value;
            } else {
              dummyFormData[field.id] = 'option1';
            }
            break;

          case 'singleChoice':
            // ✅ BACKEND VALIDATION: Single valid option
            if (field.options && field.options.length > 0) {
              const randomOption = randomChoice(field.options);
              dummyFormData[field.id] = randomOption.value;
            } else {
              dummyFormData[field.id] = 'option1';
            }
            break;

          case 'multipleChoice':
            // ✅ BACKEND VALIDATION: Array of valid options
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
            // ✅ BACKEND VALIDATION: Context-aware numbers respecting field constraints
            let numberValue: number;

            // Handle field validation constraints
            if (field.min !== undefined && field.max !== undefined) {
              // Use field's min/max if specified
              numberValue = randomNumber(field.min, field.max);
            } else if (field.min !== undefined) {
              // Use field's min with reasonable max
              const maxValue = field.min < 1950 ? 2024 : field.min + 100;
              numberValue = randomNumber(field.min, maxValue);
            } else if (field.max !== undefined) {
              // Use field's max with reasonable min
              const minValue =
                field.max > 2024 ? 1950 : Math.max(1, field.max - 100);
              numberValue = randomNumber(minValue, field.max);
            } else {
              // Smart defaults based on field context
              if (
                fieldLabel.includes('year') &&
                (fieldLabel.includes('passing') ||
                  fieldLabel.includes('graduation') ||
                  fieldLabel.includes('completion'))
              ) {
                // Education years: 1950 to current year
                numberValue = randomNumber(1950, new Date().getFullYear());
              } else if (
                fieldLabel.includes('year') &&
                (fieldLabel.includes('birth') || fieldLabel.includes('born'))
              ) {
                // Birth years: 1950 to 2002 (for 22+ age)
                numberValue = randomNumber(1950, 2002);
              } else if (
                fieldLabel.includes('year') &&
                fieldLabel.includes('experience')
              ) {
                // Years of experience: 1-15
                numberValue = randomNumber(1, 15);
              } else if (
                fieldLabel.includes('year') &&
                fieldLabel.includes('established')
              ) {
                // Company established year: 1900 to current year
                numberValue = randomNumber(1900, new Date().getFullYear());
              } else if (fieldLabel.includes('age')) {
                // Age: 22-65 years
                numberValue = randomNumber(22, 65);
              } else if (
                fieldLabel.includes('salary') ||
                fieldLabel.includes('package') ||
                fieldLabel.includes('ctc')
              ) {
                // Salary in INR: 3-25 lakhs
                numberValue = randomNumber(300000, 2500000);
              } else if (
                fieldLabel.includes('rating') ||
                fieldLabel.includes('score')
              ) {
                // Ratings: 1-10
                numberValue = randomNumber(1, 10);
              } else if (
                fieldLabel.includes('percentage') ||
                fieldLabel.includes('marks') ||
                fieldLabel.includes('grade')
              ) {
                // Academic percentage: 60-95%
                numberValue = randomNumber(60, 95);
              } else if (
                fieldLabel.includes('quantity') ||
                fieldLabel.includes('count')
              ) {
                // Quantities: 1-100
                numberValue = randomNumber(1, 100);
              } else if (
                fieldLabel.includes('price') ||
                fieldLabel.includes('cost') ||
                fieldLabel.includes('amount')
              ) {
                // Prices: 1000-50000
                numberValue = randomNumber(1000, 50000);
              } else if (
                fieldLabel.includes('pin') ||
                fieldLabel.includes('zip') ||
                fieldLabel.includes('postal')
              ) {
                // PIN codes: 6-digit numbers
                numberValue = randomNumber(100000, 999999);
              } else if (
                fieldLabel.includes('employee') &&
                fieldLabel.includes('id')
              ) {
                // Employee IDs: 4-6 digit numbers
                numberValue = randomNumber(1000, 999999);
              } else {
                // Default range
                numberValue = randomNumber(1, 100);
              }
            }

            dummyFormData[field.id] = numberValue.toString();
            break;

          case 'time':
            // ✅ BACKEND VALIDATION: Valid time format HH:MM
            dummyFormData[field.id] = generateValidTime();
            break;

          case 'image':
            // ✅ BACKEND COMPLIANT: Proper image file objects with all required fields
            const sampleImages = [
              {
                url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
                name: 'professional_headshot.jpg',
              },
              {
                url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
                name: 'team_photo.jpg',
              },
              {
                url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
                name: 'workplace_image.jpg',
              },
            ];

            if (field.multiple) {
              const numImages = randomNumber(2, 3);
              dummyFileData[field.id] = Array.from(
                { length: numImages },
                (_, i) => {
                  const sample = sampleImages[i % sampleImages.length];
                  const timestamp = Date.now() + i;
                  return {
                    originalName: `${sample.name.split('.')[0]}_${i + 1}.jpg`,
                    fileName: `${sample.name.split('.')[0]}_${timestamp}.jpg`,
                    url: sample.url,
                    publicId: `form-submissions/images/${
                      sample.name.split('.')[0]
                    }_${timestamp}`,
                    size: randomNumber(150000, 500000),
                    mimeType: 'image/jpeg',
                    uploadedAt: new Date().toISOString(),
                  };
                }
              );
            } else {
              const sample = randomChoice(sampleImages);
              const timestamp = Date.now();
              dummyFileData[field.id] = {
                originalName: sample.name,
                fileName: `${sample.name.split('.')[0]}_${timestamp}.jpg`,
                url: sample.url,
                publicId: `form-submissions/images/${
                  sample.name.split('.')[0]
                }_${timestamp}`,
                size: randomNumber(200000, 400000),
                mimeType: 'image/jpeg',
                uploadedAt: new Date().toISOString(),
              };
            }
            break;

          case 'fileUpload':
            // ✅ BACKEND COMPLIANT: Proper file objects with all required fields
            const sampleFiles = [
              {
                name: 'resume.pdf',
                type: 'application/pdf',
                size: [800000, 2000000],
              },
              {
                name: 'cover_letter.pdf',
                type: 'application/pdf',
                size: [300000, 800000],
              },
              {
                name: 'portfolio.pdf',
                type: 'application/pdf',
                size: [2000000, 5000000],
              },
              {
                name: 'certificates.pdf',
                type: 'application/pdf',
                size: [500000, 1500000],
              },
              {
                name: 'project_report.docx',
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: [400000, 1200000],
              },
              {
                name: 'data_analysis.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                size: [300000, 900000],
              },
            ];

            if (field.multiple) {
              const numFiles = randomNumber(2, 4);
              dummyFileData[field.id] = Array.from(
                { length: numFiles },
                (_, i) => {
                  const sample = sampleFiles[i % sampleFiles.length];
                  const timestamp = Date.now() + i;
                  const nameParts = sample.name.split('.');
                  return {
                    originalName: sample.name,
                    fileName: `${nameParts[0]}_${timestamp}.${nameParts[1]}`,
                    url: `https://res.cloudinary.com/demo/raw/upload/v1/${nameParts[0]}_${timestamp}.${nameParts[1]}`,
                    publicId: `form-submissions/files/${nameParts[0]}_${timestamp}`,
                    size: randomNumber(sample.size[0], sample.size[1]),
                    mimeType: sample.type,
                    uploadedAt: new Date().toISOString(),
                  };
                }
              );
            } else {
              const sample = randomChoice(sampleFiles);
              const timestamp = Date.now();
              const nameParts = sample.name.split('.');
              dummyFileData[field.id] = {
                originalName: sample.name,
                fileName: `${nameParts[0]}_${timestamp}.${nameParts[1]}`,
                url: `https://res.cloudinary.com/demo/raw/upload/v1/${nameParts[0]}_${timestamp}.${nameParts[1]}`,
                publicId: `form-submissions/files/${nameParts[0]}_${timestamp}`,
                size: randomNumber(sample.size[0], sample.size[1]),
                mimeType: sample.type,
                uploadedAt: new Date().toISOString(),
              };
            }
            break;

          default:
            // ✅ BACKEND SAFE: Fallback for any other field types
            dummyFormData[field.id] = `Sample ${field.label || 'response'}`;
        }
      });
    });

    // ✅ BACKEND VALIDATION: Ensure data structure matches expected format
    console.log('🎯 Generated dummy data for backend submission:', {
      dataFields: Object.keys(dummyFormData).length,
      fileFields: Object.keys(dummyFileData).length,
      sampleData: Object.keys(dummyFormData)
        .slice(0, 3)
        .reduce((acc, key) => {
          acc[key] = dummyFormData[key];
          return acc;
        }, {} as Record<string, any>),
      fileStructure: Object.keys(dummyFileData).map(key => ({
        fieldId: key,
        fileCount: Array.isArray(dummyFileData[key])
          ? dummyFileData[key].length
          : 1,
      })),
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

  // Enhanced validation function with file support
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

        // Complex field validations
        if (field.type === 'fullName' && typeof value === 'object') {
          if (!value.firstName || !value.lastName) {
            return 'Both first and last name are required';
          }
        }

        if (field.type === 'address' && typeof value === 'object') {
          if (!value.street || !value.city || !value.state) {
            return 'Street address, city, and state are required';
          }
        }

        if (field.type === 'appointment' && typeof value === 'object') {
          if (!value.date || !value.time) {
            return 'Both date and time are required';
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
          return 'Please enter a valid 10-digit Indian phone number';
        }
        break;

      // ✅ NEW: File validation
      case 'image':
        if (files) {
          const fileArray = Array.isArray(files) ? files : [files];
          for (const file of fileArray) {
            if (!file.mimeType?.startsWith('image/')) {
              return 'Only image files are allowed';
            }
            if (file.size > 10 * 1024 * 1024) {
              // 10MB
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
              // 25MB
              return 'Files must be smaller than 25MB';
            }
          }
          if (!field.multiple && fileArray.length > 1) {
            return 'Only one file is allowed';
          }
        }
        break;
    }

    return '';
  };

  const handleSubmit = async () => {
    // Validate all pages before submission
    let isValid = true;
    const allErrors: Record<string, string> = {};

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
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Submitting form with files from preview:', {
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
      });

      // Prepare file data for submission
      const preparedFileData = prepareFileDataForSubmission(fileData);

      // Submit form with both regular data and file data
      const result = await submitForm(formId, formData, preparedFileData);

      console.log(
        '✅ Form submission with files successful from preview:',
        result
      );

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
            'mx-auto border-8 border-gray-800 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden',
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          className:
            'mx-auto border-4 border-gray-600 rounded-2xl bg-white shadow-2xl overflow-hidden',
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          className:
            'w-full h-full bg-white shadow-lg rounded-lg overflow-hidden',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  // Success state with enhanced animations
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
                  {form.settings?.thankyouMessage ||
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
              form={form}
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
