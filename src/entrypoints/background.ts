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

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "loginWithGoogle") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
      },
    });
    if (error) throw error;

    await chrome.tabs.create({ url: data.url });

    return;
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
