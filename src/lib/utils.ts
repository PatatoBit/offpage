export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getBaseUrlAndPath(
  url: string
): { baseUrl: string; domain: string; route: string } | null {
  try {
    const parsedUrl = new URL(url);
    const baseUrl: string = parsedUrl.origin; // Get origin (scheme + hostname + port)
    const domain: string = parsedUrl.hostname; // Get hostname (domain name)
    const route: string = parsedUrl.pathname.endsWith("/")
      ? parsedUrl.pathname.slice(0, -1) // Remove trailing slash
      : parsedUrl.pathname; // Get pathname without trailing slash

    return { baseUrl, domain, route };
  } catch (error) {
    console.error("Invalid URL:", error);
    console.error(url);

    return null;
  }
}
