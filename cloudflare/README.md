# Cloudflare deployment

This branch contains a Cloudflare Worker API designed to replace the Netlify Functions backend without changing the current production site.

## Automated behavior
- `/api/feed`: cached verified OTT data
- `/api/refresh`: queues a manual refresh
- `/api/health`: health check
- Cron: daily at 06:15 Asia/Taipei (22:15 UTC)
- KV: persists verified releases across refreshes
- Seven platforms: iQIYI, friDay影音, Netflix, Disney+, Hami Video, MyVideo, LINE TV

## One-time account setup
1. Create a Cloudflare KV namespace and bind it as `OTT_DATA`.
2. Replace `REPLACE_AFTER_KV_CREATION` in `wrangler.toml` with the namespace id.
3. Deploy the Worker.
4. Configure the Pages frontend to use the Worker API base URL.

After the one-time setup, the cron refresh is automatic. The existing Netlify production site can remain untouched until the Cloudflare version is verified.
