const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'FormIQ',
  url: APP_URL,
  description:
    'An AI-powered form builder that lets you create intelligent forms, surveys, and quizzes in seconds. Auto-generate questions using AI, evaluate responses smartly, and collect data effortlessly.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  inLanguage: 'en-US',
  author: {
    '@type': 'Person',
    name: 'Ashish Jethva',
    url: 'https://ashishjethva.com',
    email: 'jethvaashish2914@gmail.com',
    sameAs: [
      'https://ashishjethva.com',
      'https://github.com/AshishJethva',
      'https://www.linkedin.com/in/ashishjethva/',
      'https://x.com/ashish__jethva',
    ],
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free plan available. Pro and Enterprise plans coming soon.',
  },
  featureList: [
    'AI-powered form generation',
    'Drag and drop form builder',
    'Smart response evaluation',
    'Multi-page forms',
    'File upload support',
    'Real-time form analytics',
    'Quiz and survey builder',
    'Form submission management',
  ],
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ashish Jethva',
  url: 'https://ashishjethva.com',
  email: 'jethvaashish2914@gmail.com',
  sameAs: [
    'https://ashishjethva.com',
    'https://github.com/AshishJethva',
    'https://www.linkedin.com/in/ashishjethva/',
    'https://x.com/ashish__jethva',
  ],
  knowsAbout: [
    'Web Development',
    'Full Stack Development',
    'Artificial Intelligence',
    'React',
    'Next.js',
    'Node.js',
    'TypeScript',
  ],
};

export default function JsonLd() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </>
  );
}
