'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  HeadphonesIcon,
} from 'lucide-react';

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  priority: z.string().min(1, 'Please select a priority level'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactSupportPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Form submitted:', data);
      setSubmitStatus('success');
      reset();
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className='bg-white shadow-sm border-b'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'
            >
              <HeadphonesIcon className='w-8 h-8 text-white' />
            </motion.div>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
              FormIQ Support Center
            </h1>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              We&apos;re here to help. Get in touch with our support team for
              any questions or assistance you need.
            </p>
          </div>
        </div>
      </motion.div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 lg:grid-cols-3 gap-8'
        >
          {/* Contact Information Cards */}
          <motion.div
            variants={itemVariants}
            className='lg:col-span-1 space-y-6'
          >
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Get in Touch
            </h2>

            {/* Contact Methods */}
            {[
              {
                icon: Mail,
                title: 'Email Support',
                description: 'Send us an email anytime',
                contact: 'support@formiq.com',
                available: '24/7 Response',
              },
              {
                icon: Phone,
                title: 'Phone Support',
                description: 'Call us for immediate help',
                contact: '+91 99999 00000',
                available: 'Mon-Fri 9AM-6PM EST',
              },
              {
                icon: MessageSquare,
                title: 'Live Chat',
                description: 'Chat with our support team',
                contact: 'Start a conversation',
                available: 'Available now',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover='hover'
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'
              >
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0'>
                    <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                      <item.icon className='w-6 h-6 text-blue-600' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                      {item.title}
                    </h3>
                    <p className='text-gray-600 text-sm mb-2'>
                      {item.description}
                    </p>
                    <p className='text-blue-600 font-medium'>{item.contact}</p>
                    <p className='text-gray-500 text-xs mt-1'>
                      {item.available}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Office Information */}
            <motion.div
              variants={cardVariants}
              whileHover='hover'
              className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'
            >
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-6 h-6 text-green-600' />
                  </div>
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                    Office Location
                  </h3>
                  <p className='text-gray-600 text-sm mb-2'>
                    Visit us in person
                  </p>
                  <p className='text-gray-700'>
                    123 Luxuria Business Hub
                    <br />
                    Surat
                    <br />
                    Gujarat 395007
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Response Time */}
            <motion.div
              variants={cardVariants}
              whileHover='hover'
              className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white'
            >
              <div className='flex items-center space-x-3 mb-3'>
                <Clock className='w-6 h-6' />
                <h3 className='text-lg font-semibold'>Average Response Time</h3>
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Email</span>
                  <span className='font-medium'>&lt; 2 hours</span>
                </div>
                <div className='flex justify-between'>
                  <span>Live Chat</span>
                  <span className='font-medium'>&lt; 5 minutes</span>
                </div>
                <div className='flex justify-between'>
                  <span>Phone</span>
                  <span className='font-medium'>Immediate</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={itemVariants} className='lg:col-span-2'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6'>
                <h2 className='text-2xl font-bold text-white mb-2'>
                  Send us a Message
                </h2>
                <p className='text-blue-100'>
                  Fill out the form below and we&apos;ll get back to you as soon
                  as possible.
                </p>
              </div>

              <div onSubmit={handleSubmit(onSubmit)} className='p-8 space-y-6'>
                {/* Name and Email Row */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Full Name *
                    </label>
                    <input
                      {...register('name')}
                      type='text'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                      placeholder='Enter your full name'
                    />
                    {errors.name && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.name.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Email Address *
                    </label>
                    <input
                      {...register('email')}
                      type='email'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                      placeholder='Enter your email'
                    />
                    {errors.email && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.email.message}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Category and Priority Row */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Category *
                    </label>
                    <select
                      {...register('category')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    >
                      <option value=''>Select a category</option>
                      <option value='technical'>Technical Support</option>
                      <option value='billing'>Billing & Payments</option>
                      <option value='feature'>Feature Request</option>
                      <option value='bug'>Bug Report</option>
                      <option value='general'>General Inquiry</option>
                    </select>
                    {errors.category && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.category.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Priority Level *
                    </label>
                    <select
                      {...register('priority')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    >
                      <option value=''>Select priority</option>
                      <option value='low'>Low</option>
                      <option value='medium'>Medium</option>
                      <option value='high'>High</option>
                      <option value='urgent'>Urgent</option>
                    </select>
                    {errors.priority && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.priority.message}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Subject */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject *
                  </label>
                  <input
                    {...register('subject')}
                    type='text'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    placeholder='Brief description of your issue'
                  />
                  {errors.subject && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.subject.message}
                    </p>
                  )}
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Message *
                  </label>
                  <textarea
                    {...register('message')}
                    rows={6}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none'
                    placeholder='Please provide as much detail as possible about your issue or question...'
                  />
                  {errors.message && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.message.message}
                    </p>
                  )}
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className='flex flex-col sm:flex-row gap-4 items-center'
                >
                  <motion.button
                    type='submit'
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                  >
                    {isSubmitting ? (
                      <>
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className='w-5 h-5' />
                        <span>Send Message</span>
                      </>
                    )}
                  </motion.button>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='flex items-center space-x-2 text-green-600'
                    >
                      <CheckCircle className='w-5 h-5' />
                      <span className='text-sm font-medium'>
                        Message sent successfully!
                      </span>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='flex items-center space-x-2 text-red-600'
                    >
                      <AlertCircle className='w-5 h-5' />
                      <span className='text-sm font-medium'>
                        Failed to send. Please try again.
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                <p className='text-sm text-gray-500 text-center sm:text-left'>
                  * Required fields. We&apos;ll respond within 24 hours during
                  business days.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className='mt-16'
        >
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Frequently Asked Questions
            </h2>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Find quick answers to common questions. Can&apos;t find what
              you&apos;re looking for? Contact us directly.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {[
              {
                question: 'What are your support hours?',
                answer:
                  'Our support team is available Monday through Friday, 9 AM to 6 PM EST. Email support is monitored 24/7 with responses within 2 hours.',
              },
              {
                question: 'How can I track my support ticket?',
                answer:
                  'After submitting a support request, you&apos;ll receive a confirmation email with a ticket number. Use this number to track your request status.',
              },
              {
                question: 'Do you offer phone support?',
                answer:
                  'Yes, phone support is available for urgent issues during business hours. Premium customers have access to priority phone support.',
              },
              {
                question:
                  'What information should I include in my support request?',
                answer:
                  'Please include your account details, a clear description of the issue, steps to reproduce the problem, and any error messages you&apos;ve encountered.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'
              >
                <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                  {faq.question}
                </h3>
                <p className='text-gray-600'>{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactSupportPage;
