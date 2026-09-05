# Resumi

<div align="center">

**Modern AI-Powered Resume Builder for Professionals**

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4+-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Project Structure](#project-structure) • [Contributing](#contributing)

</div>

---

## 📋 About

Resumi is a comprehensive resume management and building platform designed for professionals and employers. It combines an intelligent resume builder with advanced ATS optimization, AI-powered content generation, and a complete employer hiring workflow system.

Whether you're a job seeker perfecting your resume or an employer building your hiring process, Resumi provides the tools you need.

## ✨ Key Features

### For Job Seekers
*   **Interactive Canvas Editor** - Click and type directly on your resume with instant formatting updates
*   **AI-Powered Writing** - Get suggestions to enhance your professional summary and experience descriptions
*   **ATS Scoring System** - Real-time compatibility analysis with 1000+ ATS systems
*   **Smart Templates** - Choose from professional layouts with customizable themes
*   **One-Click Apply** - Apply to jobs directly through the platform
*   **Saved Jobs** - Bookmark and organize job listings for later

### For Employers
*   **Job Posting Management** - Create, edit, and publish job listings
*   **Applicant Tracking** - Manage applications with status tracking
*   **Interview Scheduling** - Built-in interview coordination tools
*   **Candidate Communication** - Message candidates directly
*   **Analytics Dashboard** - Track hiring metrics and performance

## 🛠️ Tech Stack

### Frontend
*   **Framework:** [Next.js 16+](https://nextjs.org/) - React framework with App Router
*   **Language:** [TypeScript 5+](https://www.typescriptlang.org/) - Type-safe JavaScript
*   **Styling:** [Tailwind CSS 4+](https://tailwindcss.com/) - Utility-first CSS framework
*   **Icons:** [Lucide React](https://lucide.dev/) - Clean SVG icon library
*   **Animation:** [Framer Motion](https://www.framer.com/motion/) - Production-ready animations
*   **PDF Generation:** [PDF.js](https://mozilla.github.io/pdf.js/) - PDF parsing and rendering
*   **Auth:** [Clerk](https://clerk.com/) - Modern authentication and user management

### Backend
*   **Runtime:** Node.js with Next.js API Routes
*   **ORM:** [Prisma](https://www.prisma.io/) - Next-generation database toolkit
*   **Database:** [PostgreSQL](https://www.postgresql.org/) - Powerful, open-source relational database
*   **Email:** SendGrid/Resend - Email delivery service

### Infrastructure & DevOps
*   **Version Control:** Git & GitHub
*   **CI/CD:** GitHub Actions
*   **Database Hosting:** Neon (serverless PostgreSQL)
*   **Deployment:** Vercel

## 📁 Project Structure

The project follows a **feature-based architecture** for scalability and maintainability:

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── messages/
│   │   └── ...
│   ├── dashboard/                # Job seeker dashboard
│   ├── employer/                 # Employer portal
│   ├── resume/                   # Resume builder
│   └── ...                       # Other pages
│
├── components/                   # React Components
│   ├── features/                 # Feature-specific components
│   │   ├── dashboard/
│   │   ├── employer/
│   │   ├── resume/
│   │   └── ...
│   ├── layout/                   # Shared layout components
│   └── ui/                       # Reusable UI components
│
├── lib/                          # Utilities & Helpers
│   ├── prisma.ts
│   └── ...
│
└── types/                        # TypeScript types

prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Database migrations
```

📖 See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for a detailed breakdown of the architecture and guidelines for adding new features.

## 🚀 Quick Start

### Prerequisites

*   **Node.js** 18+ ([Download](https://nodejs.org/))
*   **PostgreSQL** 14+ ([Setup Guide](https://www.postgresql.org/download/))
*   **Git** ([Download](https://git-scm.com/))
*   API Keys:
    *   Clerk account for authentication
    *   OpenAI API (optional, for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/resumi.git
   cd resumi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/resumi"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret

   # AI Services (Optional)
   OPENAI_API_KEY=your_openai_key

   # App URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev -- -p 3001  # Start on custom port

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma migrate dev  # Run migrations
npx prisma studio      # Open Prisma Studio GUI

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript types
```

## 🏗️ Architecture

### Component Organization
Components are organized by **feature domain** rather than type:

- **`features/`** - Feature-specific components (dashboard, employer, resume, etc.)
- **`layout/`** - Shared structural components (header, footer)
- **`ui/`** - Reusable UI components (buttons, modals, toasts)

This structure makes it easier to:
- ✓ Find all related components for a feature in one place
- ✓ Understand feature boundaries
- ✓ Scale and refactor features independently
- ✓ Onboard new developers quickly

### Database Schema
The application uses Prisma ORM with PostgreSQL:

- **User** - User profiles and authentication
- **Resume** - Resume documents and versions
- **Job** - Job postings
- **Application** - Job applications
- **Message** - Direct messaging between users
- **Notification** - In-app notifications

## 🔄 Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes:**
   - Follow the established component structure
   - Use TypeScript for type safety
   - Write clean, well-documented code

3. **Test your changes:**
   ```bash
   npm run dev
   ```

4. **Commit with conventional commits:**
   ```bash
   git commit -m "feat: add new feature description"
   git commit -m "fix: resolve issue description"
   git commit -m "chore: update dependencies"
   ```

5. **Push and create a Pull Request:**
   ```bash
   git push origin feat/my-feature
   ```

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, meaningful commit history:

```
<type>(<scope>): <description>

<body (optional)>

<footer (optional)>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `test:` - Test additions or updates
- `perf:` - Performance improvements

### Examples
```bash
git commit -m "feat: add job search filters"
git commit -m "fix: resolve resume PDF export issue"
git commit -m "refactor: reorganize component structure"
git commit -m "chore: update dependencies to latest versions"
git commit -m "docs: update PROJECT_STRUCTURE.md with new guidelines"
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feat/AmazingFeature`)
3. **Commit your changes** (follow [Conventional Commits](#commit-message-convention))
4. **Push to your fork** (`git push origin feat/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines
- ✓ Ensure TypeScript types are properly defined
- ✓ Follow the existing code style and folder structure
- ✓ Add appropriate Tailwind classes for styling
- ✓ Test your changes locally before pushing
- ✓ Write meaningful commit messages
- ✓ Update documentation if needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [Prisma](https://www.prisma.io/)
- Icons from [Lucide React](https://lucide.dev/)
- Authentication by [Clerk](https://clerk.com/)

## 📞 Support

For support, questions, or feedback:
- Open an [Issue](https://github.com/yourusername/resumi/issues)
- Check existing [Documentation](PROJECT_STRUCTURE.md)
- Review [Discussions](https://github.com/yourusername/resumi/discussions)

## 📁 Project Structure

*   `/src/app`: Next.js App Router pages and API routes.
*   `/src/components/resume`: Core builder components including the `CanvasEditor`, `BuilderSidebar`, and `PropertiesSidebar`.
*   `/src/types`: Shared TypeScript interfaces for strict typing across the application.
*   `/src/lib`: Utility functions, formatting tools, and the Prisma client instance.

## ☁️ Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. Ensure you configure your build settings and environment variables (like `DATABASE_URL`) in your hosting provider's dashboard.