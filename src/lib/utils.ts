export function getBaseUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    let basePath = parsedUrl.hostname + parsedUrl.pathname; // Combine hostname and pathname

    if (basePath.endsWith("/")) {
      basePath = basePath.slice(0, -1); // Remove the trailing '/'
    }

    return basePath;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}
