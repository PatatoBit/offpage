export function getBaseUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname + parsedUrl.pathname; // Get the hostname and path without `https://` or query parameters
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}
