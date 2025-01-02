<<<<<<< HEAD
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
=======
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export default defineBackground(() => {
  console.log("Background Initiated", { id: browser.runtime.id });

  // chrome.action.onClicked.addListener((tab) => {
  //   console.log("Toggle UI");

  //   if (tab.id !== undefined) {
  //     chrome.tabs.sendMessage(tab.id, { action: "toggle-ui" });
  //   }
  // });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "loginWithGoogle") {
    const manifest = chrome.runtime.getManifest();
    const url = new URL("https://accounts.google.com/o/oauth2/auth");

    if (manifest.oauth2) {
      url.searchParams.set("client_id", manifest.oauth2.client_id);
    }
    url.searchParams.set("response_type", "id_token");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set(
      "redirect_uri",
      `https://${chrome.runtime.id}.chromiumapp.org`
    );
    if (manifest.oauth2 && manifest.oauth2.scopes) {
      url.searchParams.set("scope", manifest.oauth2.scopes.join(" "));
    }

    chrome.identity.launchWebAuthFlow(
      {
        url: url.href,
        interactive: true,
      },
      async (redirectedTo) => {
        if (chrome.runtime.lastError) {
          console.error("Authentication failed:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          try {
            if (!redirectedTo) {
              throw new Error("Redirect URL is undefined");
            }
            const url = new URL(redirectedTo);
            const params = new URLSearchParams(url.hash.split("#")[1]);

            const idToken = params.get("id_token");

            if (!idToken) {
              throw new Error("ID token missing from redirect URL");
            }

            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: chrome.identity.getRedirectURL(),
              },
            });

            console.log("Redirecting to:", data.url);
            console.log(chrome.identity.getRedirectURL());

            if (data.url) {
              await chrome.tabs.create({ url: data.url });
            } else {
              throw new Error("URL is null");
            }

            if (error) {
              throw error;
            }

            sendResponse({ success: true, data });
          } catch (error) {
            console.error("Error during authentication:", error);
            sendResponse({ success: false, error: (error as any).message });
          }
        }
      }
    );

    // Return true to indicate async response
    return true;
>>>>>>> 3783d74 (Working shadow dom and auth)
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
<<<<<<< HEAD
    const supabaseUrl = "https://blbixtcshtlrvmgkgpco.supabase.co";
    const supabaseAnonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYml4dGNzaHRscnZtZ2tncGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTg1MDAsImV4cCI6MjA1MTI5NDUwMH0.R--eWEssN7Loz3WIEk8zthDLEcZGHTlnysQ2HX0ZadI";
=======
>>>>>>> 3783d74 (Working shadow dom and auth)

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
<<<<<<< HEAD
=======

function loginWithGoogle() {
  const manifest = chrome.runtime.getManifest();

  const url = new URL("https://accounts.google.com/o/oauth2/auth");

  if (manifest.oauth2) {
    url.searchParams.set("client_id", manifest.oauth2.client_id);
  }
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set(
    "redirect_uri",
    `https://${chrome.runtime.id}.chromiumapp.org`
  );
  if (manifest.oauth2 && manifest.oauth2.scopes) {
    url.searchParams.set("scope", manifest.oauth2.scopes.join(" "));
  }

  chrome.identity.launchWebAuthFlow(
    {
      url: url.href,
      interactive: true,
    },
    async (redirectedTo) => {
      if (chrome.runtime.lastError) {
        // auth was not successful
      } else {
        // auth was successful, extract the ID token from the redirectedTo URL
        if (redirectedTo) {
          const url = new URL(redirectedTo);
          const params = new URLSearchParams(url.hash);

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: params.get("id_token") || "",
          });
        }
      }
    }
  );
}
>>>>>>> 3783d74 (Working shadow dom and auth)
