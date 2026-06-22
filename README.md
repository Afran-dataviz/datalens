# DataLens

AI-powered data analytics and visualization platform built with Next.js, TypeScript, Supabase, Groq AI, and Stripe.

DataLens enables users to upload datasets, clean and analyze data, generate visual insights, interact with AI through natural language conversations, and manage subscriptions through a secure payment system.

## 🚀 Live Demo

https://datalens-blond.vercel.app/

---

## 📸 Project Showcase

![DataLens Showcase](./collage.png)

---

## ✨ Features

### 🤖 AI-Powered Analytics
- Conversational AI chat interface
- Natural language data exploration
- AI-generated insights and recommendations
- Fast response generation using Groq AI

### 📊 Data Processing & Visualization
- Upload CSV, Excel, and JSON datasets
- Automatic data cleaning
- Duplicate detection and removal
- Missing value handling
- Interactive dashboard visualizations

### 🔐 Authentication & User Management
- Secure user registration and login
- Password recovery workflow
- Protected user dashboard
- Session management with Supabase

### 💳 Payments & Subscription Management
- Stripe Checkout integration
- Subscription billing management
- Customer billing portal
- Webhook-based payment synchronization
- Subscription status tracking

### 📈 Admin Dashboard
- User analytics and telemetry
- Monthly recurring revenue (MRR) tracking
- Dataset usage statistics
- Platform monitoring tools
- Broadcast notification system

### 📱 Modern User Experience
- Mobile-first responsive design
- Dark/Light mode support
- Clean SaaS-style interface
- Fast and optimized performance

---

## 🏗️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- Server-side API integrations

### Database & Authentication
- Supabase
- Supabase Authentication

### Artificial Intelligence
- Groq API

### Payments
- Stripe Checkout
- Stripe Billing Portal
- Stripe Webhooks

### Deployment
- Vercel

---

## 🧠 System Architecture

```text
User
 │
 ▼
Next.js Frontend
 │
 ├── Groq AI
 ├── Supabase Database
 ├── Supabase Authentication
 └── Stripe Payments
```

The application uses secure server-side API routes to communicate with external services while protecting sensitive credentials through environment variables.

---

## 🔥 Key Highlights

- Full-stack SaaS application
- AI-assisted data analysis workflow
- Subscription-based monetization
- Authentication and role-based access
- Stripe webhook implementation
- Admin telemetry dashboard
- Responsive design across devices
- Production deployment on Vercel

---

## 🛠️ Installation

Clone the repository:

```bash
git clone https://github.com/Afran-dataviz/datalens.git
cd datalens
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GROQ_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🎯 Future Enhancements

- Advanced visualization types
- Multi-user collaboration
- AI-generated reports
- Export dashboards as PDF
- Data pipeline automation
- Enhanced analytics capabilities

---

## 👨‍💻 Author

**Afran**

Built using modern AI-assisted development workflows while integrating authentication, databases, AI services, payment processing, and SaaS infrastructure into a production-ready application.

---

## 📄 License

This project is available for educational and portfolio purposes.
