// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Star,
  Zap,
  Brain,
  BarChart,
  Shield,
  FileText,
  Menu,
  X,
  Play,
  CheckCircle,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
  Camera,
  Mic,
  Image as ImageIcon,
  Share2,
  Settings,
  Palette,
  Lock,
  Cloud,
  ChevronUp,
  BookOpen,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
};

// Animated Counter Component
const AnimatedCounter = ({
  end,
  duration = 2,
  suffix = '',
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min(
        (currentTime - startTime) / (duration * 1000),
        1
      );

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Features data
  const features = [
    {
      icon: Settings,
      title: 'Drag & Drop Form Builder',
      description:
        'Create stunning forms with our intuitive visual builder. No coding required.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Brain,
      title: 'AI-Powered Evaluation',
      description:
        'Intelligent answer analysis using GPT-4 and Claude for better insights.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'AI Form Generation',
      description:
        'Generate complete forms from natural language prompts in seconds.',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Camera,
      title: 'Multimodal Responses',
      description:
        'Collect text, images, videos, audio, and file uploads seamlessly.',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  // Testimonials data with working placeholder images
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Director',
      company: 'TechCorp',
      image:
        'https://ui-avatars.com/api/?name=Sarah+Johnson&background=3b82f6&color=fff&size=150',
      content:
        'FormIQ transformed our lead generation. The AI insights help us understand our customers better than ever before.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'StartupXYZ',
      image:
        'https://ui-avatars.com/api/?name=Michael+Chen&background=10b981&color=fff&size=150',
      content:
        'The drag-and-drop builder is incredibly intuitive. We built complex forms in minutes, not hours.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'HR Manager',
      company: 'Global Inc',
      image:
        'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=f59e0b&color=fff&size=150',
      content:
        'AI-powered answer evaluation saves us countless hours in recruitment. Game-changing technology!',
      rating: 5,
    },
  ];

  // Your actual pricing plans
  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        '5 Forms',
        '100 Monthly Submissions',
        '1 User per Team',
        '100 MB Storage',
        'Basic Analytics',
        'Email Support',
        'Mobile Responsive',
        'SSL Encryption',
      ],
      popular: false,
      color: 'emerald',
      gradient: 'from-emerald-400 to-emerald-600',
    },
    {
      name: 'Bronze',
      price: '₹255',
      originalPrice: '₹510',
      period: '/month',
      description: 'Great for small teams',
      features: [
        '25 Forms',
        '1,000 Monthly Submissions',
        '1 User per Team',
        '1 GB Storage',
        'Advanced Analytics',
        'Priority Support',
        'Custom Branding',
        'File Uploads',
        'API Access',
      ],
      popular: false,
      color: 'orange',
      gradient: 'from-orange-400 to-orange-600',
      yearlyDiscount: true,
    },
    {
      name: 'Silver',
      price: '₹297',
      originalPrice: '₹595',
      period: '/month',
      description: 'Most popular choice',
      features: [
        '50 Forms',
        '2,500 Monthly Submissions',
        '1 User per Team',
        '10 GB Storage',
        'AI Answer Evaluation',
        'Advanced Analytics',
        'Priority Support',
        'Custom Branding',
        'File Uploads',
        'Payment Integration',
        'Webhooks',
      ],
      popular: true,
      color: 'blue',
      gradient: 'from-blue-400 to-blue-600',
      yearlyDiscount: true,
    },
    {
      name: 'Gold',
      price: '₹467',
      originalPrice: '₹935',
      period: '/month',
      description: 'For growing businesses',
      features: [
        '100 Forms',
        '10,000 Monthly Submissions',
        '1 User per Team',
        '100 GB Storage',
        'AI Form Generation',
        'Advanced Integrations',
        'Dedicated Support',
        'White-label Solution',
        'Custom Development',
        'SLA Guarantee',
        'On-premise Option',
      ],
      popular: false,
      color: 'yellow',
      gradient: 'from-yellow-400 to-yellow-600',
      yearlyDiscount: true,
    },
  ];

  const stats = [
    { number: 50000, label: 'Forms Created', suffix: '+' },
    { number: 2000000, label: 'Responses Collected', suffix: '+' },
    { number: 99.9, label: 'Uptime', suffix: '%' },
    { number: 24, label: 'Support Hours', suffix: '/7' },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden'>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className='fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-white/20 z-50'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <motion.div
              className='flex items-center space-x-2 cursor-pointer'
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('hero')}
            >
              <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3'>
                <Image
                  src='/LOGO.png'
                  alt='Logo'
                  width={60}
                  height={60}
                  priority
                />
              </div>
              <span className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                FormIQ
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center space-x-8'>
              <button
                onClick={() => scrollToSection('features')}
                className='text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className='text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className='text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
              >
                Reviews
              </button>
              <Link
                href='/auth/login'
                className='text-gray-700 hover:text-blue-600 transition-colors'
              >
                Login
              </Link>
              <Link href='/auth/signup'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-md font-semibold hover:shadow-lg transition-all cursor-pointer'
                >
                  Get Started
                </motion.button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer'
            >
              {isMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='md:hidden bg-white border-t border-gray-200'
            >
              <div className='px-4 py-6 space-y-4'>
                <button
                  onClick={() => {
                    scrollToSection('features');
                    setIsMenuOpen(false);
                  }}
                  className='block w-full text-left text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection('pricing');
                    setIsMenuOpen(false);
                  }}
                  className='block w-full text-left text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
                >
                  Pricing
                </button>
                <button
                  onClick={() => {
                    scrollToSection('testimonials');
                    setIsMenuOpen(false);
                  }}
                  className='block w-full text-left text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
                >
                  Reviews
                </button>
                <Link
                  href='/auth/login'
                  className='block text-gray-700 hover:text-blue-600 transition-colors'
                >
                  Login
                </Link>
                <Link href='/auth/signup' className='block'>
                  <button className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 font-semibold cursor-pointer'>
                    Get Started
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section id='hero' className='pt-32 pb-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            animate='animate'
            variants={stagger}
            className='text-center'
          >
            <motion.div variants={fadeInUp} className='mb-8'>
              <div className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-6 py-2 mb-6'>
                <Sparkles className='w-4 h-4 text-blue-600' />
                <span className='text-sm font-medium text-blue-700'>
                  AI-Powered Form Builder
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className='text-5xl md:text-7xl font-bold mb-8 leading-tight'
            >
              Create Smart Forms with
              <span className='bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block'>
                AI Intelligence
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className='text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed'
            >
              Build beautiful, responsive forms with drag-and-drop simplicity.
              Get AI-powered insights, collect multimodal responses, and
              automate your workflows like never before.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'
            >
              <Link href='/auth/signup'>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer'
                >
                  Start Building for Free
                  <ArrowRight className='w-5 h-5' />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('features')}
                className='bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer'
              >
                <BookOpen className='w-5 h-5' />
                Explore Features
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              id='stats-section'
              variants={fadeInUp}
              className='grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto'
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className='text-center'
                >
                  <div className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                    <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className='text-gray-600 mt-2'>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='text-center mb-16'
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-5xl font-bold mb-6'
            >
              Powerful Features for
              <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block'>
                Modern Form Building
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl text-gray-600 max-w-3xl mx-auto'
            >
              Everything you need to create, distribute, and analyze forms with
              AI-powered intelligence
            </motion.p>
          </motion.div>

          {/* Main Features Grid */}
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20'
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -10 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all shadow-lg hover:shadow-xl'
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 text-white`}
                >
                  <feature.icon className='w-8 h-8' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-gray-900'>
                  {feature.title}
                </h3>
                <p className='text-gray-600'>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Detailed Features */}
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='grid lg:grid-cols-3 gap-8'
          >
            {/* Drag & Drop Builder */}
            <motion.div
              variants={fadeInUp}
              className='lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200'
            >
              <div className='flex items-center gap-4 mb-6'>
                <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                  <Palette className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900'>
                    Visual Form Builder
                  </h3>
                  <p className='text-gray-600'>
                    Design beautiful forms with ease
                  </p>
                </div>
              </div>
              <div className='grid md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span className='text-gray-700'>Drag & drop interface</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span className='text-gray-700'>25+ field types</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span className='text-gray-700'>Conditional logic</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span className='text-gray-700'>Custom themes</span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100'>
                  <div className='space-y-3'>
                    <div className='h-3 bg-blue-200 rounded w-3/4'></div>
                    <div className='h-2 bg-gray-200 rounded w-full'></div>
                    <div className='h-2 bg-gray-200 rounded w-2/3'></div>
                    <div className='h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded'></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Features */}
            <motion.div
              variants={fadeInUp}
              className='bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 border border-purple-200'
            >
              <div className='flex items-center gap-4 mb-6'>
                <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                  <Brain className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    AI Intelligence
                  </h3>
                  <p className='text-gray-600'>Smart automation</p>
                </div>
              </div>
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <Zap className='w-5 h-5 text-purple-500' />
                  <span className='text-gray-700'>Auto form generation</span>
                </div>
                <div className='flex items-center gap-3'>
                  <Target className='w-5 h-5 text-purple-500' />
                  <span className='text-gray-700'>Answer evaluation</span>
                </div>
                <div className='flex items-center gap-3'>
                  <TrendingUp className='w-5 h-5 text-purple-500' />
                  <span className='text-gray-700'>Smart insights</span>
                </div>
                <div className='flex items-center gap-3'>
                  <MessageSquare className='w-5 h-5 text-purple-500' />
                  <span className='text-gray-700'>NLP processing</span>
                </div>
              </div>
            </motion.div>

            {/* Multimodal Collection */}
            <motion.div
              variants={fadeInUp}
              className='bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl p-8 border border-emerald-200'
            >
              <div className='flex items-center gap-4 mb-6'>
                <div className='w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center'>
                  <Camera className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    Rich Media
                  </h3>
                  <p className='text-gray-600'>Beyond text responses</p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center gap-2 text-sm text-gray-700'>
                  <ImageIcon className='w-4 h-4 text-emerald-500' />
                  Images
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-700'>
                  <Mic className='w-4 h-4 text-emerald-500' />
                  Audio
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-700'>
                  <Play className='w-4 h-4 text-emerald-500' />
                  Video
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-700'>
                  <FileText className='w-4 h-4 text-emerald-500' />
                  Files
                </div>
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div
              variants={fadeInUp}
              className='lg:col-span-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl p-8 border border-orange-200'
            >
              <div className='flex items-center gap-4 mb-6'>
                <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center'>
                  <BarChart className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900'>
                    Advanced Analytics
                  </h3>
                  <p className='text-gray-600'>Deep insights into your data</p>
                </div>
              </div>
              <div className='grid md:grid-cols-3 gap-6'>
                <div className='space-y-3'>
                  <h4 className='font-semibold text-gray-900'>
                    Real-time Data
                  </h4>
                  <div className='text-sm text-gray-600'>
                    Live response tracking
                  </div>
                  <div className='text-sm text-gray-600'>
                    Instant notifications
                  </div>
                </div>
                <div className='space-y-3'>
                  <h4 className='font-semibold text-gray-900'>AI Insights</h4>
                  <div className='text-sm text-gray-600'>
                    Sentiment analysis
                  </div>
                  <div className='text-sm text-gray-600'>
                    Pattern recognition
                  </div>
                </div>
                <div className='space-y-3'>
                  <h4 className='font-semibold text-gray-900'>
                    Export Options
                  </h4>
                  <div className='text-sm text-gray-600'>CSV, Excel, PDF</div>
                  <div className='text-sm text-gray-600'>API access</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI Form Generation Showcase */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='text-center mb-16'
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-5xl font-bold mb-6'
            >
              Generate Forms with AI Magic
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl text-blue-100 max-w-3xl mx-auto'
            >
              Simply describe what you need, and our AI will create a complete
              form in seconds
            </motion.p>
          </motion.div>

          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={fadeInUp}
            className='bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20'
          >
            <div className='grid lg:grid-cols-2 gap-8 items-center'>
              <div>
                <h3 className='text-2xl font-bold mb-6'>
                  Try AI Form Generation
                </h3>
                <div className='space-y-4'>
                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20'>
                    <div className='text-sm text-blue-200 mb-2'>
                      Example Prompt:
                    </div>
                    <div className='text-white'>
                      &quot;Create a customer feedback form for a restaurant
                      with rating questions and comment fields&quot;
                    </div>
                  </div>
                  <div className='flex items-center gap-3 text-blue-200'>
                    <ArrowRight className='w-5 h-5' />
                    <span>AI processes your request</span>
                  </div>
                  <div className='flex items-center gap-3 text-blue-200'>
                    <ArrowRight className='w-5 h-5' />
                    <span>Intelligent form structure generated</span>
                  </div>
                  <div className='flex items-center gap-3 text-blue-200'>
                    <ArrowRight className='w-5 h-5' />
                    <span>Ready-to-use form in seconds</span>
                  </div>
                </div>
              </div>
              <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <Sparkles className='w-6 h-6 text-yellow-400' />
                    <span className='font-semibold'>
                      AI-Generated Form Preview
                    </span>
                  </div>
                  <div className='space-y-3'>
                    <div className='h-4 bg-white/20 rounded w-3/4'></div>
                    <div className='h-8 bg-white/10 rounded border border-white/20'></div>
                    <div className='grid grid-cols-5 gap-2'>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className='h-8 bg-white/10 rounded border border-white/20 flex items-center justify-center'
                        >
                          <Star className='w-4 h-4 text-yellow-400' />
                        </div>
                      ))}
                    </div>
                    <div className='h-16 bg-white/10 rounded border border-white/20'></div>
                    <div className='h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center'>
                      <span className='text-sm font-semibold'>
                        Submit Feedback
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id='testimonials' className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='text-center mb-16'
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-5xl font-bold mb-6'
            >
              Loved by Teams Worldwide
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl text-gray-600 max-w-3xl mx-auto'
            >
              Join thousands of satisfied customers who have transformed their
              data collection
            </motion.p>
          </motion.div>

          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={fadeInUp}
            className='relative'
          >
            <div className='bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-gray-200 shadow-xl'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className='text-center'
                >
                  <div className='flex justify-center mb-6'>
                    {[...Array(testimonials[currentTestimonial].rating)].map(
                      (_, i) => (
                        <Star
                          key={i}
                          className='w-6 h-6 text-yellow-400 fill-current'
                        />
                      )
                    )}
                  </div>

                  <blockquote className='text-2xl md:text-3xl text-gray-800 mb-8 leading-relaxed'>
                    &ldquo;{testimonials[currentTestimonial].content}&rdquo;
                  </blockquote>

                  <div className='flex items-center justify-center gap-4'>
                    <img
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      className='w-16 h-16 rounded-full object-cover'
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          testimonials[currentTestimonial].name
                        )}&background=random&color=fff&size=150`;
                      }}
                    />
                    <div className='text-left'>
                      <div className='font-semibold text-gray-900 text-lg'>
                        {testimonials[currentTestimonial].name}
                      </div>
                      <div className='text-gray-600'>
                        {testimonials[currentTestimonial].role} at{' '}
                        {testimonials[currentTestimonial].company}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Testimonial Navigation */}
              <div className='flex justify-center mt-8 space-x-2'>
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                      index === currentTestimonial
                        ? 'bg-blue-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Customer Logos */}
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={fadeInUp}
            className='mt-16 text-center'
          >
            <p className='text-gray-600 mb-8'>Trusted by leading companies</p>
            <div className='flex flex-wrap justify-center items-center gap-8 opacity-60'>
              {[
                'TechCorp',
                'StartupXYZ',
                'Global Inc',
                'Innovation Co',
                'Future Labs',
                'Digital Plus',
              ].map((company, index) => (
                <div key={index} className='text-2xl font-bold text-gray-400'>
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id='pricing'
        className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50'
      >
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='text-center mb-16'
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-5xl font-bold mb-6'
            >
              Choose Your Perfect Plan
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl text-gray-600 max-w-3xl mx-auto mb-8'
            >
              Start free and upgrade as you grow. All plans include our core
              features.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className='inline-flex items-center gap-2 bg-yellow-100 border border-yellow-200 rounded-full px-4 py-2'
            >
              <Zap className='w-4 h-4 text-yellow-600' />
              <span className='text-sm font-medium text-yellow-700'>
                Save 50% with yearly billing
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-lg hover:shadow-xl relative ${
                  plan.popular
                    ? 'border-blue-500 ring-4 ring-blue-100 scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className='absolute -top-4 left-1/2 transform -translate-x-1/2 z-10'>
                    <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold'>
                      Most Popular
                    </div>
                  </div>
                )}

                <div
                  className={`w-full h-2 bg-gradient-to-r ${plan.gradient} rounded-t-3xl absolute top-0 left-0 right-0`}
                ></div>

                <div className='text-center mt-4 mb-6'>
                  <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                    {plan.name}
                  </h3>
                  <p className='text-gray-600 mb-4'>{plan.description}</p>

                  <div className='mb-4'>
                    {plan.price === 'Free' ? (
                      <span className='text-4xl font-bold text-gray-900'>
                        Free
                      </span>
                    ) : (
                      <div className='flex items-center justify-center gap-2'>
                        {plan.yearlyDiscount && (
                          <span className='text-lg line-through text-gray-400'>
                            {plan.originalPrice}
                          </span>
                        )}
                        <span className='text-4xl font-bold text-gray-900'>
                          {plan.price}
                        </span>
                        <span className='text-gray-600'>{plan.period}</span>
                      </div>
                    )}
                  </div>

                  <Link href='/auth/signup'>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all cursor-pointer ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                          : plan.price === 'Free'
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          : `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg`
                      }`}
                    >
                      {plan.price === 'Free'
                        ? 'Get Started'
                        : 'Start Free Trial'}
                    </motion.button>
                  </Link>
                </div>

                <div className='space-y-3'>
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className='flex items-center gap-3'>
                      <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0' />
                      <span className='text-gray-700 text-sm'>{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.yearlyDiscount && (
                  <div className='mt-4 text-center'>
                    <span className='inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full'>
                      <Zap className='w-3 h-3' />
                      Yearly: Save 50%
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Enterprise CTA */}
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={fadeInUp}
            className='mt-16 text-center'
          >
            <div className='bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white'>
              <h3 className='text-3xl font-bold mb-4'>
                Need something custom?
              </h3>
              <p className='text-xl text-gray-300 mb-8 max-w-2xl mx-auto'>
                Contact our enterprise team for custom solutions, dedicated
                support, and volume pricing.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all cursor-pointer'
              >
                Contact Sales
              </motion.button>
            </div>
          </motion.div>

          {/* Features included in all plans */}
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={fadeInUp}
            className='mt-16'
          >
            <div className='bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200'>
              <h3 className='text-2xl font-bold text-center mb-8 text-gray-900'>
                All Plans Include
              </h3>
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[
                  'Unlimited form fields',
                  'Real-time notifications',
                  'Data export (CSV, Excel)',
                  'Mobile responsive forms',
                  'SSL encryption',
                  'Basic analytics',
                  'Email support',
                  'Custom branding',
                  'Webhook integrations',
                ].map((feature, index) => (
                  <div key={index} className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0' />
                    <span className='text-gray-700'>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='text-center mb-16'
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-5xl font-bold mb-6'
            >
              Enterprise-Grade Security
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl text-gray-600 max-w-3xl mx-auto'
            >
              Your data is protected with bank-level security and compliance
              standards
            </motion.p>
          </motion.div>

          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'
          >
            {[
              {
                icon: Shield,
                title: 'SSL Encryption',
                desc: '256-bit encryption',
              },
              {
                icon: Lock,
                title: 'GDPR Compliant',
                desc: 'Privacy by design',
              },
              {
                icon: Cloud,
                title: '99.9% Uptime',
                desc: 'Reliable infrastructure',
              },
              {
                icon: Award,
                title: 'SOC 2 Certified',
                desc: 'Security standards',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className='text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-gray-300 transition-all'
              >
                <div className='w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white'>
                  <item.icon className='w-8 h-8' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {item.title}
                </h3>
                <p className='text-gray-600'>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integration Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='text-center mb-16'
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-5xl font-bold mb-6'
            >
              Seamless Integrations
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl text-gray-600 max-w-3xl mx-auto'
            >
              Connect FormIQ with your favorite tools and automate your
              workflows
            </motion.p>
          </motion.div>

          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
            className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8'
          >
            {[
              'Slack',
              'Gmail',
              'Zapier',
              'HubSpot',
              'Salesforce',
              'Notion',
              'Trello',
              'PayPal',
              'Stripe',
              'Google Sheets',
              'Mailchimp',
              'Discord',
            ].map((integration, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ scale: 1.1 }}
                className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center justify-center'
              >
                <span className='text-lg font-semibold text-gray-700'>
                  {integration}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={fadeInUp}
            className='text-center mt-12'
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer'
            >
              View All Integrations
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white'>
        <div className='max-w-4xl mx-auto text-center'>
          <motion.div
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeInUp}
              className='text-4xl md:text-6xl font-bold mb-6'
            >
              Ready to Transform Your Forms?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className='text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed'
            >
              Join thousands of businesses using FormIQ to collect better data,
              gain deeper insights, and automate their workflows.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className='flex flex-col sm:flex-row gap-4 justify-center items-center'
            >
              <Link href='/auth/signup'>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  className='bg-white text-blue-900 px-10 py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer'
                >
                  Start Building for Free
                  <ArrowRight className='w-6 h-6' />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('features')}
                className='bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-3 cursor-pointer'
              >
                <Rocket className='w-6 h-6' />
                Explore Features
              </motion.button>
            </motion.div>

            <motion.div variants={fadeInUp} className='mt-12 text-blue-200'>
              <p className='text-lg'>
                ✨ No credit card required • Free forever plan • Setup in 2
                minutes
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-4 gap-8 mb-12'>
            {/* Brand */}
            <div className='md:col-span-1'>
              <div className='flex items-center space-x-2 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center'>
                  <Image
                    src='/LOGO.png'
                    alt='Logo'
                    width={50}
                    height={50}
                    priority
                  />
                </div>
                <span className='text-2xl font-bold'>FormIQ</span>
              </div>
              <p className='text-gray-400 mb-6'>
                The intelligent form builder that helps you collect, analyze,
                and act on your data with AI-powered insights.
              </p>
              <div className='flex space-x-4'>
                {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                  <button
                    key={social}
                    className='w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center cursor-pointer'
                  >
                    <Share2 className='w-5 h-5' />
                  </button>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className='text-lg font-semibold mb-6'>Product</h3>
              <div className='space-y-4 text-gray-400'>
                <button
                  onClick={() => scrollToSection('features')}
                  className='block hover:text-white transition-colors cursor-pointer'
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className='block hover:text-white transition-colors cursor-pointer'
                >
                  Pricing
                </button>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Templates
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Integrations
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  API
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className='text-lg font-semibold mb-6'>Company</h3>
              <div className='space-y-4 text-gray-400'>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  About
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Blog
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Careers
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Contact
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Press
                </a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className='text-lg font-semibold mb-6'>Support</h3>
              <div className='space-y-4 text-gray-400'>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Help Center
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Documentation
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Community
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors'
                >
                  Status
                </a>
                <a
                  href='#'
                  className='block hover:text-white transition-colors items-center gap-2'
                >
                  24/7 Support
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className='border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center'>
            <div className='text-gray-400 text-sm'>
              © 2025 FormIQ. All rights reserved.
            </div>
            <div className='flex space-x-6 text-gray-400 text-sm mt-4 md:mt-0'>
              <a href='#' className='hover:text-white transition-colors'>
                Privacy Policy
              </a>
              <a href='#' className='hover:text-white transition-colors'>
                Terms of Service
              </a>
              <a href='#' className='hover:text-white transition-colors'>
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className='fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 cursor-pointer'
          >
            <ChevronUp className='w-6 h-6' />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
