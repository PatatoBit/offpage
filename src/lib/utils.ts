export function getBaseUrlAndPath(
  url: string
): { baseUrl: string; pagePath: string } | null {
  try {
    const parsedUrl = new URL(url);
    const baseUrl = parsedUrl.hostname; // Get hostname
    const pagePath = parsedUrl.pathname.endsWith("/")
      ? parsedUrl.pathname.slice(0, -1) // Remove trailing slash
      : parsedUrl.pathname; // Get pathname without trailing slash

    return { baseUrl, pagePath };
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}
