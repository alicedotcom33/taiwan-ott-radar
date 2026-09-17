# Cloudflare deployment

The `next-source-upgrade` branch is ready to deploy as one Cloudflare Worker with Static Assets.

## Included automatically
- Frontend: `public/`
- API: `/api/feed`, `/api/refresh`, `/api/health`
- Storage binding: `OTT_DATA` (KV)
- KV auto-provisioning on first Cloudflare deployment
- Cron: daily at 06:15 Asia/Taipei (22:15 UTC)
- Seven platforms: iQIYI, friDay影音, Netflix, Disney+, Hami Video, MyVideo, LINE TV
- Existing verified releases persist in KV

## Cloudflare dashboard deployment
Connect the GitHub repository `alicedotcom33/taiwan-ott-radar`, select branch `next-source-upgrade`, and deploy it as a Workers project. The repository's `wrangler.toml` is the source of truth. Static assets are restricted to `public/`, so dependencies such as `node_modules` are never uploaded as website assets.

## CLI equivalent
```sh
npm install
npm run deploy
```

Cloudflare will deploy the Worker and static assets together. Cron and KV are declared in `wrangler.toml`, so there is no daily manual maintenance after the first deployment.

The Netlify production site remains untouched until this Cloudflare version is verified.
