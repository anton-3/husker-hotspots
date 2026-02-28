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

### Mapbox token (required for campus map)

The campus map uses Mapbox for tiles and 3D buildings. You need a Mapbox access token:

1. Sign up at [mapbox.com](https://www.mapbox.com) and create an access token.
2. Copy `.env.example` to `.env.local` in the `frontend` folder.
3. Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here` in `.env.local`.

Do not commit `.env.local`; it is gitignored.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Mock data

The map currently uses **mock data** for the heatmap timeline and campus buildings:

- **Buildings** (`lib/mockData/buildings.ts`): Kauffman Residential Center and a few other UNL buildings with approximate footprints. Click a building to zoom in and see details in the sidebar.
- **Activity** (`lib/mockData/activity.ts`): One week of generated activity points (class, club, food, sports, exam, reservation, testing) with time-of-day variation. Use the timeline slider or Play to scrub through time; the heatmap updates by hour.

### Adding real data later

When you connect real data sources, keep the same shapes where possible:

- **Activity**: `{ longitude, latitude, weight, timestamp (Unix ms), source }` with `source` one of: `class`, `club`, `food`, `sports`, `exam`, `reservation`, `testing`.
- **Buildings**: `{ id, name, address?, center: [lng, lat], polygon (GeoJSON Polygon), height? }`.

Replace the mock arrays in `lib/mockData/` with API calls or imports from your backend; the map and timeline will work with the existing types and filters.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
