# WatchHub

**Watch. Talk. Play. Together.**

WatchHub is a social watch-together and video-chat platform where friends can watch, chat, play, and hang out together in virtual rooms.

## 🚀 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (Auth.js) |
| Validation | Zod |
| Password Hashing | bcryptjs |
| Icons | Lucide React |

## 📋 Requirements

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** 14+
- **npm** 9+

## 🛠️ Installation

### 1. Clone the repository

```bash
cd watchhub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/watchhub?schema=public"

# Auth Secret - Generate with: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-here"

# App URL
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="WatchHub"
```

### 4. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE watchhub;
```

Push the Prisma schema to the database:

```bash
npx prisma db push
```

Generate the Prisma client:

```bash
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Creating the database

Using `psql`:

```bash
psql -U postgres
CREATE DATABASE watchhub;
\q
```

Or using pgAdmin/any PostgreSQL GUI client.

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create a migration
npx prisma migrate dev --name init

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 🏗️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript checks
npx tsc --noEmit

# Run ESLint
npm run lint

# Format with Prisma
npx prisma format
```

## 🏭 Production Build

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

## 📁 Project Structure

```
watchhub/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Registration page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts    # NextAuth handler
│   │   │   └── register/
│   │   │       └── route.ts    # Registration API
│   │   └── user/
│   │       ├── profile/
│   │       │   └── route.ts    # Profile API
│   │       └── password/
│   │           └── route.ts    # Password change API
│   └── (protected)/
│       ├── layout.tsx          # Protected route layout
│       ├── dashboard/
│       │   └── page.tsx        # Dashboard
│       ├── profile/
│       │   └── page.tsx        # User profile
│       └── settings/
│           └── page.tsx        # Settings
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── providers/
│   │   ├── session-provider.tsx
│   │   └── theme-provider.tsx
│   └── ui/
│       ├── form-field.tsx
│       └── loading-spinner.tsx
├── hooks/
│   └── use-current-user.ts
├── lib/
│   ├── auth/
│   │   ├── auth.ts             # NextAuth config
│   │   └── auth.config.ts      # Auth edge config
│   ├── db/
│   │   └── prisma.ts           # Prisma client
│   ├── validation/
│   │   └── schemas.ts          # Zod schemas
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
├── types/
│   └── index.ts                # TypeScript types
├── middleware.ts                # Route protection
├── .env.example                # Environment template
└── package.json
```

## 🔐 Authentication

- **Registration**: Email, username, password with Zod validation
- **Login**: Email + password with bcrypt verification
- **Sessions**: JWT-based, 30-day expiry
- **Protected Routes**: Middleware-based route protection
- **Password Hashing**: bcrypt with 12 salt rounds

## 🗺️ Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public (redirects if authenticated) | Login page |
| `/register` | Public (redirects if authenticated) | Registration page |
| `/dashboard` | Protected | User dashboard |
| `/profile` | Protected | User profile |
| `/settings` | Protected | User settings |

## 🎨 Features (Phase 1)

- ✅ Beautiful dark-first landing page
- ✅ User registration with validation
- ✅ User login with session management
- ✅ Secure logout
- ✅ Protected dashboard
- ✅ User profile with editing
- ✅ Settings (password change, theme toggle, privacy placeholders)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark/Light/System theme switching
- ✅ Polished UI with gradients and animations

## 🔮 Upcoming (Phase 2+)

- 🎬 Watch Together (synchronized video)
- 📹 Video Chat (WebRTC)
- 💬 Real-Time Chat
- 🖥️ Screen Sharing
- 🎮 Mini Games
- 🎵 Shared Playlists
- 👥 Friends System
- 🔔 Notifications

## 📄 License

This project is proprietary. All rights reserved.
