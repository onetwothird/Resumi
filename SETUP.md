# 🚀 Complete Setup Guide for Resumi

This guide walks you through setting up Resumi locally after cloning the repository. It covers all external services and databases you need.

## 📋 Prerequisites

Before you start, ensure you have:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **GitHub account** (to clone the repo)

## 🔑 Required Services

Resumi uses several external services for full functionality. You'll need accounts for:

1. **[Neon](https://neon.tech/)** - PostgreSQL database (FREE tier available)
2. **[Clerk](https://clerk.com/)** - Authentication (FREE tier available)
3. **[Google AI Studio](https://makersuite.google.com/app/apikey)** - Gemini API (FREE tier available)
4. **[Cloudinary](https://cloudinary.com/)** - File upload service (FREE tier available)

---

## 📦 Step-by-Step Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/Resumi.git
cd Resumi
```

### 2️⃣ Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js
- React
- TypeScript
- Prisma (Database ORM)
- Tailwind CSS
- And more...

### 3️⃣ Set Up Neon Database

#### What is Neon?
Neon is a **serverless PostgreSQL database provider** that:
- ✓ Requires no local PostgreSQL installation
- ✓ Auto-scales to zero when not in use
- ✓ Offers a FREE tier perfect for development
- ✓ Provides connection pooling for better performance
- ✓ Includes a web console for database management

#### Create a Neon Account & Database

1. **Go to [neon.tech](https://neon.tech/) and sign up** (FREE)

2. **Create a new project:**
   - Click "New Project"
   - Give it a name (e.g., "Resumi-Dev")
   - Select your region (choose closest to you)
   - PostgreSQL version: 15 (recommended)
   - Click "Create project"

3. **Get your connection string:**
   - After project creation, you'll see the "Connection string"
   - It looks like: `postgresql://user:password@host/database?sslmode=require`
   - Copy the connection string (it's auto-selected)

4. **Add to your .env.local file:**
   ```bash
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

#### Initialize Your Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma db push
```

✅ Your Neon database is now ready!

### 4️⃣ Set Up Clerk Authentication

#### What is Clerk?
Clerk provides **modern authentication** including:
- ✓ Email/password login
- ✓ Social login (Google, GitHub, etc.)
- ✓ User management dashboard
- ✓ Built-in UI components
- ✓ FREE tier with unlimited users

#### Create a Clerk Account & Application

1. **Go to [clerk.com](https://clerk.com/) and sign up** (FREE)

2. **Create a new application:**
   - Click "Create Application"
   - Choose your authentication methods
   - Copy your API keys

3. **Add to your .env.local:**
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   ```

4. **Configure Redirect URLs in Clerk Dashboard:**
   - Go to Settings → Allowed Redirect URLs
   - Add: `http://localhost:3000`
   - Add: `http://localhost:3000/sign-in`
   - Add: `http://localhost:3000/sign-up`

✅ Clerk authentication is now configured!

### 5️⃣ Set Up Google AI (Gemini)

#### What is Gemini?
Gemini API provides **AI-powered features** like:
- ✓ Resume content enhancement
- ✓ Writing suggestions
- ✓ FREE tier with generous limits

#### Create a Google AI API Key

1. **Go to [Google AI Studio](https://makersuite.google.com/app/apikey)**

2. **Click "Create API Key"** (FREE)

3. **Select "Google AI Studio"** and create the key

4. **Add to your .env.local:**
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

✅ AI features are now enabled!

### 6️⃣ Set Up Cloudinary (File Uploads)

#### What is Cloudinary?
Cloudinary handles **file uploads and storage** for:
- ✓ Profile pictures
- ✓ Resume PDFs
- ✓ Document uploads
- ✓ FREE tier with 25GB storage

#### Create a Cloudinary Account

1. **Go to [cloudinary.com](https://cloudinary.com/) and sign up** (FREE)

2. **Get your API credentials:**
   - Go to Dashboard
   - You'll see: Cloud Name, API Key, API Secret

3. **Add to your .env.local:**
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

✅ File uploads are now configured!

### 7️⃣ Complete .env.local File

After all steps above, your `.env.local` should look like:

```bash
# Database (Neon)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# File Uploads (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Management

### View Database in Neon Console

1. Go to [neon.tech](https://neon.tech/)
2. Log in to your project
3. Click "SQL Editor" to run queries
4. Or use Tables view to browse data

### View Database Locally with Prisma Studio

```bash
npx prisma studio
```

This opens an interactive database GUI at `http://localhost:5555`

### Run Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_new_feature

# Apply migrations without creating a new one
npx prisma db push
```

---

## 📁 Environment Variables Explained

| Variable | Purpose | Where to Get | Required |
|----------|---------|--------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Neon Dashboard | ✅ Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Clerk Dashboard | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard | ✅ Yes |
| `GEMINI_API_KEY` | Google AI API key | Google AI Studio | ⚠️ Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary Dashboard | ⚠️ Optional |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Cloudinary Dashboard | ⚠️ Optional |

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to Git
- `.env.local` is already in `.gitignore`
- Keep your API keys private!
- If you accidentally commit keys, regenerate them immediately

---

## 🆘 Troubleshooting

### "Can't connect to database"
- ✓ Check `DATABASE_URL` is correct in `.env.local`
- ✓ Ensure your Neon project is active
- ✓ Check your internet connection
- ✓ Verify the connection string hasn't expired

### "Prisma schema is out of sync"
```bash
npx prisma generate
npx prisma db push
```

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
# Or kill the process using port 3000
```

### "Clerk not authenticating"
- ✓ Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- ✓ Check Redirect URLs in Clerk Dashboard
- ✓ Ensure you're on `http://localhost:3000` (not 127.0.0.1)

---

## 📚 Useful Links

- **Neon Docs:** https://neon.tech/docs
- **Clerk Docs:** https://clerk.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind Docs:** https://tailwindcss.com/docs

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm install` completes without errors
- [ ] `.env.local` has all required variables
- [ ] `npx prisma db push` succeeds
- [ ] `npm run dev` starts without errors
- [ ] App loads at `http://localhost:3000`
- [ ] Can sign up/login with Clerk
- [ ] Can create/edit resume
- [ ] Can upload files (if Cloudinary configured)

---

## 🎯 Next Steps

1. Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) to understand the codebase
2. Check [README.md](README.md) for development guidelines
3. Make your first feature contribution!

---

**Questions?** Check the README or open an issue on GitHub!

---

**Last Updated:** September 6, 2026
