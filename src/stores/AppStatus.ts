import { CommentData } from "@/lib/database";
import { writable } from "svelte/store";

const appStatusKey = "extension_status";

export const currentUrl = writable<string | null>(null);
export const currentUrlSplit = writable<{
  baseUrl: string;
  domain: string;
  route: string;
} | null>(null);
export const currentPageId = writable<string | null>(null);
export const initialComments = writable<CommentData[]>([]);
export const isEmpty = writable<boolean>(false);

// Add any new toggle fields here (e.g., filterBadwords)
export const extensionStatus = writable<{
  open: boolean;
  filterBadWords: boolean;
}>({
  open: false,
  filterBadWords: true,
});

// Initialize store from chrome.storage.local
chrome.storage.local.get([appStatusKey], (data) => {
  if (data[appStatusKey]) {
    extensionStatus.set(data[appStatusKey]);
  }
});

// Sync Svelte store updates to chrome.storage.local
extensionStatus.subscribe((value) => {
  chrome.storage.local.set({ [appStatusKey]: value });
});
