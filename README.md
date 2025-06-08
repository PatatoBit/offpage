# Offpage
A browser extension that brings commenting to every website on the internet

## Configuration

1. **Copy the example environment file:**

   ```sh
   cp .env.example .env
   ```

2. **Fill in the required environment variables in `.env`:**

   - `WXT_EXTENSION_KEY`: Your extension key (optional for local dev).
   - `WXT_OAUTH_CLIENT_ID`: OAuth client ID from your Google/Supabase project.
   - `WXT_SUPABASE_URL`: Your Supabase project URL.
   - `WXT_SUPABASE_ANON_KEY`: Your Supabase anon/public API key.
   - `WXT_TURNSTILE_SITE_KEY`: (Optional) Cloudflare Turnstile site key for captcha.

3. **Set up Supabase:**

   - Make sure your Supabase project is configured with the correct authentication redirect URIs and API keys.
   - Update the Chrome extension ID and redirect URIs in both the Chrome console and Supabase settings as needed.

4. **Install dependencies:**

   ```sh
   pnpm install
   ```

5. **Start the development server:**

   ```sh
   pnpm dev
   ```

See [`.env.example`](.env.example) for all required variables.

### Changing Chrome extension ID

1. Change extension id in Chrome console's extension id
2. Change authorized redirect uri in Supabase's authentication URL configuration
3. Change default redirect URL in auth URL configuration


### Support the development

You can visit [Patato's kofi page](https://ko-fi.com/patatobit) to support fund the development

### Community

You can join our [Discord Server](https://discord.gg/nRSUg3t6Ag) to be up to date on the latest development logs, hang out with other users, or ask questions and gives suggestions!

