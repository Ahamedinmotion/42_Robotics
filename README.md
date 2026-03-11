# 42 Robotics Club Platform

Welcome to the 42 Robotics Club platform, a comprehensive Next.js web application designed to manage and showcase the activities, members, and projects of the 42 Robotics Club.

## Features

- **Student Portal**: Access to home, personalized profiles, and cursus tracking.
- **Admin Dashboard**: Comprehensive tools for managing members, teams, and tracking reports.
- **Authentication**: Secure login and session management powered by NextAuth.js and Prisma.
- **Showcase**: Dedicated section to display robotics projects and achievements.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & PostCSS
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed. The project uses Prisma, so a database connection string is required in your `.env` file.

### Installation

1. Clone the repository.
2. Navigate to the project directory:
   ```bash
   cd robotics-club
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Database Commands

- Generate Prisma Client: `npm run db:generate`
- Push schema to database: `npm run db:push`
- Run migrations: `npm run db:migrate`
- Seed database: `npm run db:seed`
- Open Prisma Studio: `npm run db:studio`

## Structure

- `src/app/(admin)`: Admin specific pages and layouts.
- `src/app/(student)`: Student portal including cursus, home, and profile.
- `src/app/(auth)`: Authentication related pages.
- `src/app/api`: Backend API routes.
- `src/components`: Reusable React components.
