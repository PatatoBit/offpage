<<<<<<< HEAD
=======
export const supabaseUrl = "https://blbixtcshtlrvmgkgpco.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYml4dGNzaHRscnZtZ2tncGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTg1MDAsImV4cCI6MjA1MTI5NDUwMH0.R--eWEssN7Loz3WIEk8zthDLEcZGHTlnysQ2HX0ZadI";

>>>>>>> 3783d74 (Working shadow dom and auth)
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
