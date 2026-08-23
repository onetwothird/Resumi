# Resumi

Resumi is a modern, AI-powered resume builder designed to help professionals create beautiful, ATS-optimized resumes in minutes. Built with a focus on user experience, it features a live, interactive canvas editor, AI-assisted content generation, and real-time formatting controls.

## ✨ Features

*   **Interactive Canvas Editor:** Click and type directly on the resume canvas with inline editing and a floating rich-text toolbar.
*   **AI-Powered Enhancements:** Automatically rewrite and improve professional summaries using integrated AI tools.
*   **ATS Optimization Scanner:** Built-in ATS scoring system that analyzes resume content and provides actionable recommendations to pass automated filters.
*   **Customizable Layouts & Themes:** Choose between Classic, Modern, and Minimal layouts, with full control over typography, font sizes, and accent colors.
*   **Dynamic Sections:** Easily add, edit, and reorganize experience, education, skills, and certifications.

## 🛠️ Tech Stack

This project is built with a modern web development stack:

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Library:** [React](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Database ORM:** [Prisma](https://www.prisma.io/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js installed on your machine. You will also need a PostgreSQL database instance and the appropriate AI API keys.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/resumi.git](https://github.com/yourusername/resumi.git)
   cd resumi
2. Install dependencies::
   ```bash
   npm install # or yarn install / pnpm install
3. Set up your environment variables. Create a .env file in the root directory and add your database URL and necessary API keys (e.g., for Prisma and AI integrations):
    ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/resumi" # Add your AI API key here (e.g., OpenAI)
4. Run database migrations:
   ```bash
   npx prisma db push
5. Start the development server:
   ```bash
   npm run dev
6. Open http://localhost:3000 with your browser to see the application.

## 📁 Project Structure

*   `/src/app`: Next.js App Router pages and API routes.
*   `/src/components/resume`: Core builder components including the `CanvasEditor`, `BuilderSidebar`, and `PropertiesSidebar`.
*   `/src/types`: Shared TypeScript interfaces for strict typing across the application.
*   `/src/lib`: Utility functions, formatting tools, and the Prisma client instance.

## ☁️ Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. Ensure you configure your build settings and environment variables (like `DATABASE_URL`) in your hosting provider's dashboard.