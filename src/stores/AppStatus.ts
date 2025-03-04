import { writable } from "svelte/store";

const appStatusKey = "extension_status";

export const extensionStatus = writable({
  open: false,
  position: { x: window.innerWidth - 400, y: window.innerHeight - 400 },
});

chrome.storage.local.get([appStatusKey], (data) => {
  if (data[appStatusKey]) {
    extensionStatus.set(data[appStatusKey]);
  }
});

extensionStatus.subscribe((value) => {
  chrome.storage.local.set({ [appStatusKey]: value });
});
