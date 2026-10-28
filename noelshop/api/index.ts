import { createApp } from "../server/_core/app.js";

// Route all /api/* requests through the existing Express API. The static React
// build is served by Vercel's CDN from dist/public, not from this function.
export const config = { api: { bodyParser: false } };
export default createApp();
