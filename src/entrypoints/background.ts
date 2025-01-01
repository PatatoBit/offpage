export default defineBackground(() => {
  console.log("Background Initiated", { id: browser.runtime.id });
});

import { createClient } from "@supabase/supabase-js";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6l1sm7V2rmbJMYJQOBMAYxz_vjh1VYhI",
  authDomain: "backstage-d7299.firebaseapp.com",
  projectId: "backstage-d7299",
  storageBucket: "backstage-d7299.firebasestorage.app",
  messagingSenderId: "128510583025",
  appId: "1:128510583025:web:a0f6beef79cb0295d54950",
  measurementId: "G-T5V2ERXL43",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CURRENT_URL") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ url: null });
      }
    });
    return true; // Keeps the message channel open for async response
  }
});

// add tab listener when background script starts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url?.startsWith(chrome.identity.getRedirectURL())) {
    finishUserOAuth(changeInfo.url);
  }
});

/**
 * Method used to finish OAuth callback for a user authentication.
 */
async function finishUserOAuth(url: string) {
  try {
    console.log(`handling user OAuth callback ...`);
    const supabaseUrl = "https://blbixtcshtlrvmgkgpco.supabase.co";
    const supabaseAnonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYml4dGNzaHRscnZtZ2tncGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTg1MDAsImV4cCI6MjA1MTI5NDUwMH0.R--eWEssN7Loz3WIEk8zthDLEcZGHTlnysQ2HX0ZadI";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`missing SUPABASE_URL or SUPABASE_ANON_KEY`);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // extract tokens from hash
    const hashMap = parseUrlHash(url);
    const access_token = hashMap.get("access_token");
    const refresh_token = hashMap.get("refresh_token");
    if (!access_token || !refresh_token) {
      throw new Error(`no supabase tokens found in URL hash`);
    }

    // check if they work
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;

    // persist session to storage
    await chrome.storage.local.set({ session: data.session });

    // finally redirect to a post oauth page
    chrome.tabs.update({ url: "https://example.com" });

    console.log(`finished handling user OAuth callback`);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Helper method used to parse the hash of a redirect URL.
 */
function parseUrlHash(url: string) {
  const hashParts = new URL(url).hash.slice(1).split("&");
  const hashMap = new Map(
    hashParts.map((part) => {
      const [name, value] = part.split("=");
      return [name, value];
    })
  );

  return hashMap;
}
