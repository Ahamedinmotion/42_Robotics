# Robotics Club Platform

A ranked engineering curriculum platform for makers at 42.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** + PostgreSQL
- **NextAuth.js** (42 OAuth)
- **Tailwind CSS**

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in `.env.local` with your values
5. Generate Prisma client:
   ```bash
   npm run db:generate
   ```
6. Push schema to database:
   ```bash
   npm run db:push
   ```
7. Seed the database:
   ```bash
   npm run db:seed
   ```
8. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `NEXTAUTH_URL` | Base URL (`http://localhost:3000` in dev) |
| `FORTYTWO_CLIENT_ID` | Your 42 OAuth app client ID |
| `FORTYTWO_CLIENT_SECRET` | Your 42 OAuth app client secret |

## First Run

After setup, visit `http://localhost:3000/login` and sign in with your 42 account.
New users are placed on the waitlist automatically.
An admin must promote you to ACTIVE status from the admin dashboard.

## Project Structure

```
src/
  app/           — Next.js App Router pages
  components/    — React components
    ui/          — Base design system components
    admin/       — Admin dashboard components
    cursus/      — Skill tree components
    home/        — Home dashboard components
    profile/     — Profile page components
    showcase/    — Showcase wall components
    layout/      — Layout wrappers
    auth/        — Auth-related components
  lib/           — Utilities and helpers
  styles/        — Global CSS
  types/         — TypeScript type definitions
prisma/
  schema.prisma  — Database schema
  seed.ts        — Development seed data
```
