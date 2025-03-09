import { CommentData } from "@/lib/database";
import { writable } from "svelte/store";

const appStatusKey = "extension_status";

export const currentUrl = writable<string | null>(null);
export const currentUrlSplit = writable<{
  baseUrl: string;
  domain: string;
  route: string;
} | null>(null);
export const initialComments = writable<CommentData[]>([]);
export const isEmpty = writable<boolean>(false);

export const extensionStatus = writable({
  open: false,
});

// Initialize the store with the value from chrome.storage.local
chrome.storage.local.get([appStatusKey], (data) => {
  if (data[appStatusKey]) {
    extensionStatus.set(data[appStatusKey]);
  }
});

// Subscribe to store changes and update chrome.storage.local
extensionStatus.subscribe((value) => {
  chrome.storage.local.set({ [appStatusKey]: value });
});

// Load the initial state when the UI loads
chrome.storage.local.get("open").then(({ open }) => {
  if (open !== undefined) {
    extensionStatus.set({ open });
  }
});

// Listen for storage changes (delayed update)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.open) {
    extensionStatus.set({ open: changes.open.newValue });
  }
});

// Listen for direct messages (instant update)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_STATUS") {
    extensionStatus.set({ open: message.open });
  }
});
