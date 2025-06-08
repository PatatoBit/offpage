export const supabaseUrl = import.meta.env.WXT_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.WXT_SUPABASE_ANON_KEY;

export function handleOpenOptions() {
  chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
}

export function getBaseUrlAndPath(
  url: string,
  useTags: boolean = false,
): { baseUrl: string; domain: string; route: string } | null {
  try {
    const parsedUrl = new URL(url);
    const baseUrl: string = parsedUrl.origin;
    const domain: string = parsedUrl.hostname;

    let route: string;
    if (useTags && parsedUrl.search) {
      // Include pathname and search params (e.g., /watch?v=7ZbDwr81OzE)
      route = parsedUrl.pathname + parsedUrl.search;
    } else {
      // Remove trailing slash from pathname
      route = parsedUrl.pathname.endsWith("/")
        ? parsedUrl.pathname.slice(0, -1)
        : parsedUrl.pathname;
    }

    return { baseUrl, domain, route };
  } catch (error) {
    console.error("Invalid URL:", error);
    console.error(url);

    return null;
  }
}

export interface SiteInfo {
  host: string;
  hostname: string;
  href: string;
  origin: string;
  title: string;
  icon: string;
  description: string;
}

export const cleanURL = (url: string) =>
  url.replace(/([^:]\/)\/+/g, "$1").replace(/\/+$/, "");

/**
 * Determines whether the specified URL is absolute
 * Reference: https://github.com/axios/axios/blob/v1.x/lib/helpers/isAbsoluteURL.js
 */
export const isAbsoluteURL = (url: string) => {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

/**
 * Add params to the URL
 */
export const assembleURL = (url: string, params: Record<string, string>) => {
  return Object.entries(params)
    .reduce((url, [key, value]) => {
      url.searchParams.append(key, value);
      return url;
    }, new URL(url))
    .toString();
};

export const buildFullURL = (
  baseURL: string = "",
  pathURL: string = "",
  params: Record<string, any> = {},
) => {
  const url = cleanURL(
    isAbsoluteURL(pathURL) ? pathURL : `${baseURL}/${pathURL}`,
  );
  return assembleURL(url, params);
};

export const getIcon = (): string => {
  const path =
    document.querySelector('link[rel="icon" i]')?.getAttribute("href") ??
    document
      .querySelector('link[rel="shortcut icon" i]')
      ?.getAttribute("href") ??
    document
      .querySelector('meta[property="og:image" i]')
      ?.getAttribute("content") ??
    document
      .querySelector('link[rel="apple-touch-icon" i]')
      ?.getAttribute("href") ??
    `/favicon.ico`;

  if (path.startsWith("data:") || path.startsWith("//")) {
    return path;
  } else {
    return buildFullURL(document.location.origin, path);
  }
};

export function isEmpty(obj: Object) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
}

export function isValidImage(file: File) {
  return ["image/png", "image/jpeg", "image/gif"].includes(file.type);
}

export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}
