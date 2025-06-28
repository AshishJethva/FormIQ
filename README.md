# FormIQ 🚀

**AI-Powered Form Builder & Response Evaluation Platform**

FormIQ is a cutting-edge full-stack application that revolutionizes form creation and response evaluation using artificial intelligence. Built with modern web technologies, it provides an intuitive interface for creating dynamic forms and intelligent analysis of responses.

## ✨ Features

- **🤖 AI-Powered Prompt Suggestion** - Get intelligent suggestions for form prompts
- **📝 AI-Powered Form Creation** - Automatically generate forms based on your requirements
- **🔄 AI-Powered Form Updation** - Seamlessly update existing forms with AI assistance
- **📊 AI-Powered Answer Evaluation** - Intelligent evaluation and scoring of form responses
- **🎨 Customizable Form Builder** - Drag-and-drop interface for creating custom forms
- **🎯 Multimodal Response Collection** - Support for text, images, and various input types
- **💳 Payment Integration** - Secure payment processing with Razorpay

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Form Management**: React Hook Form
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: Sonner (shadcn)
- **Validation**: Zod

### Backend

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer with Cloudinary
- **Email Service**: Nodemailer (Gmail)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

### AI Integration

- **AI Provider**: Google Gemini 2.0 Flash-Lite
- **Use Cases**: Form generation, content suggestions, response evaluation

### Additional Services

- **Payment Gateway**: Razorpay
- **File Storage**: Cloudinary
- **Email**: Gmail SMTP

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or later)
- MongoDB Atlas account
- Cloudinary account
- Google Gemini API key
- Razorpay account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AshishJethva/FormIQ.git
   cd formiq
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory:

   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE=your_mongodb_connection_string
   DATABASE_PASSWORD=your_database_password

   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90

   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=http://localhost:3000

   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com

   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret

   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   ```

   Create a `.env` file in the frontend directory:

   ```env
   NODE_ENV=development
   NEXT_PUBLIC_BACKEND_APP_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. **Initialize shadcn/ui**
   ```bash
   npx shadcn@latest init
   ```

### Running the Application

1. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
formiq/
├── backend/
│   ├── dist/
│   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validation/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── .next/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── config/
│   │   ├── dependencies/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
│   │   └── middleware.ts
│   ├── .env
│   ├── .gitignore
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   └── tsconfig.json
└── README.md
```

## 🔧 Development Scripts

### Backend

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Frontend

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run Next.js linting
```

## 📝 API Documentation

The backend provides RESTful APIs for:

- User authentication and authorization
- Form creation and management
- Response collection and evaluation
- File upload and management
- Payment processing

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting
- CORS protection
- Input validation with Zod
- Secure headers with Helmet

## 🚀 Deployment

### Backend Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Vercel, Railway, etc.)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to Vercel or your preferred platform
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [MongoDB Atlas](https://www.mongodb.com/atlas) for database hosting
- [Cloudinary](https://cloudinary.com/) for media management

## 📞 Support

If you have any questions or need help, please open an issue or contact us at [jethvaashish2914@gmail.com](mailto:jethvaashish2914@gmail.com).

---

**Made with ❤️ by Ashish Jethva**
