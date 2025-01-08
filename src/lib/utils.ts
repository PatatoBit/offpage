export const supabaseUrl = import.meta.env.SUPABSE_URL;
export const supabaseAnonKey = import.meta.env.SUPABSE_ANON_KEY;

export function getBaseUrlAndPath(
  url: string
): { baseUrl: string; pagePath: string } | null {
  try {
    const parsedUrl = new URL(url);
    const baseUrl: string = parsedUrl.hostname; // Get hostname
    const pagePath: string = parsedUrl.pathname.endsWith("/")
      ? parsedUrl.pathname.slice(0, -1) // Remove trailing slash
      : parsedUrl.pathname; // Get pathname without trailing slash

    return { baseUrl, pagePath };
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}
