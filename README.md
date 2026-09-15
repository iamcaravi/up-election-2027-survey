This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Database

`prisma/schema.prisma` targets PostgreSQL (`provider = "postgresql"`). `DATABASE_URL` must point at a Postgres connection string in every environment, including local development — there is no SQLite fallback.

### Local development database

1. Run a local Postgres instance (e.g. `docker run --name votersurvey-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`, or any local/hosted Postgres you already have).
2. Set `DATABASE_URL` in `.env` to that instance, e.g. `postgresql://postgres:postgres@localhost:5432/votersurvey`.
3. Run `npx prisma migrate deploy` to apply `prisma/migrations/` against it, then `npm run seed` to populate structural data (states, elections, parties, constituencies, FAQ, admin account — no survey votes).

The previous SQLite file (`prisma/dev.db`) is left in place untouched as a reference/backup but is no longer read by the app once `DATABASE_URL` points at Postgres.

### Production database

1. Provision a hosted Postgres database (Netlify DB, Neon, Supabase, RDS, etc.).
2. Set `DATABASE_URL` in Netlify's environment variables to that database's connection string.
3. Before the first deploy, run `npx prisma migrate deploy` against that `DATABASE_URL` to create the schema from `prisma/migrations/`.
4. Optionally run the seed script (`npm run seed`, with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set) to create structural data and the initial admin account. This never creates survey responses.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
