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

## Deploy on Vercel

**From this repo (monorepo):** Deploy the `web-showcase` app only.

1. **CLI (from this directory):**
   ```bash
   npx vercel login   # once, to link your account
   cd web-showcase
   npx vercel         # preview
   npx vercel --prod  # production
   ```

2. **Vercel Dashboard:** [Import from Git](https://vercel.com/new). Set **Root Directory** to `web-showcase` so Vercel builds this Next.js app.

The app is optimized for Vercel (Next.js 16, `next/font`, security headers, production build settings).
