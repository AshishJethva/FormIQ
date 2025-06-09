// // src/components/modals/FormTemplatesModal.tsx
// 'use client';

// import React, { useState } from 'react';
// import {
//   X,
//   ArrowLeft,
//   Loader2,
//   Star,
//   Zap,
//   Users,
//   Clock,
//   CheckCircle,
//   Sparkles,
// } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import { useDispatch } from 'react-redux';
// import { toast } from 'sonner';
// import { createFormAsync } from '@/redux/slices/dashboard/formsSlice';
// import { StoreDispatch } from '@/redux/store';
// import { motion, AnimatePresence } from 'framer-motion';

// interface Template {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   image: string;
//   fields: number;
//   preview: string;
//   structure: any;
//   popular?: boolean;
//   new?: boolean;
//   premium?: boolean;
// }

// const FORM_TEMPLATES: Template[] = [
//   {
//     id: 'appointment-request',
//     name: 'Appointment Request Form',
//     description: 'Schedule appointments with clients efficiently',
//     category: 'Business',
//     image: '/templates/appointment.png',
//     fields: 8,
//     preview: 'Perfect for medical practices, salons, consultancy services',
//     popular: true,
//     structure: {
//       title: 'Appointment Request Form',
//       description: 'Let us know how we can help you!',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'heading-1',
//               type: 'heading',
//               label: 'Personal Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Full Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'phone',
//               type: 'phone',
//               label: 'Contact Number',
//               required: true,
//               helpText: 'We may need to contact you',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'Confirmation will be sent here',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'appointment',
//               type: 'appointment',
//               label: 'Preferred Date & Time',
//               required: true,
//               helpText: 'Select your preferred appointment slot',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'service-type',
//               type: 'dropdown',
//               label: 'Service Type',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Consultation', value: 'consultation' },
//                 { label: 'Follow-up', value: 'followup' },
//                 { label: 'New Patient', value: 'new-patient' },
//               ],
//             },
//             {
//               id: 'additional-info',
//               type: 'paragraph',
//               label: 'Additional Information',
//               required: false,
//               helpText: 'Any special requirements or notes',
//               labelAlignment: 'LEFT',
//               rows: 4,
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Book Appointment',
//         thankyouMessage:
//           'Thank you! Your appointment request has been received. We will contact you soon to confirm.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: true,
//         allowMultipleEmailSubmissions: true,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
//   {
//     id: 'feedback-form',
//     name: 'Feedback Form',
//     description: 'Collect valuable feedback from your customers',
//     category: 'Survey',
//     image: '/templates/feedback.png',
//     fields: 6,
//     preview: 'Great for customer satisfaction and service improvement',
//     new: true,
//     structure: {
//       title: 'Feedback Form',
//       description:
//         'We would love to hear your thoughts, suggestions, concerns or problems with anything so we can improve!',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'feedback-type',
//               type: 'singleChoice',
//               label: 'Feedback Type',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Compliment', value: 'compliment' },
//                 { label: 'Suggestion', value: 'suggestion' },
//                 { label: 'Complaint', value: 'complaint' },
//               ],
//             },
//             {
//               id: 'rating',
//               type: 'singleChoice',
//               label: 'Overall Rating',
//               required: true,
//               helpText: 'How would you rate your experience?',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: '⭐⭐⭐⭐⭐ Excellent', value: '5' },
//                 { label: '⭐⭐⭐⭐ Good', value: '4' },
//                 { label: '⭐⭐⭐ Average', value: '3' },
//                 { label: '⭐⭐ Poor', value: '2' },
//                 { label: '⭐ Very Poor', value: '1' },
//               ],
//             },
//             {
//               id: 'feedback-text',
//               type: 'paragraph',
//               label: 'Describe Your Feedback',
//               required: true,
//               helpText: 'Please provide detailed feedback',
//               labelAlignment: 'LEFT',
//               rows: 5,
//             },
//             {
//               id: 'name',
//               type: 'shortText',
//               label: 'Name',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//               placeholder: 'Your name',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email',
//               required: false,
//               helpText: 'Optional - for follow-up if needed',
//               labelAlignment: 'LEFT',
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Submit Feedback',
//         thankyouMessage:
//           'Thank you for your valuable feedback! We appreciate your input.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: true,
//         allowMultipleEmailSubmissions: true,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
//   {
//     id: 'information-request',
//     name: 'Information Request Form',
//     description: 'Handle inquiries and information requests professionally',
//     category: 'Business',
//     image: '/templates/information.png',
//     fields: 7,
//     preview: 'Perfect for lead generation and customer inquiries',
//     structure: {
//       title: 'Information Request',
//       description: 'Get in touch with us for more information',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'heading-1',
//               type: 'heading',
//               label: 'Contact Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email',
//               required: true,
//               helpText: 'We will respond to this email address',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'phone',
//               type: 'phone',
//               label: 'Phone Number',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'company',
//               type: 'shortText',
//               label: 'Company/Organization',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//               placeholder: 'Company name',
//             },
//             {
//               id: 'inquiry-type',
//               type: 'dropdown',
//               label: 'Type of Inquiry',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'General Information', value: 'general' },
//                 { label: 'Product Demo', value: 'demo' },
//                 { label: 'Pricing', value: 'pricing' },
//                 { label: 'Partnership', value: 'partnership' },
//                 { label: 'Support', value: 'support' },
//               ],
//             },
//             {
//               id: 'message',
//               type: 'paragraph',
//               label: 'Requesting Information Regarding',
//               required: true,
//               helpText: 'Please provide details about your inquiry',
//               labelAlignment: 'LEFT',
//               rows: 4,
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Send Request',
//         thankyouMessage:
//           'Thank you for your inquiry! We will get back to you within 24 hours.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: true,
//         allowMultipleEmailSubmissions: true,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
//   {
//     id: 'customer-registration',
//     name: 'Customer Registration Form',
//     description: 'Streamline new customer onboarding process',
//     category: 'Registration',
//     image: '/templates/registration.png',
//     fields: 8,
//     preview: 'Ideal for membership signups and customer accounts',
//     popular: true,
//     structure: {
//       title: 'New Customer Registration Form',
//       description: 'Join our community today!',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'heading-1',
//               type: 'heading',
//               label: 'Customer Details',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Full Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'This will be your login email',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'phone',
//               type: 'phone',
//               label: 'Phone Number',
//               required: true,
//               helpText: 'For account verification',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'address',
//               type: 'address',
//               label: 'Address',
//               required: true,
//               helpText: 'Complete address for delivery/billing',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'date-of-birth',
//               type: 'datePicker',
//               label: 'Date of Birth',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'preferences',
//               type: 'multipleChoice',
//               label: 'Communication Preferences',
//               required: false,
//               helpText: 'How would you like to hear from us?',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Email Newsletter', value: 'newsletter' },
//                 { label: 'SMS Updates', value: 'sms' },
//                 { label: 'Promotional Offers', value: 'promotions' },
//               ],
//             },
//             {
//               id: 'terms',
//               type: 'singleChoice',
//               label: 'Terms and Conditions',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 {
//                   label: 'I agree to the Terms and Conditions',
//                   value: 'agree',
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Register',
//         thankyouMessage:
//           'Welcome! Your registration was successful. Check your email for confirmation.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: false,
//         allowMultipleEmailSubmissions: false,
//         collectIpAddress: true,
//         enableCaptcha: true,
//       },
//     },
//   },
//   {
//     id: 'product-order',
//     name: 'Product Order Form',
//     description: 'Enable customers to place orders easily',
//     category: 'E-commerce',
//     image: '/templates/order.png',
//     fields: 6,
//     preview: 'Perfect for online stores and product catalogs',
//     premium: true,
//     structure: {
//       title: 'Product Order Form',
//       description: 'Place your order easily with our simple form',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'heading-1',
//               type: 'heading',
//               label: 'Select Products',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'products',
//               type: 'productList',
//               label: 'Choose Your Products',
//               required: true,
//               helpText: 'Select products and quantities',
//               labelAlignment: 'LEFT',
//               productListConfig: {
//                 products: [
//                   {
//                     id: '1',
//                     name: 'Premium T-Shirt',
//                     price: 29.99,
//                     quantity: 1,
//                   },
//                   { id: '2', name: 'Classic Jeans', price: 59.99, quantity: 1 },
//                   { id: '3', name: 'Running Shoes', price: 89.99, quantity: 1 },
//                 ],
//               },
//             },
//             {
//               id: 'customer-info',
//               type: 'heading',
//               label: 'Customer Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'customer-name',
//               type: 'fullName',
//               label: 'Full Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'shipping-address',
//               type: 'address',
//               label: 'Shipping Address',
//               required: true,
//               helpText: 'Where should we deliver your order?',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'special-instructions',
//               type: 'paragraph',
//               label: 'Special Instructions',
//               required: false,
//               helpText: 'Any special delivery instructions',
//               labelAlignment: 'LEFT',
//               rows: 3,
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Place Order',
//         thankyouMessage:
//           'Order received! We will process your order and contact you with shipping details.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: true,
//         allowMultipleEmailSubmissions: true,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
//   {
//     id: 'course-registration',
//     name: 'Course Registration Form',
//     description: 'Manage course enrollments efficiently',
//     category: 'Education',
//     image: '/templates/course.png',
//     fields: 9,
//     preview: 'Great for educational institutions and training centers',
//     structure: {
//       title: 'Course Registration Form',
//       description: 'Enroll in your preferred course today',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'heading-1',
//               type: 'heading',
//               label: 'Student Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'student-name',
//               type: 'fullName',
//               label: 'Student Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'Course materials will be sent here',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'phone',
//               type: 'phone',
//               label: 'Contact Number',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'course-selection',
//               type: 'dropdown',
//               label: 'Select Course',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Web Development Bootcamp', value: 'web-dev' },
//                 { label: 'Data Science Fundamentals', value: 'data-science' },
//                 { label: 'Digital Marketing', value: 'digital-marketing' },
//                 { label: 'UI/UX Design', value: 'uiux-design' },
//               ],
//             },
//             {
//               id: 'schedule-preference',
//               type: 'singleChoice',
//               label: 'Schedule Preference',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Weekdays (Mon-Fri)', value: 'weekdays' },
//                 { label: 'Weekends (Sat-Sun)', value: 'weekends' },
//                 { label: 'Evening Classes', value: 'evening' },
//               ],
//             },
//             {
//               id: 'experience-level',
//               type: 'singleChoice',
//               label: 'Experience Level',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Beginner', value: 'beginner' },
//                 { label: 'Intermediate', value: 'intermediate' },
//                 { label: 'Advanced', value: 'advanced' },
//               ],
//             },
//             {
//               id: 'goals',
//               type: 'paragraph',
//               label: 'Learning Goals',
//               required: false,
//               helpText: 'What do you hope to achieve from this course?',
//               labelAlignment: 'LEFT',
//               rows: 4,
//             },
//             {
//               id: 'emergency-contact',
//               type: 'shortText',
//               label: 'Emergency Contact',
//               required: false,
//               helpText: 'Name and phone number',
//               labelAlignment: 'LEFT',
//               placeholder: 'Name, Phone',
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Register for Course',
//         thankyouMessage:
//           'Registration successful! You will receive course details and payment instructions soon.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: false,
//         allowMultipleEmailSubmissions: false,
//         collectIpAddress: true,
//         enableCaptcha: true,
//       },
//     },
//   },
//   {
//     id: 'event-registration',
//     name: 'Event Registration Form',
//     description: 'Manage event attendee registrations',
//     category: 'Events',
//     image: '/templates/event.png',
//     fields: 8,
//     preview: 'Perfect for conferences, workshops, and social events',
//     new: true,
//     structure: {
//       title: 'Event Registration Form',
//       description: 'Register for our upcoming event',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'attendee-info',
//               type: 'heading',
//               label: 'Attendee Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Full Name',
//               required: true,
//               helpText: 'As it should appear on your badge',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'Event updates will be sent here',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'organization',
//               type: 'shortText',
//               label: 'Organization/Company',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//               placeholder: 'Company name',
//             },
//             {
//               id: 'job-title',
//               type: 'shortText',
//               label: 'Job Title',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//               placeholder: 'Your job title',
//             },
//             {
//               id: 'ticket-type',
//               type: 'singleChoice',
//               label: 'Ticket Type',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Regular Ticket - $99', value: 'regular' },
//                 { label: 'Student Ticket - $49', value: 'student' },
//                 { label: 'VIP Ticket - $199', value: 'vip' },
//               ],
//             },
//             {
//               id: 'dietary-requirements',
//               type: 'multipleChoice',
//               label: 'Dietary Requirements',
//               required: false,
//               helpText: 'Select all that apply',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Vegetarian', value: 'vegetarian' },
//                 { label: 'Vegan', value: 'vegan' },
//                 { label: 'Gluten-free', value: 'gluten-free' },
//                 { label: 'No dietary restrictions', value: 'none' },
//               ],
//             },
//             {
//               id: 'special-needs',
//               type: 'paragraph',
//               label: 'Special Accommodations',
//               required: false,
//               helpText: 'Any accessibility needs or special requests',
//               labelAlignment: 'LEFT',
//               rows: 3,
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Register for Event',
//         thankyouMessage:
//           'Registration confirmed! Check your email for event details and payment instructions.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: false,
//         allowMultipleEmailSubmissions: false,
//         collectIpAddress: true,
//         enableCaptcha: true,
//       },
//     },
//   },
//   {
//     id: 'job-application',
//     name: 'Job Application Form',
//     description: 'Streamline your hiring process',
//     category: 'HR',
//     image: '/templates/job.png',
//     fields: 12,
//     preview: 'Comprehensive form for job applications and recruitment',
//     popular: true,
//     structure: {
//       title: 'Job Application Form',
//       description: 'Apply for your dream job with us',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'personal-info',
//               type: 'heading',
//               label: 'Personal Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Full Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'phone',
//               type: 'phone',
//               label: 'Phone Number',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'address',
//               type: 'address',
//               label: 'Current Address',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'position-applied',
//               type: 'dropdown',
//               label: 'Position Applied For',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Software Engineer', value: 'software-engineer' },
//                 { label: 'Product Manager', value: 'product-manager' },
//                 { label: 'UI/UX Designer', value: 'designer' },
//                 { label: 'Marketing Specialist', value: 'marketing' },
//                 { label: 'Sales Representative', value: 'sales' },
//               ],
//             },
//             {
//               id: 'experience-years',
//               type: 'dropdown',
//               label: 'Years of Experience',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Less than 1 year', value: '0-1' },
//                 { label: '1-3 years', value: '1-3' },
//                 { label: '3-5 years', value: '3-5' },
//                 { label: '5-10 years', value: '5-10' },
//                 { label: '10+ years', value: '10+' },
//               ],
//             },
//             {
//               id: 'current-salary',
//               type: 'number',
//               label: 'Current Salary (Annual)',
//               required: false,
//               helpText: 'Optional - in USD',
//               labelAlignment: 'LEFT',
//               min: 0,
//             },
//             {
//               id: 'expected-salary',
//               type: 'number',
//               label: 'Expected Salary (Annual)',
//               required: false,
//               helpText: 'Optional - in USD',
//               labelAlignment: 'LEFT',
//               min: 0,
//             },
//             {
//               id: 'availability',
//               type: 'datePicker',
//               label: 'Available Start Date',
//               required: true,
//               helpText: 'When can you start?',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'resume',
//               type: 'fileUpload',
//               label: 'Resume/CV',
//               required: true,
//               helpText: 'Upload your resume (PDF preferred)',
//               labelAlignment: 'LEFT',
//               accept: '.pdf,.doc,.docx',
//             },
//             {
//               id: 'cover-letter',
//               type: 'paragraph',
//               label: 'Cover Letter',
//               required: true,
//               helpText: 'Tell us why you are the perfect fit for this role',
//               labelAlignment: 'LEFT',
//               rows: 6,
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Submit Application',
//         thankyouMessage:
//           'Thank you for your application! We will review it and get back to you within 5 business days.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: false,
//         allowMultipleEmailSubmissions: false,
//         collectIpAddress: true,
//         enableCaptcha: true,
//       },
//     },
//   },
//   {
//     id: 'survey-form',
//     name: 'Customer Survey Form',
//     description: 'Gather insights from your customers',
//     category: 'Survey',
//     image: '/templates/survey.png',
//     fields: 10,
//     preview: 'Comprehensive survey for market research and feedback',
//     structure: {
//       title: 'Customer Survey Form',
//       description: 'Help us serve you better by sharing your thoughts',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'demographics',
//               type: 'heading',
//               label: 'About You',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'age-group',
//               type: 'singleChoice',
//               label: 'Age Group',
//               required: false,
//               helpText: 'Optional',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: '18-25', value: '18-25' },
//                 { label: '26-35', value: '26-35' },
//                 { label: '36-45', value: '36-45' },
//                 { label: '46-55', value: '46-55' },
//                 { label: '56+', value: '56+' },
//               ],
//             },
//             {
//               id: 'customer-type',
//               type: 'singleChoice',
//               label: 'Customer Type',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'First-time customer', value: 'first-time' },
//                 { label: 'Returning customer', value: 'returning' },
//                 { label: 'Long-term customer (1+ years)', value: 'long-term' },
//               ],
//             },
//             {
//               id: 'satisfaction',
//               type: 'singleChoice',
//               label: 'Overall Satisfaction',
//               required: true,
//               helpText: 'How satisfied are you with our service?',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Very Satisfied', value: 'very-satisfied' },
//                 { label: 'Satisfied', value: 'satisfied' },
//                 { label: 'Neutral', value: 'neutral' },
//                 { label: 'Dissatisfied', value: 'dissatisfied' },
//                 { label: 'Very Dissatisfied', value: 'very-dissatisfied' },
//               ],
//             },
//             {
//               id: 'service-quality',
//               type: 'singleChoice',
//               label: 'Service Quality Rating',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Excellent', value: 'excellent' },
//                 { label: 'Good', value: 'good' },
//                 { label: 'Fair', value: 'fair' },
//                 { label: 'Poor', value: 'poor' },
//               ],
//             },
//             {
//               id: 'features-used',
//               type: 'multipleChoice',
//               label: 'Features/Services Used',
//               required: false,
//               helpText: 'Select all that apply',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Customer Support', value: 'support' },
//                 { label: 'Online Platform', value: 'platform' },
//                 { label: 'Mobile App', value: 'mobile' },
//                 { label: 'In-store Service', value: 'instore' },
//                 { label: 'Delivery Service', value: 'delivery' },
//               ],
//             },
//             {
//               id: 'recommendation',
//               type: 'singleChoice',
//               label: 'Likelihood to Recommend',
//               required: true,
//               helpText: 'How likely are you to recommend us to others?',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Very Likely', value: 'very-likely' },
//                 { label: 'Likely', value: 'likely' },
//                 { label: 'Neutral', value: 'neutral' },
//                 { label: 'Unlikely', value: 'unlikely' },
//                 { label: 'Very Unlikely', value: 'very-unlikely' },
//               ],
//             },
//             {
//               id: 'improvements',
//               type: 'paragraph',
//               label: 'Suggestions for Improvement',
//               required: false,
//               helpText: 'What can we do better?',
//               labelAlignment: 'LEFT',
//               rows: 4,
//             },
//             {
//               id: 'additional-comments',
//               type: 'paragraph',
//               label: 'Additional Comments',
//               required: false,
//               helpText: 'Any other feedback you would like to share',
//               labelAlignment: 'LEFT',
//               rows: 3,
//             },
//             {
//               id: 'contact-email',
//               type: 'email',
//               label: 'Email (Optional)',
//               required: false,
//               helpText: 'For follow-up if needed',
//               labelAlignment: 'LEFT',
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Submit Survey',
//         thankyouMessage:
//           'Thank you for your valuable feedback! Your responses help us improve our services.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: false,
//         allowMultipleEmailSubmissions: false,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
//   {
//     id: 'contact-form',
//     name: 'Contact Us Form',
//     description: 'Simple contact form for general inquiries',
//     category: 'Business',
//     image: '/templates/contact.png',
//     fields: 5,
//     preview: 'Essential contact form for any website',
//     structure: {
//       title: 'Contact Us',
//       description: 'Get in touch with our team',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Your Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'We will respond to this email',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'subject',
//               type: 'shortText',
//               label: 'Subject',
//               required: true,
//               helpText: 'Brief subject of your inquiry',
//               labelAlignment: 'LEFT',
//               placeholder: 'What is this regarding?',
//             },
//             {
//               id: 'message',
//               type: 'paragraph',
//               label: 'Message',
//               required: true,
//               helpText: 'Please provide details about your inquiry',
//               labelAlignment: 'LEFT',
//               rows: 5,
//             },
//             {
//               id: 'contact-method',
//               type: 'singleChoice',
//               label: 'Preferred Contact Method',
//               required: false,
//               helpText: 'How would you like us to respond?',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Email', value: 'email' },
//                 { label: 'Phone Call', value: 'phone' },
//               ],
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Send Message',
//         thankyouMessage:
//           'Thank you for contacting us! We will get back to you within 24 hours.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: true,
//         allowMultipleEmailSubmissions: true,
//         collectIpAddress: true,
//         enableCaptcha: true,
//       },
//     },
//   },
//   {
//     id: 'newsletter-signup',
//     name: 'Newsletter Signup Form',
//     description: 'Build your email list with style',
//     category: 'Marketing',
//     image: '/templates/newsletter.png',
//     fields: 4,
//     preview: 'Simple and effective newsletter subscription form',
//     structure: {
//       title: 'Join Our Newsletter',
//       description: 'Stay updated with our latest news and offers',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'full-name',
//               type: 'fullName',
//               label: 'Your Name',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'We respect your privacy and will never spam you',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'interests',
//               type: 'multipleChoice',
//               label: 'What interests you?',
//               required: false,
//               helpText: 'Select topics you want to hear about',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Product Updates', value: 'products' },
//                 { label: 'Industry News', value: 'news' },
//                 { label: 'Tips & Tutorials', value: 'tips' },
//                 { label: 'Special Offers', value: 'offers' },
//                 { label: 'Company News', value: 'company' },
//               ],
//             },
//             {
//               id: 'frequency',
//               type: 'singleChoice',
//               label: 'Email Frequency',
//               required: false,
//               helpText: 'How often would you like to hear from us?',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Weekly', value: 'weekly' },
//                 { label: 'Bi-weekly', value: 'biweekly' },
//                 { label: 'Monthly', value: 'monthly' },
//               ],
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Subscribe',
//         thankyouMessage:
//           'Welcome to our newsletter! Check your email for a confirmation link.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: false,
//         allowMultipleEmailSubmissions: false,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
//   {
//     id: 'booking-form',
//     name: 'Hotel Booking Form',
//     description: 'Streamline hotel reservations',
//     category: 'Hospitality',
//     image: '/templates/booking.png',
//     fields: 10,
//     preview: 'Complete booking form for hotels and accommodations',
//     structure: {
//       title: 'Hotel Booking Form',
//       description: 'Reserve your perfect stay with us',
//       pages: [
//         {
//           id: 'page-1',
//           fields: [
//             {
//               id: 'guest-info',
//               type: 'heading',
//               label: 'Guest Information',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'guest-name',
//               type: 'fullName',
//               label: 'Primary Guest Name',
//               required: true,
//               helpText: 'Name on the reservation',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'email',
//               type: 'email',
//               label: 'Email Address',
//               required: true,
//               helpText: 'Booking confirmation will be sent here',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'phone',
//               type: 'phone',
//               label: 'Phone Number',
//               required: true,
//               helpText: 'For booking confirmations',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'booking-details',
//               type: 'heading',
//               label: 'Booking Details',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'check-in',
//               type: 'datePicker',
//               label: 'Check-in Date',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'check-out',
//               type: 'datePicker',
//               label: 'Check-out Date',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//             },
//             {
//               id: 'room-type',
//               type: 'dropdown',
//               label: 'Room Type',
//               required: true,
//               helpText: '',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Standard Room - $99/night', value: 'standard' },
//                 { label: 'Deluxe Room - $149/night', value: 'deluxe' },
//                 { label: 'Suite - $249/night', value: 'suite' },
//                 {
//                   label: 'Presidential Suite - $499/night',
//                   value: 'presidential',
//                 },
//               ],
//             },
//             {
//               id: 'guests',
//               type: 'number',
//               label: 'Number of Guests',
//               required: true,
//               helpText: 'Total number of guests',
//               labelAlignment: 'LEFT',
//               min: 1,
//               max: 8,
//             },
//             {
//               id: 'special-requests',
//               type: 'multipleChoice',
//               label: 'Special Requests',
//               required: false,
//               helpText: 'Select all that apply',
//               labelAlignment: 'LEFT',
//               options: [
//                 { label: 'Airport Pickup', value: 'pickup' },
//                 { label: 'Late Check-in', value: 'late-checkin' },
//                 { label: 'High Floor Room', value: 'high-floor' },
//                 { label: 'Quiet Room', value: 'quiet' },
//                 { label: 'Extra Towels', value: 'towels' },
//               ],
//             },
//             {
//               id: 'additional-notes',
//               type: 'paragraph',
//               label: 'Additional Notes',
//               required: false,
//               helpText: 'Any special requirements or requests',
//               labelAlignment: 'LEFT',
//               rows: 3,
//             },
//           ],
//         },
//       ],
//       settings: {
//         submitButtonText: 'Book Now',
//         thankyouMessage:
//           'Booking request received! We will confirm your reservation within 2 hours.',
//         defaultLabelAlignment: 'LEFT',
//         defaultRequiredField: false,
//         showLogo: true,
//         isEnabled: true,
//         allowMultipleSubmissions: true,
//         allowMultipleEmailSubmissions: true,
//         collectIpAddress: true,
//         enableCaptcha: false,
//       },
//     },
//   },
// ];

// const categoryIcons = {
//   Business: Users,
//   Survey: Star,
//   Registration: CheckCircle,
//   'E-commerce': Zap,
//   Education: Star,
//   Events: Users,
//   HR: Users,
//   Marketing: Sparkles,
//   Hospitality: Clock,
// };

// const categoryColors = {
//   Business: 'from-blue-500 to-blue-600',
//   Survey: 'from-purple-500 to-purple-600',
//   Registration: 'from-green-500 to-green-600',
//   'E-commerce': 'from-orange-500 to-orange-600',
//   Education: 'from-indigo-500 to-indigo-600',
//   Events: 'from-pink-500 to-pink-600',
//   HR: 'from-teal-500 to-teal-600',
//   Marketing: 'from-yellow-500 to-yellow-600',
//   Hospitality: 'from-red-500 to-red-600',
// };

// export default function FormTemplatesModal() {
//   const router = useRouter();
//   const dispatch: StoreDispatch = useDispatch();
//   const [isCreating, setIsCreating] = useState(false);
//   const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
//   const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

//   const handleClose = () => {
//     router.push('/dashboard');
//   };

//   const handleBack = () => {
//     router.back();
//   };

//   const generateUniqueFormName = (templateName: string) => {
//     const now = new Date();
//     const timestamp = now.toLocaleString('en-US', {
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true,
//     });
//     return `${templateName} - ${timestamp}`;
//   };

//   const handleUseTemplate = async (template: Template) => {
//     setIsCreating(true);
//     setSelectedTemplate(template.id);

//     try {
//       const uniqueName = generateUniqueFormName(template.name);

//       // Create form with template structure
//       const result = await dispatch(
//         createFormAsync({
//           name: uniqueName,
//           description: template.description,
//           template: template.structure,
//         })
//       ).unwrap();

//       const formId = result.id;
//       toast.success(`${template.name} created successfully`);

//       // Redirect to form builder with the new form
//       router.push(`/build/${formId}`);
//     } catch (error: any) {
//       console.error('Failed to create form from template:', error);
//       toast.error('Failed to create form', {
//         description: error.message || 'Please try again',
//       });
//     } finally {
//       setIsCreating(false);
//       setSelectedTemplate(null);
//     }
//   };

//   const getTemplatesByCategory = () => {
//     const categories: Record<string, Template[]> = {};
//     FORM_TEMPLATES.forEach(template => {
//       if (!categories[template.category]) {
//         categories[template.category] = [];
//       }
//       categories[template.category].push(template);
//     });
//     return categories;
//   };

//   const templatesByCategory = getTemplatesByCategory();
//   const popularTemplates = FORM_TEMPLATES.filter(t => t.popular);

//   return (
//     <div className='fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-auto z-50'>
//       <div className='min-h-screen flex flex-col'>
//         {/* Enhanced Header */}
//         <div className='relative overflow-hidden'>
//           {/* Background Pattern */}
//           <div className='absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90'></div>
//           <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30'></div>

//           <div className='relative p-6 flex items-center border-b border-white/20 backdrop-blur-xl'>
//             <button
//               onClick={handleBack}
//               disabled={isCreating}
//               className='flex items-center cursor-pointer text-white/90 hover:text-white transition-all duration-200 ml-2 px-4 py-2 rounded-xl hover:bg-white/10 backdrop-blur-sm'
//             >
//               <ArrowLeft size={20} className='mr-2' />
//               <span className='font-medium'>Back</span>
//             </button>

//             <div className='flex-grow'></div>

//             <button
//               onClick={handleClose}
//               disabled={isCreating}
//               className='p-3 mr-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm border border-white/20'
//               aria-label='Close'
//             >
//               <X size={24} className='text-white' />
//             </button>
//           </div>

//           {/* Hero Section */}
//           <div className='relative px-6 py-16 text-center text-white'>
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8 }}
//             >
//               <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6'>
//                 <Sparkles size={18} className='text-yellow-300' />
//                 <span className='text-sm font-medium'>
//                   Professional Templates
//                 </span>
//               </div>

//               <h1 className='text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
//                 Choose Your Perfect Template
//               </h1>

//               <p className='text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed'>
//                 Start with a professionally designed template and customize it
//                 to match your brand. All templates are fully responsive,
//                 accessible, and conversion-optimized.
//               </p>

//               <div className='flex flex-wrap justify-center gap-6 mt-10'>
//                 <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
//                   <CheckCircle size={18} className='text-green-300' />
//                   <span className='text-sm'>Mobile Responsive</span>
//                 </div>
//                 <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
//                   <Zap size={18} className='text-yellow-300' />
//                   <span className='text-sm'>Instant Setup</span>
//                 </div>
//                 <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
//                   <Star size={18} className='text-orange-300' />
//                   <span className='text-sm'>Professionally Designed</span>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className='flex-grow px-6 py-12'>
//           <div
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               width: '100%',
//             }}
//           >
//             <div className='max-w-7xl mx-auto w-full'>
//               {/* Popular Templates Section */}
//               {popularTemplates.length > 0 && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.6, delay: 0.2 }}
//                   className='mb-16'
//                 >
//                   {/* Popular Templates Header */}
//                   <div className='flex items-center gap-3 mb-8 justify-center'>
//                     <div className='flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg'>
//                       <Star className='w-6 h-6 text-white' />
//                     </div>
//                     <div>
//                       <h2 className='text-3xl font-bold text-gray-900'>
//                         Popular Templates
//                       </h2>
//                       <p className='text-gray-600'>Most loved by our users</p>
//                     </div>
//                   </div>

//                   {/* CRITICAL: Popular Templates Grid with inline styles */}
//                   <div
//                     style={{
//                       display: 'flex',
//                       flexWrap: 'wrap',
//                       justifyContent: 'center',
//                       gap: '2rem',
//                       width: '100%',
//                       margin: '0 auto',
//                       padding: '0',
//                     }}
//                   >
//                     {popularTemplates.map((template, index) => (
//                       <TemplateCard
//                         key={template.id}
//                         template={template}
//                         index={index}
//                         isCreating={isCreating}
//                         selectedTemplate={selectedTemplate}
//                         hoveredTemplate={hoveredTemplate}
//                         onHover={setHoveredTemplate}
//                         onUse={handleUseTemplate}
//                         featured={true}
//                       />
//                     ))}
//                   </div>
//                 </motion.div>
//               )}

//               {/* Templates by Category */}
//               {Object.entries(templatesByCategory).map(
//                 ([category, templates], categoryIndex) => {
//                   const IconComponent =
//                     categoryIcons[category as keyof typeof categoryIcons] ||
//                     Users;
//                   const gradientColor =
//                     categoryColors[category as keyof typeof categoryColors] ||
//                     'from-gray-500 to-gray-600';

//                   return (
//                     <motion.div
//                       key={category}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{
//                         duration: 0.6,
//                         delay: 0.3 + categoryIndex * 0.1,
//                       }}
//                       className='mb-16'
//                     >
//                       {/* Category Header */}
//                       <div className='flex items-center gap-3 mb-8 justify-center'>
//                         <div
//                           className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${gradientColor} rounded-xl shadow-lg`}
//                         >
//                           <IconComponent className='w-6 h-6 text-white' />
//                         </div>
//                         <div className='flex items-center gap-3'>
//                           <h2 className='text-3xl font-bold text-gray-900'>
//                             {category}
//                           </h2>
//                           <span className='bg-gray-100 text-gray-600 text-sm font-semibold px-3 py-1 rounded-full'>
//                             {templates.length} templates
//                           </span>
//                         </div>
//                       </div>

//                       {/* CRITICAL: Category Templates Grid with inline styles */}
//                       <div
//                         style={{
//                           display: 'flex',
//                           flexWrap: 'wrap',
//                           justifyContent: 'center',
//                           gap: '2rem',
//                           width: '100%',
//                           margin: '0 auto',
//                           padding: '0',
//                         }}
//                       >
//                         {templates.map((template, index) => (
//                           <TemplateCard
//                             key={template.id}
//                             template={template}
//                             index={index}
//                             isCreating={isCreating}
//                             selectedTemplate={selectedTemplate}
//                             hoveredTemplate={hoveredTemplate}
//                             onHover={setHoveredTemplate}
//                             onUse={handleUseTemplate}
//                           />
//                         ))}
//                       </div>
//                     </motion.div>
//                   );
//                 }
//               )}

//               {/* Footer CTA - Keep exactly as you have it */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: 0.8 }}
//                 className='text-center mt-20 py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100'
//               >
//                 <div className='max-w-2xl mx-auto'>
//                   <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6'>
//                     <Sparkles className='w-8 h-8 text-white' />
//                   </div>

//                   <h3 className='text-3xl font-bold text-gray-900 mb-4'>
//                     Can&apos;t find what you&apos;re looking for?
//                   </h3>

//                   <p className='text-lg text-gray-600 mb-8'>
//                     Create a custom form from scratch or let our AI build one
//                     for you
//                   </p>

//                   <div className='flex flex-col sm:flex-row gap-4 justify-center'>
//                     <button
//                       onClick={() => router.push('/dashboard')}
//                       className='px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm'
//                     >
//                       Start from Scratch
//                     </button>

//                     <button
//                       onClick={() => router.push('/ai/form-builder')}
//                       className='px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
//                     >
//                       Try AI Form Generator
//                     </button>
//                   </div>
//                 </div>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Enhanced Template Card Component
// interface TemplateCardProps {
//   template: Template;
//   index: number;
//   isCreating: boolean;
//   selectedTemplate: string | null;
//   hoveredTemplate: string | null;
//   onHover: (id: string | null) => void;
//   onUse: (template: Template) => void;
//   featured?: boolean;
// }

// function TemplateCard({
//   template,
//   index,
//   isCreating,
//   selectedTemplate,
//   hoveredTemplate,
//   onHover,
//   onUse,
//   featured = false,
// }: TemplateCardProps) {
//   const isHovered = hoveredTemplate === template.id;
//   const isSelected = selectedTemplate === template.id;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5, delay: index * 0.1 }}
//       style={{
//         width: '320px',
//         maxWidth: '320px',
//         minWidth: '320px',
//         height: '520px', // Slightly increased for better proportions
//         flexShrink: 0,
//         flexGrow: 0,
//         margin: '0',
//         position: 'relative',
//         background: 'white',
//         borderRadius: '1.5rem',
//         boxShadow:
//           '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
//         border: '1px solid #f3f4f6',
//         overflow: 'hidden',
//         transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
//         display: 'flex',
//         flexDirection: 'column',
//       }}
//       className={`group ${featured ? 'ring-2 ring-yellow-200' : ''}`}
//       onMouseEnter={() => onHover(template.id)}
//       onMouseLeave={() => onHover(null)}
//     >
//       {/* Background Gradient Overlay */}
//       <div className='absolute inset-0 bg-gradient-to-br from-blue-50/20 via-white/10 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

//       {/* Template Preview Section */}
//       <div
//         className='relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden'
//         style={{ height: '200px', flexShrink: 0 }}
//       >
//         {/* Animated Background Pattern */}
//         <div className='absolute inset-0 opacity-30'>
//           <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239CA3AF" fill-opacity="0.1" fill-rule="evenodd"%3E%3Cpath d="m0 40v-40h40v40z"/%3E%3C/g%3E%3C/svg%3E")]'></div>
//         </div>

//         {/* Form Preview Mockup */}
//         <motion.div
//           className='relative w-36 h-44 bg-white rounded-lg shadow-xl transform perspective-1000 group-hover:scale-105 group-hover:rotate-y-3 transition-transform duration-500'
//           animate={{
//             rotateY: isHovered ? 5 : 0,
//             scale: isHovered ? 1.05 : 1,
//           }}
//           transition={{ duration: 0.3 }}
//         >
//           <div className='p-4 h-full flex flex-col'>
//             {/* Form Header */}
//             <div className='h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-3'></div>

//             {/* Form Fields Simulation */}
//             <div className='space-y-2 flex-grow'>
//               {Array.from({ length: Math.min(template.fields, 6) }, (_, i) => (
//                 <motion.div
//                   key={i}
//                   className={`h-2 rounded ${
//                     i % 3 === 0
//                       ? 'bg-gray-300 w-full'
//                       : i % 3 === 1
//                       ? 'bg-gray-200 w-3/4'
//                       : 'bg-gray-100 w-5/6'
//                   }`}
//                   initial={{ opacity: 0, x: -10 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: i * 0.1 }}
//                 />
//               ))}

//               {template.fields > 6 && (
//                 <div className='text-xs text-gray-400 text-center pt-1'>
//                   +{template.fields - 6} more fields
//                 </div>
//               )}
//             </div>

//             {/* Form Button */}
//             <div className='mt-3 h-2.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded'></div>
//           </div>
//         </motion.div>

//         {/* Badges */}
//         <div className='absolute top-3 right-3 flex flex-col gap-2'>
//           {template.popular && (
//             <span className='bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1'>
//               <Star size={10} fill='currentColor' />
//               Popular
//             </span>
//           )}
//           {template.new && (
//             <span className='bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm'>
//               New
//             </span>
//           )}
//           {template.premium && (
//             <span className='bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1'>
//               <Sparkles size={10} fill='currentColor' />
//               Pro
//             </span>
//           )}
//         </div>

//         {/* Category Badge */}
//         <div className='absolute top-3 left-3'>
//           <span className='bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-white/50'>
//             {template.category}
//           </span>
//         </div>
//       </div>

//       {/* Template Information */}
//       <div
//         style={{
//           padding: '24px',
//           height: '320px',
//           display: 'flex',
//           flexDirection: 'column',
//         }}
//       >
//         <div
//           style={{
//             height: '60px',
//             marginBottom: '12px',
//             display: 'flex',
//             alignItems: 'flex-start',
//             justifyContent: 'space-between',
//           }}
//         >
//           <h3
//             style={{
//               fontSize: '20px',
//               fontWeight: '700',
//               color: '#111827',
//               lineHeight: '28px',
//               height: '56px', // Exactly 2 lines
//               overflow: 'hidden',
//               display: '-webkit-box',
//               WebkitLineClamp: 2,
//               WebkitBoxOrient: 'vertical',
//               flex: 1,
//               marginRight: '8px',
//             }}
//             className='group-hover:text-blue-600 transition-colors duration-300'
//           >
//             {template.name}
//           </h3>
//           <span
//             style={{
//               fontSize: '14px',
//               color: '#6b7280',
//               backgroundColor: '#f3f4f6',
//               padding: '4px 8px',
//               borderRadius: '6px',
//               whiteSpace: 'nowrap',
//               flexShrink: 0,
//             }}
//           >
//             {template.fields} fields
//           </span>
//         </div>

//         <div style={{ height: '50px', marginBottom: '16px' }}>
//           <p
//             style={{
//               fontSize: '14px',
//               color: '#4b5563',
//               lineHeight: '20px',
//               height: '40px', // Exactly 2 lines
//               overflow: 'hidden',
//               display: '-webkit-box',
//               WebkitLineClamp: 2,
//               WebkitBoxOrient: 'vertical',
//             }}
//           >
//             {template.description}
//           </p>
//         </div>

//         <div style={{ height: '50px', marginBottom: '24px' }}>
//           <p
//             style={{
//               fontSize: '12px',
//               color: '#6b7280',
//               fontStyle: 'italic',
//               lineHeight: '18px',
//               height: '36px', // Exactly 2 lines
//               overflow: 'hidden',
//               display: '-webkit-box',
//               WebkitLineClamp: 2,
//               WebkitBoxOrient: 'vertical',
//             }}
//           >
//             {template.preview}
//           </p>
//         </div>

//         {/* Spacer - TAKES UP REMAINING SPACE */}
//         <div style={{ flex: 1 }}></div>

//         {/* Action Button - FIXED AT BOTTOM */}
//         <div style={{ height: '48px' }}>
//           <motion.button
//             onClick={() => onUse(template)}
//             disabled={isCreating}
//             style={{
//               width: '100%',
//               height: '100%',
//               padding: '12px 16px',
//               borderRadius: '12px',
//               fontWeight: '600',
//               border: 'none',
//               cursor: isCreating ? 'not-allowed' : 'pointer',
//               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//               background:
//                 isCreating && isSelected
//                   ? '#dbeafe'
//                   : isCreating
//                   ? '#f3f4f6'
//                   : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
//               color:
//                 isCreating && isSelected
//                   ? '#2563eb'
//                   : isCreating
//                   ? '#9ca3af'
//                   : 'white',
//             }}
//             whileHover={!isCreating ? { scale: 1.02 } : {}}
//             whileTap={!isCreating ? { scale: 0.98 } : {}}
//           >
//             {isCreating && isSelected ? (
//               <div
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   gap: '8px',
//                 }}
//               >
//                 <Loader2
//                   style={{ width: '16px', height: '16px' }}
//                   className='animate-spin'
//                 />
//                 <span>Creating...</span>
//               </div>
//             ) : (
//               <div
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   gap: '8px',
//                 }}
//               >
//                 <span>Use Template</span>
//                 <motion.div
//                   animate={{ x: isHovered ? 4 : 0 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   <ArrowLeft
//                     style={{
//                       width: '16px',
//                       height: '16px',
//                       transform: 'rotate(180deg)',
//                     }}
//                   />
//                 </motion.div>
//               </div>
//             )}
//           </motion.button>
//         </div>
//       </div>

//       {/* Hover Effect Overlay */}
//       <motion.div
//         className='absolute inset-0 bg-gradient-to-r from-blue-600/3 to-purple-600/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'
//         animate={{
//           opacity: isHovered ? 1 : 0,
//         }}
//       />

//       {/* Loading Overlay */}
//       <AnimatePresence>
//         {isCreating && isSelected && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className='absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20'
//           >
//             <div className='text-center'>
//               <motion.div
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
//                 className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4'
//               />
//               <p className='text-blue-600 font-semibold'>
//                 Creating your form...
//               </p>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// src/components/modals/FormTemplatesModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Loader2,
  Star,
  Zap,
  Users,
  Clock,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { createFormAsync } from '@/redux/slices/dashboard/formsSlice';
import { StoreDispatch } from '@/redux/store';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  fields: number;
  preview: string;
  structure: any;
  popular?: boolean;
  new?: boolean;
  premium?: boolean;
}

const FORM_TEMPLATES: Template[] = [
  {
    id: 'appointment-request',
    name: 'Appointment Request Form',
    description: 'Schedule appointments with clients efficiently',
    category: 'Business',
    image: '/templates/appointment.png',
    fields: 8,
    preview: 'Perfect for medical practices, salons, consultancy services',
    popular: true,
    structure: {
      title: 'Appointment Request Form',
      description: 'Let us know how we can help you!',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'heading-1',
              type: 'heading',
              label: 'Personal Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Contact Number',
              required: true,
              helpText: 'We may need to contact you',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Confirmation will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'appointment',
              type: 'appointment',
              label: 'Preferred Date & Time',
              required: true,
              helpText: 'Select your preferred appointment slot',
              labelAlignment: 'LEFT',
            },
            {
              id: 'service-type',
              type: 'dropdown',
              label: 'Service Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Consultation', value: 'consultation' },
                { label: 'Follow-up', value: 'followup' },
                { label: 'New Patient', value: 'new-patient' },
              ],
            },
            {
              id: 'additional-info',
              type: 'paragraph',
              label: 'Additional Information',
              required: false,
              helpText: 'Any special requirements or notes',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Book Appointment',
        thankyouMessage:
          'Thank you! Your appointment request has been received. We will contact you soon to confirm.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'information-request',
    name: 'Information Request Form',
    description: 'Handle inquiries and information requests professionally',
    category: 'Business',
    image: '/templates/information.png',
    fields: 7,
    preview: 'Perfect for lead generation and customer inquiries',
    structure: {
      title: 'Information Request',
      description: 'Get in touch with us for more information',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'heading-1',
              type: 'heading',
              label: 'Contact Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email',
              required: true,
              helpText: 'We will respond to this email address',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
            },
            {
              id: 'company',
              type: 'shortText',
              label: 'Company/Organization',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              placeholder: 'Company name',
            },
            {
              id: 'inquiry-type',
              type: 'dropdown',
              label: 'Type of Inquiry',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'General Information', value: 'general' },
                { label: 'Product Demo', value: 'demo' },
                { label: 'Pricing', value: 'pricing' },
                { label: 'Partnership', value: 'partnership' },
                { label: 'Support', value: 'support' },
              ],
            },
            {
              id: 'message',
              type: 'paragraph',
              label: 'Requesting Information Regarding',
              required: true,
              helpText: 'Please provide details about your inquiry',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Send Request',
        thankyouMessage:
          'Thank you for your inquiry! We will get back to you within 24 hours.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'contact-form',
    name: 'Contact Us Form',
    description: 'Simple contact form for general inquiries',
    category: 'Business',
    image: '/templates/contact.png',
    fields: 5,
    preview: 'Essential contact form for any website',
    structure: {
      title: 'Contact Us',
      description: 'Get in touch with our team',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Your Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'We will respond to this email',
              labelAlignment: 'LEFT',
            },
            {
              id: 'subject',
              type: 'shortText',
              label: 'Subject',
              required: true,
              helpText: 'Brief subject of your inquiry',
              labelAlignment: 'LEFT',
              placeholder: 'What is this regarding?',
            },
            {
              id: 'message',
              type: 'paragraph',
              label: 'Message',
              required: true,
              helpText: 'Please provide details about your inquiry',
              labelAlignment: 'LEFT',
              rows: 5,
            },
            {
              id: 'contact-method',
              type: 'singleChoice',
              label: 'Preferred Contact Method',
              required: false,
              helpText: 'How would you like us to respond?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Email', value: 'email' },
                { label: 'Phone Call', value: 'phone' },
              ],
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Send Message',
        thankyouMessage:
          'Thank you for contacting us! We will get back to you within 24 hours.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'feedback-form',
    name: 'Feedback Form',
    description: 'Collect valuable feedback from your customers',
    category: 'Survey',
    image: '/templates/feedback.png',
    fields: 6,
    preview: 'Great for customer satisfaction and service improvement',
    new: true,
    structure: {
      title: 'Feedback Form',
      description:
        'We would love to hear your thoughts, suggestions, concerns or problems with anything so we can improve!',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'feedback-type',
              type: 'singleChoice',
              label: 'Feedback Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Compliment', value: 'compliment' },
                { label: 'Suggestion', value: 'suggestion' },
                { label: 'Complaint', value: 'complaint' },
              ],
            },
            {
              id: 'rating',
              type: 'singleChoice',
              label: 'Overall Rating',
              required: true,
              helpText: 'How would you rate your experience?',
              labelAlignment: 'LEFT',
              options: [
                { label: '⭐⭐⭐⭐⭐ Excellent', value: '5' },
                { label: '⭐⭐⭐⭐ Good', value: '4' },
                { label: '⭐⭐⭐ Average', value: '3' },
                { label: '⭐⭐ Poor', value: '2' },
                { label: '⭐ Very Poor', value: '1' },
              ],
            },
            {
              id: 'feedback-text',
              type: 'paragraph',
              label: 'Describe Your Feedback',
              required: true,
              helpText: 'Please provide detailed feedback',
              labelAlignment: 'LEFT',
              rows: 5,
            },
            {
              id: 'name',
              type: 'shortText',
              label: 'Name',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              placeholder: 'Your name',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email',
              required: false,
              helpText: 'Optional - for follow-up if needed',
              labelAlignment: 'LEFT',
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Feedback',
        thankyouMessage:
          'Thank you for your valuable feedback! We appreciate your input.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'survey-form',
    name: 'Customer Survey Form',
    description: 'Gather insights from your customers',
    category: 'Survey',
    image: '/templates/survey.png',
    fields: 10,
    preview: 'Comprehensive survey for market research and feedback',
    structure: {
      title: 'Customer Survey Form',
      description: 'Help us serve you better by sharing your thoughts',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'demographics',
              type: 'heading',
              label: 'About You',
              labelAlignment: 'LEFT',
            },
            {
              id: 'age-group',
              type: 'singleChoice',
              label: 'Age Group',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              options: [
                { label: '18-25', value: '18-25' },
                { label: '26-35', value: '26-35' },
                { label: '36-45', value: '36-45' },
                { label: '46-55', value: '46-55' },
                { label: '56+', value: '56+' },
              ],
            },
            {
              id: 'customer-type',
              type: 'singleChoice',
              label: 'Customer Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'First-time customer', value: 'first-time' },
                { label: 'Returning customer', value: 'returning' },
                { label: 'Long-term customer (1+ years)', value: 'long-term' },
              ],
            },
            {
              id: 'satisfaction',
              type: 'singleChoice',
              label: 'Overall Satisfaction',
              required: true,
              helpText: 'How satisfied are you with our service?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Very Satisfied', value: 'very-satisfied' },
                { label: 'Satisfied', value: 'satisfied' },
                { label: 'Neutral', value: 'neutral' },
                { label: 'Dissatisfied', value: 'dissatisfied' },
                { label: 'Very Dissatisfied', value: 'very-dissatisfied' },
              ],
            },
            {
              id: 'service-quality',
              type: 'singleChoice',
              label: 'Service Quality Rating',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
              ],
            },
            {
              id: 'features-used',
              type: 'multipleChoice',
              label: 'Features/Services Used',
              required: false,
              helpText: 'Select all that apply',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Customer Support', value: 'support' },
                { label: 'Online Platform', value: 'platform' },
                { label: 'Mobile App', value: 'mobile' },
                { label: 'In-store Service', value: 'instore' },
                { label: 'Delivery Service', value: 'delivery' },
              ],
            },
            {
              id: 'recommendation',
              type: 'singleChoice',
              label: 'Likelihood to Recommend',
              required: true,
              helpText: 'How likely are you to recommend us to others?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Very Likely', value: 'very-likely' },
                { label: 'Likely', value: 'likely' },
                { label: 'Neutral', value: 'neutral' },
                { label: 'Unlikely', value: 'unlikely' },
                { label: 'Very Unlikely', value: 'very-unlikely' },
              ],
            },
            {
              id: 'improvements',
              type: 'paragraph',
              label: 'Suggestions for Improvement',
              required: false,
              helpText: 'What can we do better?',
              labelAlignment: 'LEFT',
              rows: 4,
            },
            {
              id: 'additional-comments',
              type: 'paragraph',
              label: 'Additional Comments',
              required: false,
              helpText: 'Any other feedback you would like to share',
              labelAlignment: 'LEFT',
              rows: 3,
            },
            {
              id: 'contact-email',
              type: 'email',
              label: 'Email (Optional)',
              required: false,
              helpText: 'For follow-up if needed',
              labelAlignment: 'LEFT',
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Survey',
        thankyouMessage:
          'Thank you for your valuable feedback! Your responses help us improve our services.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'product-survey',
    name: 'Product Survey Form',
    description: 'Get insights about product preferences and usage',
    category: 'Survey',
    image: '/templates/product-survey.png',
    fields: 8,
    preview: 'Ideal for product development and market research',
    structure: {
      title: 'Product Survey',
      description: 'Help us understand your product needs better',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'product-usage',
              type: 'singleChoice',
              label: 'How often do you use our product?',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Rarely', value: 'rarely' },
              ],
            },
            {
              id: 'favorite-features',
              type: 'multipleChoice',
              label: 'What are your favorite features?',
              required: false,
              helpText: 'Select all that apply',
              labelAlignment: 'LEFT',
              options: [
                { label: 'User Interface', value: 'ui' },
                { label: 'Performance', value: 'performance' },
                { label: 'Customer Support', value: 'support' },
                { label: 'Pricing', value: 'pricing' },
                { label: 'Reliability', value: 'reliability' },
              ],
            },
            {
              id: 'improvement-areas',
              type: 'paragraph',
              label: 'What could we improve?',
              required: false,
              helpText: 'Your suggestions are valuable to us',
              labelAlignment: 'LEFT',
              rows: 4,
            },
            {
              id: 'product-rating',
              type: 'singleChoice',
              label: 'Overall Product Rating',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: '5 Stars - Excellent', value: '5' },
                { label: '4 Stars - Good', value: '4' },
                { label: '3 Stars - Average', value: '3' },
                { label: '2 Stars - Below Average', value: '2' },
                { label: '1 Star - Poor', value: '1' },
              ],
            },
            {
              id: 'recommend-product',
              type: 'singleChoice',
              label: 'Would you recommend our product?',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Definitely Yes', value: 'definitely-yes' },
                { label: 'Probably Yes', value: 'probably-yes' },
                { label: 'Not Sure', value: 'not-sure' },
                { label: 'Probably No', value: 'probably-no' },
                { label: 'Definitely No', value: 'definitely-no' },
              ],
            },
            {
              id: 'user-type',
              type: 'singleChoice',
              label: 'Which best describes you?',
              required: false,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Business Owner', value: 'business-owner' },
                { label: 'Employee', value: 'employee' },
                { label: 'Freelancer', value: 'freelancer' },
                { label: 'Student', value: 'student' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              id: 'additional-comments',
              type: 'paragraph',
              label: 'Additional Comments',
              required: false,
              helpText: 'Anything else you would like to share?',
              labelAlignment: 'LEFT',
              rows: 3,
            },
            {
              id: 'contact-info',
              type: 'email',
              label: 'Email (Optional)',
              required: false,
              helpText: 'If you would like us to follow up',
              labelAlignment: 'LEFT',
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Survey',
        thankyouMessage:
          'Thank you for your feedback! Your input helps us create better products.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'customer-registration',
    name: 'Customer Registration Form',
    description: 'Streamline new customer onboarding process',
    category: 'Registration',
    image: '/templates/registration.png',
    fields: 8,
    preview: 'Ideal for membership signups and customer accounts',
    popular: true,
    structure: {
      title: 'New Customer Registration Form',
      description: 'Join our community today!',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'heading-1',
              type: 'heading',
              label: 'Customer Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'This will be your login email',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'For account verification',
              labelAlignment: 'LEFT',
            },
            {
              id: 'address',
              type: 'address',
              label: 'Address',
              required: true,
              helpText: 'Complete address for delivery/billing',
              labelAlignment: 'LEFT',
            },
            {
              id: 'date-of-birth',
              type: 'datePicker',
              label: 'Date of Birth',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
            },
            {
              id: 'preferences',
              type: 'multipleChoice',
              label: 'Communication Preferences',
              required: false,
              helpText: 'How would you like to hear from us?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Email Newsletter', value: 'newsletter' },
                { label: 'SMS Updates', value: 'sms' },
                { label: 'Promotional Offers', value: 'promotions' },
              ],
            },
            {
              id: 'terms',
              type: 'singleChoice',
              label: 'Terms and Conditions',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                {
                  label: 'I agree to the Terms and Conditions',
                  value: 'agree',
                },
              ],
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Register',
        thankyouMessage:
          'Welcome! Your registration was successful. Check your email for confirmation.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'member-signup',
    name: 'Membership Signup Form',
    description: 'Comprehensive membership registration with plans',
    category: 'Registration',
    image: '/templates/membership.png',
    fields: 9,
    preview: 'Perfect for gyms, clubs, and subscription services',
    structure: {
      title: 'Membership Signup',
      description: 'Join our exclusive membership program',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'personal-info',
              type: 'heading',
              label: 'Personal Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Your membership email',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'For important updates',
              labelAlignment: 'LEFT',
            },
            {
              id: 'membership-plan',
              type: 'singleChoice',
              label: 'Select Membership Plan',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Basic Plan - $29/month', value: 'basic' },
                { label: 'Premium Plan - $49/month', value: 'premium' },
                { label: 'VIP Plan - $99/month', value: 'vip' },
              ],
            },
            {
              id: 'referral-source',
              type: 'dropdown',
              label: 'How did you hear about us?',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Google Search', value: 'google' },
                { label: 'Social Media', value: 'social' },
                { label: 'Friend Referral', value: 'referral' },
                { label: 'Advertisement', value: 'ad' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              id: 'interests',
              type: 'multipleChoice',
              label: 'Areas of Interest',
              required: false,
              helpText: 'Select all that apply',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Fitness Classes', value: 'fitness' },
                { label: 'Personal Training', value: 'training' },
                { label: 'Nutrition Advice', value: 'nutrition' },
                { label: 'Social Events', value: 'events' },
              ],
            },
            {
              id: 'emergency-contact',
              type: 'shortText',
              label: 'Emergency Contact',
              required: false,
              helpText: 'Name and phone number',
              labelAlignment: 'LEFT',
              placeholder: 'Contact Name, Phone',
            },
            {
              id: 'special-needs',
              type: 'paragraph',
              label: 'Special Requirements',
              required: false,
              helpText: 'Any accessibility needs or medical conditions',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Complete Signup',
        thankyouMessage:
          'Welcome to our membership! Check your email for next steps.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'account-signup',
    name: 'Account Creation Form',
    description: 'Simple account registration for online services',
    category: 'Registration',
    image: '/templates/account.png',
    fields: 6,
    preview: 'Streamlined signup process for digital platforms',
    new: true,
    structure: {
      title: 'Create Your Account',
      description: 'Get started in just a few steps',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'account-info',
              type: 'heading',
              label: 'Account Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'username',
              type: 'shortText',
              label: 'Username',
              required: true,
              helpText: 'Choose a unique username',
              labelAlignment: 'LEFT',
              placeholder: 'Enter username',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'We will verify this email',
              labelAlignment: 'LEFT',
            },
            {
              id: 'password',
              type: 'shortText',
              label: 'Password',
              required: true,
              helpText: 'Minimum 8 characters',
              labelAlignment: 'LEFT',
              placeholder: 'Create a strong password',
            },
            {
              id: 'account-type',
              type: 'singleChoice',
              label: 'Account Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Personal Account', value: 'personal' },
                { label: 'Business Account', value: 'business' },
              ],
            },
            {
              id: 'newsletter',
              type: 'singleChoice',
              label: 'Newsletter Subscription',
              required: false,
              helpText: 'Stay updated with our latest features',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Yes, subscribe me to newsletters', value: 'yes' },
                { label: 'No, thanks', value: 'no' },
              ],
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Create Account',
        thankyouMessage:
          'Account created successfully! Please check your email to verify your account.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'product-order',
    name: 'Product Order Form',
    description: 'Enable customers to place orders easily',
    category: 'E-commerce',
    image: '/templates/order.png',
    fields: 6,
    preview: 'Perfect for online stores and product catalogs',
    premium: true,
    structure: {
      title: 'Product Order Form',
      description: 'Place your order easily with our simple form',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'heading-1',
              type: 'heading',
              label: 'Select Products',
              labelAlignment: 'LEFT',
            },
            {
              id: 'products',
              type: 'productList',
              label: 'Choose Your Products',
              required: true,
              helpText: 'Select products and quantities',
              labelAlignment: 'LEFT',
              productListConfig: {
                products: [
                  {
                    id: '1',
                    name: 'Premium T-Shirt',
                    price: 29.99,
                    quantity: 1,
                  },
                  { id: '2', name: 'Classic Jeans', price: 59.99, quantity: 1 },
                  { id: '3', name: 'Running Shoes', price: 89.99, quantity: 1 },
                ],
              },
            },
            {
              id: 'customer-info',
              type: 'heading',
              label: 'Customer Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'customer-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'shipping-address',
              type: 'address',
              label: 'Shipping Address',
              required: true,
              helpText: 'Where should we deliver your order?',
              labelAlignment: 'LEFT',
            },
            {
              id: 'special-instructions',
              type: 'paragraph',
              label: 'Special Instructions',
              required: false,
              helpText: 'Any special delivery instructions',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Place Order',
        thankyouMessage:
          'Order received! We will process your order and contact you with shipping details.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'shopping-cart',
    name: 'Shopping Cart Form',
    description: 'Complete checkout experience for online purchases',
    category: 'E-commerce',
    image: '/templates/shopping-cart.png',
    fields: 8,
    preview: 'Full-featured checkout form with payment details',
    structure: {
      title: 'Checkout',
      description: 'Complete your purchase',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'order-summary',
              type: 'heading',
              label: 'Order Summary',
              labelAlignment: 'LEFT',
            },
            {
              id: 'customer-details',
              type: 'heading',
              label: 'Customer Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Order confirmation will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'billing-address',
              type: 'address',
              label: 'Billing Address',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'shipping-same',
              type: 'singleChoice',
              label: 'Shipping Address',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Same as billing address', value: 'same' },
                { label: 'Different shipping address', value: 'different' },
              ],
            },
            {
              id: 'payment-method',
              type: 'singleChoice',
              label: 'Payment Method',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Credit/Debit Card', value: 'card' },
                { label: 'PayPal', value: 'paypal' },
                { label: 'Bank Transfer', value: 'bank' },
              ],
            },
            {
              id: 'special-instructions',
              type: 'paragraph',
              label: 'Order Notes',
              required: false,
              helpText: 'Any special instructions for your order',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Complete Purchase',
        thankyouMessage:
          'Thank you for your order! You will receive a confirmation email shortly.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'quote-request',
    name: 'Quote Request Form',
    description: 'Get pricing quotes from potential customers',
    category: 'E-commerce',
    image: '/templates/quote.png',
    fields: 7,
    preview: 'Perfect for service providers and custom orders',
    structure: {
      title: 'Request a Quote',
      description: 'Get a personalized quote for your project',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'contact-info',
              type: 'heading',
              label: 'Contact Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'company-name',
              type: 'shortText',
              label: 'Company Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              placeholder: 'Your company name',
            },
            {
              id: 'contact-person',
              type: 'fullName',
              label: 'Contact Person',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Quote will be sent to this email',
              labelAlignment: 'LEFT',
            },
            {
              id: 'project-type',
              type: 'dropdown',
              label: 'Project Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Website Development', value: 'website' },
                { label: 'Mobile App', value: 'mobile' },
                { label: 'E-commerce Store', value: 'ecommerce' },
                { label: 'Custom Software', value: 'software' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              id: 'budget-range',
              type: 'singleChoice',
              label: 'Budget Range',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Under $5,000', value: 'under-5k' },
                { label: '$5,000 - $15,000', value: '5k-15k' },
                { label: '$15,000 - $50,000', value: '15k-50k' },
                { label: 'Over $50,000', value: 'over-50k' },
              ],
            },
            {
              id: 'project-description',
              type: 'paragraph',
              label: 'Project Description',
              required: true,
              helpText: 'Please describe your project requirements',
              labelAlignment: 'LEFT',
              rows: 5,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Request Quote',
        thankyouMessage:
          'Thank you! We will review your requirements and send you a detailed quote within 24 hours.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'course-registration',
    name: 'Course Registration Form',
    description: 'Manage course enrollments efficiently',
    category: 'Education',
    image: '/templates/course.png',
    fields: 9,
    preview: 'Great for educational institutions and training centers',
    structure: {
      title: 'Course Registration Form',
      description: 'Enroll in your preferred course today',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'heading-1',
              type: 'heading',
              label: 'Student Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'student-name',
              type: 'fullName',
              label: 'Student Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Course materials will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Contact Number',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'course-selection',
              type: 'dropdown',
              label: 'Select Course',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Web Development Bootcamp', value: 'web-dev' },
                { label: 'Data Science Fundamentals', value: 'data-science' },
                { label: 'Digital Marketing', value: 'digital-marketing' },
                { label: 'UI/UX Design', value: 'uiux-design' },
              ],
            },
            {
              id: 'schedule-preference',
              type: 'singleChoice',
              label: 'Schedule Preference',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Weekdays (Mon-Fri)', value: 'weekdays' },
                { label: 'Weekends (Sat-Sun)', value: 'weekends' },
                { label: 'Evening Classes', value: 'evening' },
              ],
            },
            {
              id: 'experience-level',
              type: 'singleChoice',
              label: 'Experience Level',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
              ],
            },
            {
              id: 'goals',
              type: 'paragraph',
              label: 'Learning Goals',
              required: false,
              helpText: 'What do you hope to achieve from this course?',
              labelAlignment: 'LEFT',
              rows: 4,
            },
            {
              id: 'emergency-contact',
              type: 'shortText',
              label: 'Emergency Contact',
              required: false,
              helpText: 'Name and phone number',
              labelAlignment: 'LEFT',
              placeholder: 'Name, Phone',
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Register for Course',
        thankyouMessage:
          'Registration successful! You will receive course details and payment instructions soon.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'workshop-signup',
    name: 'Workshop Signup Form',
    description: 'Register participants for workshops and seminars',
    category: 'Education',
    image: '/templates/workshop.png',
    fields: 7,
    preview: 'Ideal for professional development and skill-building sessions',
    structure: {
      title: 'Workshop Registration',
      description: 'Secure your spot in our upcoming workshop',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'participant-info',
              type: 'heading',
              label: 'Participant Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: 'As it should appear on certificate',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Workshop materials will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'job-title',
              type: 'shortText',
              label: 'Job Title',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              placeholder: 'Your current position',
            },
            {
              id: 'company',
              type: 'shortText',
              label: 'Company/Organization',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              placeholder: 'Your organization',
            },
            {
              id: 'workshop-session',
              type: 'singleChoice',
              label: 'Preferred Session',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                {
                  label: 'Morning Session (9:00 AM - 12:00 PM)',
                  value: 'morning',
                },
                {
                  label: 'Afternoon Session (1:00 PM - 4:00 PM)',
                  value: 'afternoon',
                },
                {
                  label: 'Evening Session (5:00 PM - 8:00 PM)',
                  value: 'evening',
                },
              ],
            },
            {
              id: 'expectations',
              type: 'paragraph',
              label: 'What do you hope to learn?',
              required: false,
              helpText: 'Your expectations from this workshop',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Register for Workshop',
        thankyouMessage:
          'Registration confirmed! You will receive workshop details and joining instructions via email.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'scholarship-application',
    name: 'Scholarship Application Form',
    description: 'Apply for educational scholarships and grants',
    category: 'Education',
    image: '/templates/scholarship.png',
    fields: 11,
    preview: 'Comprehensive application form for scholarship programs',
    structure: {
      title: 'Scholarship Application',
      description: 'Apply for our scholarship program',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'personal-info',
              type: 'heading',
              label: 'Personal Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'date-of-birth',
              type: 'datePicker',
              label: 'Date of Birth',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'current-education',
              type: 'dropdown',
              label: 'Current Education Level',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'High School', value: 'high-school' },
                { label: 'Undergraduate', value: 'undergraduate' },
                { label: 'Graduate', value: 'graduate' },
                { label: 'Postgraduate', value: 'postgraduate' },
              ],
            },
            {
              id: 'gpa',
              type: 'number',
              label: 'Current GPA',
              required: true,
              helpText: 'On a 4.0 scale',
              labelAlignment: 'LEFT',
              min: 0,
              max: 4,
            },
            {
              id: 'field-of-study',
              type: 'shortText',
              label: 'Field of Study',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              placeholder: 'Your major/field of study',
            },
            {
              id: 'financial-need',
              type: 'singleChoice',
              label: 'Financial Need Level',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'High Need', value: 'high' },
                { label: 'Moderate Need', value: 'moderate' },
                { label: 'Low Need', value: 'low' },
              ],
            },
            {
              id: 'essay',
              type: 'paragraph',
              label: 'Personal Statement',
              required: true,
              helpText:
                'Tell us about your goals and why you deserve this scholarship (500 words max)',
              labelAlignment: 'LEFT',
              rows: 8,
            },
            {
              id: 'references',
              type: 'paragraph',
              label: 'References',
              required: false,
              helpText: 'List 2-3 references with contact information',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Application',
        thankyouMessage:
          'Your scholarship application has been submitted successfully. We will review your application and contact you within 4-6 weeks.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'event-registration',
    name: 'Event Registration Form',
    description: 'Manage event attendee registrations',
    category: 'Events',
    image: '/templates/event.png',
    fields: 8,
    preview: 'Perfect for conferences, workshops, and social events',
    new: true,
    structure: {
      title: 'Event Registration Form',
      description: 'Register for our upcoming event',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'attendee-info',
              type: 'heading',
              label: 'Attendee Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: 'As it should appear on your badge',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Event updates will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'organization',
              type: 'shortText',
              label: 'Organization/Company',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              placeholder: 'Company name',
            },
            {
              id: 'job-title',
              type: 'shortText',
              label: 'Job Title',
              required: false,
              helpText: 'Optional',
              labelAlignment: 'LEFT',
              placeholder: 'Your job title',
            },
            {
              id: 'ticket-type',
              type: 'singleChoice',
              label: 'Ticket Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Regular Ticket - $99', value: 'regular' },
                { label: 'Student Ticket - $49', value: 'student' },
                { label: 'VIP Ticket - $199', value: 'vip' },
              ],
            },
            {
              id: 'dietary-requirements',
              type: 'multipleChoice',
              label: 'Dietary Requirements',
              required: false,
              helpText: 'Select all that apply',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Vegetarian', value: 'vegetarian' },
                { label: 'Vegan', value: 'vegan' },
                { label: 'Gluten-free', value: 'gluten-free' },
                { label: 'No dietary restrictions', value: 'none' },
              ],
            },
            {
              id: 'special-needs',
              type: 'paragraph',
              label: 'Special Accommodations',
              required: false,
              helpText: 'Any accessibility needs or special requests',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Register for Event',
        thankyouMessage:
          'Registration confirmed! Check your email for event details and payment instructions.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'conference-registration',
    name: 'Conference Registration Form',
    description: 'Professional conference and seminar registration',
    category: 'Events',
    image: '/templates/conference.png',
    fields: 9,
    preview: 'Comprehensive registration for business conferences',
    structure: {
      title: 'Conference Registration',
      description: 'Join us for our annual conference',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'attendee-details',
              type: 'heading',
              label: 'Attendee Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: 'As it should appear on conference badge',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Conference materials will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'For urgent conference updates',
              labelAlignment: 'LEFT',
            },
            {
              id: 'company',
              type: 'shortText',
              label: 'Company/Organization',
              required: true,
              helpText: 'Will appear on your badge',
              labelAlignment: 'LEFT',
              placeholder: 'Your organization',
            },
            {
              id: 'job-title',
              type: 'shortText',
              label: 'Job Title',
              required: true,
              helpText: 'Will appear on your badge',
              labelAlignment: 'LEFT',
              placeholder: 'Your position',
            },
            {
              id: 'registration-type',
              type: 'singleChoice',
              label: 'Registration Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Early Bird - $299 (Save $100)', value: 'early-bird' },
                { label: 'Regular - $399', value: 'regular' },
                { label: 'Student - $99', value: 'student' },
                { label: 'Speaker/Sponsor - Free', value: 'speaker' },
              ],
            },
            {
              id: 'sessions-interest',
              type: 'multipleChoice',
              label: 'Sessions of Interest',
              required: false,
              helpText: 'Select sessions you plan to attend',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Keynote Sessions', value: 'keynote' },
                { label: 'Technical Workshops', value: 'workshops' },
                { label: 'Panel Discussions', value: 'panels' },
                { label: 'Networking Events', value: 'networking' },
                { label: 'Product Demos', value: 'demos' },
              ],
            },
            {
              id: 'special-requirements',
              type: 'paragraph',
              label: 'Special Requirements',
              required: false,
              helpText: 'Dietary restrictions, accessibility needs, etc.',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Complete Registration',
        thankyouMessage:
          'Thank you for registering! You will receive confirmation and payment details via email.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'wedding-rsvp',
    name: 'Wedding RSVP Form',
    description: 'Collect wedding attendance confirmations',
    category: 'Events',
    image: '/templates/wedding.png',
    fields: 6,
    preview: 'Beautiful RSVP form for wedding celebrations',
    structure: {
      title: 'Wedding RSVP',
      description: 'Please confirm your attendance for our special day',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'guest-name',
              type: 'fullName',
              label: 'Guest Name',
              required: true,
              helpText: 'Primary guest name',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'For wedding updates',
              labelAlignment: 'LEFT',
            },
            {
              id: 'attendance',
              type: 'singleChoice',
              label: 'Will you be attending?',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Yes, I will attend', value: 'yes' },
                { label: 'No, I cannot attend', value: 'no' },
              ],
            },
            {
              id: 'guest-count',
              type: 'number',
              label: 'Number of Guests',
              required: true,
              helpText: 'Including yourself',
              labelAlignment: 'LEFT',
              min: 0,
              max: 10,
            },
            {
              id: 'dietary-restrictions',
              type: 'multipleChoice',
              label: 'Dietary Restrictions',
              required: false,
              helpText: 'Select all that apply',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Vegetarian', value: 'vegetarian' },
                { label: 'Vegan', value: 'vegan' },
                { label: 'Gluten-free', value: 'gluten-free' },
                { label: 'Nut allergies', value: 'nut-allergies' },
                { label: 'No restrictions', value: 'none' },
              ],
            },
            {
              id: 'message',
              type: 'paragraph',
              label: 'Special Message',
              required: false,
              helpText: 'Any message for the happy couple',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Send RSVP',
        thankyouMessage:
          'Thank you for your RSVP! We look forward to celebrating with you.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'job-application',
    name: 'Job Application Form',
    description: 'Streamline your hiring process',
    category: 'HR',
    image: '/templates/job.png',
    fields: 12,
    preview: 'Comprehensive form for job applications and recruitment',
    popular: true,
    structure: {
      title: 'Job Application Form',
      description: 'Apply for your dream job with us',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'personal-info',
              type: 'heading',
              label: 'Personal Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'address',
              type: 'address',
              label: 'Current Address',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'position-applied',
              type: 'dropdown',
              label: 'Position Applied For',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Software Engineer', value: 'software-engineer' },
                { label: 'Product Manager', value: 'product-manager' },
                { label: 'UI/UX Designer', value: 'designer' },
                { label: 'Marketing Specialist', value: 'marketing' },
                { label: 'Sales Representative', value: 'sales' },
              ],
            },
            {
              id: 'experience-years',
              type: 'dropdown',
              label: 'Years of Experience',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Less than 1 year', value: '0-1' },
                { label: '1-3 years', value: '1-3' },
                { label: '3-5 years', value: '3-5' },
                { label: '5-10 years', value: '5-10' },
                { label: '10+ years', value: '10+' },
              ],
            },
            {
              id: 'current-salary',
              type: 'number',
              label: 'Current Salary (Annual)',
              required: false,
              helpText: 'Optional - in USD',
              labelAlignment: 'LEFT',
              min: 0,
            },
            {
              id: 'expected-salary',
              type: 'number',
              label: 'Expected Salary (Annual)',
              required: false,
              helpText: 'Optional - in USD',
              labelAlignment: 'LEFT',
              min: 0,
            },
            {
              id: 'availability',
              type: 'datePicker',
              label: 'Available Start Date',
              required: true,
              helpText: 'When can you start?',
              labelAlignment: 'LEFT',
            },
            {
              id: 'resume',
              type: 'fileUpload',
              label: 'Resume/CV',
              required: true,
              helpText: 'Upload your resume (PDF preferred)',
              labelAlignment: 'LEFT',
              accept: '.pdf,.doc,.docx',
            },
            {
              id: 'cover-letter',
              type: 'paragraph',
              label: 'Cover Letter',
              required: true,
              helpText: 'Tell us why you are the perfect fit for this role',
              labelAlignment: 'LEFT',
              rows: 6,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Application',
        thankyouMessage:
          'Thank you for your application! We will review it and get back to you within 5 business days.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Form',
    description: 'Streamline new employee setup process',
    category: 'HR',
    image: '/templates/onboarding.png',
    fields: 10,
    preview: 'Complete onboarding form for new hires',
    structure: {
      title: 'Employee Onboarding Form',
      description:
        'Welcome to the team! Please complete your onboarding information',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'personal-details',
              type: 'heading',
              label: 'Personal Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Legal Name',
              required: true,
              helpText: 'As it appears on official documents',
              labelAlignment: 'LEFT',
            },
            {
              id: 'employee-id',
              type: 'shortText',
              label: 'Employee ID',
              required: true,
              helpText: 'Provided by HR',
              labelAlignment: 'LEFT',
              placeholder: 'EMP-XXXX',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Personal Email',
              required: true,
              helpText: 'Your personal email address',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'address',
              type: 'address',
              label: 'Home Address',
              required: true,
              helpText: 'Current residential address',
              labelAlignment: 'LEFT',
            },
            {
              id: 'start-date',
              type: 'datePicker',
              label: 'Start Date',
              required: true,
              helpText: 'Your first day of work',
              labelAlignment: 'LEFT',
            },
            {
              id: 'department',
              type: 'dropdown',
              label: 'Department',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Engineering', value: 'engineering' },
                { label: 'Marketing', value: 'marketing' },
                { label: 'Sales', value: 'sales' },
                { label: 'HR', value: 'hr' },
                { label: 'Finance', value: 'finance' },
                { label: 'Operations', value: 'operations' },
              ],
            },
            {
              id: 'emergency-contact',
              type: 'shortText',
              label: 'Emergency Contact',
              required: true,
              helpText: 'Name, relationship, and phone number',
              labelAlignment: 'LEFT',
              placeholder: 'Name, Relationship, Phone',
            },
            {
              id: 'special-accommodations',
              type: 'paragraph',
              label: 'Special Accommodations',
              required: false,
              helpText: 'Any workplace accommodations needed',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Complete Onboarding',
        thankyouMessage:
          'Welcome aboard! Your onboarding information has been submitted. HR will contact you with next steps.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'performance-review',
    name: 'Performance Review Form',
    description: 'Employee performance evaluation and feedback',
    category: 'HR',
    image: '/templates/performance.png',
    fields: 8,
    preview: 'Comprehensive performance review for employees',
    structure: {
      title: 'Employee Performance Review',
      description: 'Annual performance evaluation form',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'employee-info',
              type: 'heading',
              label: 'Employee Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'employee-name',
              type: 'fullName',
              label: 'Employee Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'employee-id',
              type: 'shortText',
              label: 'Employee ID',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              placeholder: 'EMP-XXXX',
            },
            {
              id: 'review-period',
              type: 'dropdown',
              label: 'Review Period',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Q1 2024', value: 'q1-2024' },
                { label: 'Q2 2024', value: 'q2-2024' },
                { label: 'Q3 2024', value: 'q3-2024' },
                { label: 'Q4 2024', value: 'q4-2024' },
                { label: 'Annual 2024', value: 'annual-2024' },
              ],
            },
            {
              id: 'overall-rating',
              type: 'singleChoice',
              label: 'Overall Performance Rating',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Exceeds Expectations', value: 'exceeds' },
                { label: 'Meets Expectations', value: 'meets' },
                { label: 'Below Expectations', value: 'below' },
                { label: 'Needs Improvement', value: 'improvement' },
              ],
            },
            {
              id: 'key-achievements',
              type: 'paragraph',
              label: 'Key Achievements',
              required: true,
              helpText: 'List major accomplishments during this period',
              labelAlignment: 'LEFT',
              rows: 5,
            },
            {
              id: 'areas-for-improvement',
              type: 'paragraph',
              label: 'Areas for Improvement',
              required: false,
              helpText: 'Areas where employee can grow',
              labelAlignment: 'LEFT',
              rows: 4,
            },
            {
              id: 'goals-next-period',
              type: 'paragraph',
              label: 'Goals for Next Period',
              required: true,
              helpText: 'Objectives for the upcoming review period',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Review',
        thankyouMessage:
          'Performance review submitted successfully. The employee will receive a copy.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup Form',
    description: 'Build your email list with style',
    category: 'Marketing',
    image: '/templates/newsletter.png',
    fields: 4,
    preview: 'Simple and effective newsletter subscription form',
    structure: {
      title: 'Join Our Newsletter',
      description: 'Stay updated with our latest news and offers',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Your Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'We respect your privacy and will never spam you',
              labelAlignment: 'LEFT',
            },
            {
              id: 'interests',
              type: 'multipleChoice',
              label: 'What interests you?',
              required: false,
              helpText: 'Select topics you want to hear about',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Product Updates', value: 'products' },
                { label: 'Industry News', value: 'news' },
                { label: 'Tips & Tutorials', value: 'tips' },
                { label: 'Special Offers', value: 'offers' },
                { label: 'Company News', value: 'company' },
              ],
            },
            {
              id: 'frequency',
              type: 'singleChoice',
              label: 'Email Frequency',
              required: false,
              helpText: 'How often would you like to hear from us?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Weekly', value: 'weekly' },
                { label: 'Bi-weekly', value: 'biweekly' },
                { label: 'Monthly', value: 'monthly' },
              ],
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Subscribe',
        thankyouMessage:
          'Welcome to our newsletter! Check your email for a confirmation link.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation Form',
    description: 'Capture qualified leads for your business',
    category: 'Marketing',
    image: '/templates/lead-gen.png',
    fields: 7,
    preview: 'Convert visitors into qualified sales leads',
    structure: {
      title: 'Get Your Free Consultation',
      description: 'Discover how we can help grow your business',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'contact-info',
              type: 'heading',
              label: 'Contact Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Business Email',
              required: true,
              helpText: 'Your work email address',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'Best number to reach you',
              labelAlignment: 'LEFT',
            },
            {
              id: 'company',
              type: 'shortText',
              label: 'Company Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              placeholder: 'Your company',
            },
            {
              id: 'company-size',
              type: 'dropdown',
              label: 'Company Size',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: '1-10 employees', value: '1-10' },
                { label: '11-50 employees', value: '11-50' },
                { label: '51-200 employees', value: '51-200' },
                { label: '201-1000 employees', value: '201-1000' },
                { label: '1000+ employees', value: '1000+' },
              ],
            },
            {
              id: 'budget',
              type: 'singleChoice',
              label: 'Monthly Budget Range',
              required: false,
              helpText: 'Optional - helps us recommend the right solution',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Under $1,000', value: 'under-1k' },
                { label: '$1,000 - $5,000', value: '1k-5k' },
                { label: '$5,000 - $10,000', value: '5k-10k' },
                { label: 'Over $10,000', value: 'over-10k' },
              ],
            },
            {
              id: 'challenges',
              type: 'paragraph',
              label: 'Current Challenges',
              required: false,
              helpText: 'What business challenges are you facing?',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Get My Free Consultation',
        thankyouMessage:
          'Thank you! Our team will contact you within 24 hours to schedule your free consultation.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: true,
      },
    },
  },
  {
    id: 'product-interest',
    name: 'Product Interest Form',
    description: 'Gauge interest in new products and services',
    category: 'Marketing',
    image: '/templates/product-interest.png',
    fields: 6,
    preview: 'Perfect for product launches and market validation',
    new: true,
    structure: {
      title: 'Express Your Interest',
      description: 'Be the first to know about our upcoming product',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'contact-details',
              type: 'heading',
              label: 'Contact Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'full-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'We will send updates to this email',
              labelAlignment: 'LEFT',
            },
            {
              id: 'interest-level',
              type: 'singleChoice',
              label: 'Interest Level',
              required: true,
              helpText: 'How interested are you in this product?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Very Interested', value: 'very-interested' },
                { label: 'Somewhat Interested', value: 'somewhat-interested' },
                { label: 'Mildly Interested', value: 'mildly-interested' },
                { label: 'Just Curious', value: 'just-curious' },
              ],
            },
            {
              id: 'use-case',
              type: 'dropdown',
              label: 'Primary Use Case',
              required: false,
              helpText: 'How would you use this product?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Personal Use', value: 'personal' },
                { label: 'Small Business', value: 'small-business' },
                { label: 'Enterprise', value: 'enterprise' },
                { label: 'Education', value: 'education' },
                { label: 'Non-profit', value: 'nonprofit' },
              ],
            },
            {
              id: 'features-wanted',
              type: 'multipleChoice',
              label: 'Desired Features',
              required: false,
              helpText: 'What features are most important to you?',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Easy Setup', value: 'easy-setup' },
                { label: 'Advanced Analytics', value: 'analytics' },
                { label: 'Mobile App', value: 'mobile' },
                { label: 'Team Collaboration', value: 'collaboration' },
                { label: 'API Integration', value: 'api' },
              ],
            },
            {
              id: 'additional-thoughts',
              type: 'paragraph',
              label: 'Additional Thoughts',
              required: false,
              helpText:
                'Any specific features or requirements you would like to see?',
              labelAlignment: 'LEFT',
              rows: 4,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Submit Interest',
        thankyouMessage:
          'Thank you for your interest! We will keep you updated on our product development.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: false,
        allowMultipleEmailSubmissions: false,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'booking-form',
    name: 'Hotel Booking Form',
    description: 'Streamline hotel reservations',
    category: 'Hospitality',
    image: '/templates/booking.png',
    fields: 10,
    preview: 'Complete booking form for hotels and accommodations',
    structure: {
      title: 'Hotel Booking Form',
      description: 'Reserve your perfect stay with us',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'guest-info',
              type: 'heading',
              label: 'Guest Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'guest-name',
              type: 'fullName',
              label: 'Primary Guest Name',
              required: true,
              helpText: 'Name on the reservation',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Booking confirmation will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'For booking confirmations',
              labelAlignment: 'LEFT',
            },
            {
              id: 'booking-details',
              type: 'heading',
              label: 'Booking Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'check-in',
              type: 'datePicker',
              label: 'Check-in Date',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'check-out',
              type: 'datePicker',
              label: 'Check-out Date',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'room-type',
              type: 'dropdown',
              label: 'Room Type',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Standard Room - $99/night', value: 'standard' },
                { label: 'Deluxe Room - $149/night', value: 'deluxe' },
                { label: 'Suite - $249/night', value: 'suite' },
                {
                  label: 'Presidential Suite - $499/night',
                  value: 'presidential',
                },
              ],
            },
            {
              id: 'guests',
              type: 'number',
              label: 'Number of Guests',
              required: true,
              helpText: 'Total number of guests',
              labelAlignment: 'LEFT',
              min: 1,
              max: 8,
            },
            {
              id: 'special-requests',
              type: 'multipleChoice',
              label: 'Special Requests',
              required: false,
              helpText: 'Select all that apply',
              labelAlignment: 'LEFT',
              options: [
                { label: 'Airport Pickup', value: 'pickup' },
                { label: 'Late Check-in', value: 'late-checkin' },
                { label: 'High Floor Room', value: 'high-floor' },
                { label: 'Quiet Room', value: 'quiet' },
                { label: 'Extra Towels', value: 'towels' },
              ],
            },
            {
              id: 'additional-notes',
              type: 'paragraph',
              label: 'Additional Notes',
              required: false,
              helpText: 'Any special requirements or requests',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Book Now',
        thankyouMessage:
          'Booking request received! We will confirm your reservation within 2 hours.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'restaurant-reservation',
    name: 'Restaurant Reservation Form',
    description: 'Manage restaurant table bookings',
    category: 'Hospitality',
    image: '/templates/restaurant.png',
    fields: 7,
    preview: 'Perfect for restaurants and dining establishments',
    structure: {
      title: 'Table Reservation',
      description: 'Reserve your table for an unforgettable dining experience',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'guest-details',
              type: 'heading',
              label: 'Guest Details',
              labelAlignment: 'LEFT',
            },
            {
              id: 'guest-name',
              type: 'fullName',
              label: 'Name for Reservation',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'We may call to confirm your reservation',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: false,
              helpText: 'Optional - for confirmation emails',
              labelAlignment: 'LEFT',
            },
            {
              id: 'reservation-date',
              type: 'datePicker',
              label: 'Reservation Date',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'reservation-time',
              type: 'dropdown',
              label: 'Preferred Time',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
              options: [
                { label: '5:00 PM', value: '17:00' },
                { label: '5:30 PM', value: '17:30' },
                { label: '6:00 PM', value: '18:00' },
                { label: '6:30 PM', value: '18:30' },
                { label: '7:00 PM', value: '19:00' },
                { label: '7:30 PM', value: '19:30' },
                { label: '8:00 PM', value: '20:00' },
                { label: '8:30 PM', value: '20:30' },
                { label: '9:00 PM', value: '21:00' },
              ],
            },
            {
              id: 'party-size',
              type: 'number',
              label: 'Party Size',
              required: true,
              helpText: 'Number of guests',
              labelAlignment: 'LEFT',
              min: 1,
              max: 20,
            },
            {
              id: 'special-requests',
              type: 'paragraph',
              label: 'Special Requests',
              required: false,
              helpText:
                'Dietary restrictions, celebrations, accessibility needs, etc.',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Reserve Table',
        thankyouMessage:
          'Reservation request received! We will call you to confirm your table within 30 minutes.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
  {
    id: 'spa-appointment',
    name: 'Spa Appointment Form',
    description: 'Book spa services and wellness treatments',
    category: 'Hospitality',
    image: '/templates/spa.png',
    fields: 8,
    preview: 'Relaxing appointment booking for spa and wellness centers',
    structure: {
      title: 'Spa Appointment Booking',
      description: 'Book your relaxing spa experience',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'client-info',
              type: 'heading',
              label: 'Client Information',
              labelAlignment: 'LEFT',
            },
            {
              id: 'client-name',
              type: 'fullName',
              label: 'Full Name',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              required: true,
              helpText: 'Appointment confirmation will be sent here',
              labelAlignment: 'LEFT',
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              required: true,
              helpText: 'We may call to confirm your appointment',
              labelAlignment: 'LEFT',
            },
            {
              id: 'appointment-date',
              type: 'datePicker',
              label: 'Preferred Date',
              required: true,
              helpText: '',
              labelAlignment: 'LEFT',
            },
            {
              id: 'services',
              type: 'multipleChoice',
              label: 'Services Requested',
              required: true,
              helpText: 'Select all services you would like',
              labelAlignment: 'LEFT',
              options: [
                {
                  label: 'Swedish Massage (60 min) - $80',
                  value: 'swedish-massage',
                },
                {
                  label: 'Deep Tissue Massage (60 min) - $90',
                  value: 'deep-tissue',
                },
                {
                  label: 'Hot Stone Therapy (90 min) - $120',
                  value: 'hot-stone',
                },
                { label: 'Facial Treatment (60 min) - $70', value: 'facial' },
                { label: 'Aromatherapy (60 min) - $85', value: 'aromatherapy' },
                { label: 'Manicure & Pedicure - $50', value: 'mani-pedi' },
              ],
            },
            {
              id: 'preferred-therapist',
              type: 'dropdown',
              label: 'Preferred Therapist',
              required: false,
              helpText: 'Optional - leave blank for any available therapist',
              labelAlignment: 'LEFT',
              options: [
                { label: 'No Preference', value: 'no-preference' },
                { label: 'Sarah Johnson', value: 'sarah' },
                { label: 'Michael Chen', value: 'michael' },
                { label: 'Emma Rodriguez', value: 'emma' },
                { label: 'David Kim', value: 'david' },
              ],
            },
            {
              id: 'health-conditions',
              type: 'paragraph',
              label: 'Health Conditions or Allergies',
              required: false,
              helpText:
                'Please inform us of any health conditions, allergies, or concerns',
              labelAlignment: 'LEFT',
              rows: 3,
            },
          ],
        },
      ],
      settings: {
        submitButtonText: 'Book Appointment',
        thankyouMessage:
          'Your spa appointment request has been received! We will call you within 2 hours to confirm your booking.',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
      },
    },
  },
];

const categoryIcons = {
  Business: Users,
  Survey: Star,
  Registration: CheckCircle,
  'E-commerce': Zap,
  Education: Star,
  Events: Users,
  HR: Users,
  Marketing: Sparkles,
  Hospitality: Clock,
};

const categoryColors = {
  Business: 'from-blue-500 to-blue-600',
  Survey: 'from-purple-500 to-purple-600',
  Registration: 'from-green-500 to-green-600',
  'E-commerce': 'from-orange-500 to-orange-600',
  Education: 'from-indigo-500 to-indigo-600',
  Events: 'from-pink-500 to-pink-600',
  HR: 'from-teal-500 to-teal-600',
  Marketing: 'from-yellow-500 to-yellow-600',
  Hospitality: 'from-red-500 to-red-600',
};

export default function FormTemplatesModal() {
  const router = useRouter();
  const dispatch: StoreDispatch = useDispatch();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const handleClose = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.back();
  };

  const generateUniqueFormName = (templateName: string) => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${templateName} - ${timestamp}`;
  };

  const handleUseTemplate = async (template: Template) => {
    setIsCreating(true);
    setSelectedTemplate(template.id);

    try {
      const uniqueName = generateUniqueFormName(template.name);

      // Create form with template structure
      const result = await dispatch(
        createFormAsync({
          name: uniqueName,
          description: template.description,
          template: template.structure,
        })
      ).unwrap();

      const formId = result.id;
      toast.success(`${template.name} created successfully`);

      // Redirect to form builder with the new form
      router.push(`/build/${formId}`);
    } catch (error: any) {
      console.error('Failed to create form from template:', error);
      toast.error('Failed to create form', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreating(false);
      setSelectedTemplate(null);
    }
  };

  const getTemplatesByCategory = () => {
    const categories: Record<string, Template[]> = {};
    FORM_TEMPLATES.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = [];
      }
      categories[template.category].push(template);
    });
    return categories;
  };

  const templatesByCategory = getTemplatesByCategory();
  const popularTemplates = FORM_TEMPLATES.filter(t => t.popular);

  return (
    <div className='fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-auto z-50'>
      <div className='min-h-screen flex flex-col'>
        {/* Enhanced Header */}
        <div className='relative overflow-hidden'>
          {/* Background Pattern */}
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90'></div>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30'></div>

          <div className='relative p-6 flex items-center border-b border-white/20 backdrop-blur-xl'>
            <button
              onClick={handleBack}
              disabled={isCreating}
              className='flex items-center cursor-pointer text-white/90 hover:text-white transition-all duration-200 ml-2 px-4 py-2 rounded-xl hover:bg-white/10 backdrop-blur-sm'
            >
              <ArrowLeft size={20} className='mr-2' />
              <span className='font-medium'>Back</span>
            </button>

            <div className='flex-grow'></div>

            <button
              onClick={handleClose}
              disabled={isCreating}
              className='p-3 mr-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm border border-white/20'
              aria-label='Close'
            >
              <X size={24} className='text-white' />
            </button>
          </div>

          {/* Hero Section */}
          <div className='relative px-6 py-16 text-center text-white'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6'>
                <Sparkles size={18} className='text-yellow-300' />
                <span className='text-sm font-medium'>
                  Professional Templates
                </span>
              </div>

              <h1 className='text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
                Choose Your Perfect Template
              </h1>

              <p className='text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed'>
                Start with a professionally designed template and customize it
                to match your brand. All templates are fully responsive,
                accessible, and conversion-optimized.
              </p>

              <div className='flex flex-wrap justify-center gap-6 mt-10'>
                <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
                  <CheckCircle size={18} className='text-green-300' />
                  <span className='text-sm'>Mobile Responsive</span>
                </div>
                <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
                  <Zap size={18} className='text-yellow-300' />
                  <span className='text-sm'>Instant Setup</span>
                </div>
                <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
                  <Star size={18} className='text-orange-300' />
                  <span className='text-sm'>Professionally Designed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-grow px-6 py-12'>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div className='max-w-7xl mx-auto w-full'>
              {/* Popular Templates Section */}
              {popularTemplates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className='mb-16'
                >
                  {/* Popular Templates Header */}
                  <div className='flex items-center gap-3 mb-8 justify-center'>
                    <div className='flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg'>
                      <Star className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h2 className='text-3xl font-bold text-gray-900'>
                        Popular Templates
                      </h2>
                      <p className='text-gray-600'>Most loved by our users</p>
                    </div>
                  </div>

                  {/* CRITICAL: Popular Templates Grid with inline styles */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '2rem',
                      width: '100%',
                      margin: '0 auto',
                      padding: '0',
                    }}
                  >
                    {popularTemplates.map((template, index) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        index={index}
                        isCreating={isCreating}
                        selectedTemplate={selectedTemplate}
                        hoveredTemplate={hoveredTemplate}
                        onHover={setHoveredTemplate}
                        onUse={handleUseTemplate}
                        featured={true}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Templates by Category */}
              {Object.entries(templatesByCategory).map(
                ([category, templates], categoryIndex) => {
                  const IconComponent =
                    categoryIcons[category as keyof typeof categoryIcons] ||
                    Users;
                  const gradientColor =
                    categoryColors[category as keyof typeof categoryColors] ||
                    'from-gray-500 to-gray-600';

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.3 + categoryIndex * 0.1,
                      }}
                      className='mb-16'
                    >
                      {/* Category Header */}
                      <div className='flex items-center gap-3 mb-8 justify-center'>
                        <div
                          className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${gradientColor} rounded-xl shadow-lg`}
                        >
                          <IconComponent className='w-6 h-6 text-white' />
                        </div>
                        <div className='flex items-center gap-3'>
                          <h2 className='text-3xl font-bold text-gray-900'>
                            {category}
                          </h2>
                          <span className='bg-gray-100 text-gray-600 text-sm font-semibold px-3 py-1 rounded-full'>
                            {templates.length} templates
                          </span>
                        </div>
                      </div>

                      {/* CRITICAL: Category Templates Grid with inline styles */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: '2rem',
                          width: '100%',
                          margin: '0 auto',
                          padding: '0',
                        }}
                      >
                        {templates.map((template, index) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            index={index}
                            isCreating={isCreating}
                            selectedTemplate={selectedTemplate}
                            hoveredTemplate={hoveredTemplate}
                            onHover={setHoveredTemplate}
                            onUse={handleUseTemplate}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                }
              )}

              {/* Footer CTA - Keep exactly as you have it */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className='text-center mt-20 py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100'
              >
                <div className='max-w-2xl mx-auto'>
                  <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6'>
                    <Sparkles className='w-8 h-8 text-white' />
                  </div>

                  <h3 className='text-3xl font-bold text-gray-900 mb-4'>
                    Can&apos;t find what you&apos;re looking for?
                  </h3>

                  <p className='text-lg text-gray-600 mb-8'>
                    Create a custom form from scratch or let our AI build one
                    for you
                  </p>

                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className='px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm'
                    >
                      Start from Scratch
                    </button>

                    <button
                      onClick={() => router.push('/ai/form-builder')}
                      className='px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    >
                      Try AI Form Generator
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Template Card Component
interface TemplateCardProps {
  template: Template;
  index: number;
  isCreating: boolean;
  selectedTemplate: string | null;
  hoveredTemplate: string | null;
  onHover: (id: string | null) => void;
  onUse: (template: Template) => void;
  featured?: boolean;
}

function TemplateCard({
  template,
  index,
  isCreating,
  selectedTemplate,
  hoveredTemplate,
  onHover,
  onUse,
  featured = false,
}: TemplateCardProps) {
  const isHovered = hoveredTemplate === template.id;
  const isSelected = selectedTemplate === template.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        width: '320px',
        maxWidth: '320px',
        minWidth: '320px',
        height: '520px', // Slightly increased for better proportions
        flexShrink: 0,
        flexGrow: 0,
        margin: '0',
        position: 'relative',
        background: 'white',
        borderRadius: '1.5rem',
        boxShadow:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}
      className={`group ${featured ? 'ring-2 ring-yellow-200' : ''}`}
      onMouseEnter={() => onHover(template.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Background Gradient Overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50/20 via-white/10 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

      {/* Template Preview Section */}
      <div
        className='relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden'
        style={{ height: '200px', flexShrink: 0 }}
      >
        {/* Animated Background Pattern */}
        <div className='absolute inset-0 opacity-30'>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239CA3AF" fill-opacity="0.1" fill-rule="evenodd"%3E%3Cpath d="m0 40v-40h40v40z"/%3E%3C/g%3E%3C/svg%3E")]'></div>
        </div>

        {/* Form Preview Mockup */}
        <motion.div
          className='relative w-36 h-44 bg-white rounded-lg shadow-xl transform perspective-1000 group-hover:scale-105 group-hover:rotate-y-3 transition-transform duration-500'
          animate={{
            rotateY: isHovered ? 5 : 0,
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className='p-4 h-full flex flex-col'>
            {/* Form Header */}
            <div className='h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-3'></div>

            {/* Form Fields Simulation */}
            <div className='space-y-2 flex-grow'>
              {Array.from({ length: Math.min(template.fields, 6) }, (_, i) => (
                <motion.div
                  key={i}
                  className={`h-2 rounded ${
                    i % 3 === 0
                      ? 'bg-gray-300 w-full'
                      : i % 3 === 1
                      ? 'bg-gray-200 w-3/4'
                      : 'bg-gray-100 w-5/6'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                />
              ))}

              {template.fields > 6 && (
                <div className='text-xs text-gray-400 text-center pt-1'>
                  +{template.fields - 6} more fields
                </div>
              )}
            </div>

            {/* Form Button */}
            <div className='mt-3 h-2.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded'></div>
          </div>
        </motion.div>

        {/* Badges */}
        <div className='absolute top-3 right-3 flex flex-col gap-2'>
          {template.popular && (
            <span className='bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1'>
              <Star size={10} fill='currentColor' />
              Popular
            </span>
          )}
          {template.new && (
            <span className='bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm'>
              New
            </span>
          )}
          {template.premium && (
            <span className='bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1'>
              <Sparkles size={10} fill='currentColor' />
              Pro
            </span>
          )}
        </div>

        {/* Category Badge */}
        <div className='absolute top-3 left-3'>
          <span className='bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-white/50'>
            {template.category}
          </span>
        </div>
      </div>

      {/* Template Information */}
      <div
        style={{
          padding: '24px',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: '60px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              lineHeight: '28px',
              height: '56px', // Exactly 2 lines
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              flex: 1,
              marginRight: '8px',
            }}
            className='group-hover:text-blue-600 transition-colors duration-300'
          >
            {template.name}
          </h3>
          <span
            style={{
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {template.fields} fields
          </span>
        </div>

        <div style={{ height: '50px', marginBottom: '16px' }}>
          <p
            style={{
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '20px',
              height: '40px', // Exactly 2 lines
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {template.description}
          </p>
        </div>

        <div style={{ height: '50px', marginBottom: '24px' }}>
          <p
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontStyle: 'italic',
              lineHeight: '18px',
              height: '36px', // Exactly 2 lines
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {template.preview}
          </p>
        </div>

        {/* Spacer - TAKES UP REMAINING SPACE */}
        <div style={{ flex: 1 }}></div>

        {/* Action Button - FIXED AT BOTTOM */}
        <div style={{ height: '48px' }}>
          <motion.button
            onClick={() => onUse(template)}
            disabled={isCreating}
            style={{
              width: '100%',
              height: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background:
                isCreating && isSelected
                  ? '#dbeafe'
                  : isCreating
                  ? '#f3f4f6'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color:
                isCreating && isSelected
                  ? '#2563eb'
                  : isCreating
                  ? '#9ca3af'
                  : 'white',
            }}
            className={!isCreating ? 'hover:cursor-pointer' : ''}
            whileHover={!isCreating ? { scale: 1.02 } : {}}
            whileTap={!isCreating ? { scale: 0.98 } : {}}
          >
            {isCreating && isSelected ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Loader2
                  style={{ width: '16px', height: '16px' }}
                  className='animate-spin'
                />
                <span>Creating...</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Use Template</span>
                <motion.div
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft
                    style={{
                      width: '16px',
                      height: '16px',
                      transform: 'rotate(180deg)',
                    }}
                  />
                </motion.div>
              </div>
            )}
          </motion.button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <motion.div
        className='absolute inset-0 bg-gradient-to-r from-blue-600/3 to-purple-600/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isCreating && isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20'
          >
            <div className='text-center'>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4'
              />
              <p className='text-blue-600 font-semibold'>
                Creating your form...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
