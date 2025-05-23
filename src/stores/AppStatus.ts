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

interface ModerationStatus {
  harassment: number;
  "harassment/threatening": number;
  hate: number;
  "hate/threatening": number;
  illicit: number;
  "illicit/vioelent": number;
  "self-harm": number;
  "self-harm/instructions": number;
  sexual: number;
  "sexual/minors": number;
  violence: number;
  "violence/graphic": number;
}

interface FilterThreshold {
  harassment: number;
  hate: number;
  illicit: number;
  "self-harm": number;
  sexual: number;
  violence: number;
}

// Add any new toggle fields here (e.g., filterBadwords)
export const extensionStatus = writable<{
  open: boolean;
  filterBadWords: boolean;
  blockFlagged: boolean;
  filterType: "show" | "blur" | "hide";
  filterThreshold: FilterThreshold;
}>({
  open: false,
  filterBadWords: true,
  blockFlagged: true,
  filterType: "blur",
  filterThreshold: {
    harassment: 0.5,
    hate: 0.5,
    illicit: 0.5,
    "self-harm": 0.5,
    sexual: 0.5,
    violence: 0.5,
  },
});

// Initialize store from chrome.storage.local
chrome.storage.local.get([appStatusKey], (data) => {
  if (data[appStatusKey]) {
    extensionStatus.set(data[appStatusKey]);
  }

  // Sync Svelte store updates to chrome.storage.local
  extensionStatus.subscribe((value) => {
    chrome.storage.local.set({ [appStatusKey]: value });
  });
});
