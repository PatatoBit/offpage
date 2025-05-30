import { supabase } from "@/lib/supabase";
import { supabaseUrl, supabaseAnonKey } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

export default defineBackground(() => {
  console.log("Background Initiated", { id: browser.runtime.id });

  // Store cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  // Add cleanup function for action listener
  const actionListener = async (tab: any) => {
    const { extension_status } =
      await chrome.storage.local.get("extension_status");
    const newOpenState = !(extension_status?.open ?? false);

    const newStatus = {
      ...(extension_status || {}),
      open: newOpenState,
    };

    await chrome.storage.local.set({
      extension_status: newStatus,
    });

    // Broadcast the toggle to all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: "TOGGLE_STATUS",
            open: newOpenState,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn("Could not send message:", chrome.runtime.lastError);
            }
          },
        );
      }
    }
  };

  browser.action.onClicked.addListener(actionListener);
  cleanupFunctions.push(() =>
    browser.action.onClicked.removeListener(actionListener),
  );

  // Add cleanup for auth state change
  const authStateChange = (event: any, session: any) => {
    if (session) {
      chrome.storage.local.set({ session });
      console.log("Session updated in storage:", session);
    }
  };
  supabase.auth.onAuthStateChange(authStateChange);
  cleanupFunctions.push(() => supabase.auth.onAuthStateChange(() => {}));

  // Add cleanup for message listener
  const messageListener = (message: any, sender: any, sendResponse: any) => {
    console.log("Message received:", message, message.type);
    switch (message.type) {
      case "GET_CURRENT_URL":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            sendResponse({ url: tabs[0].url });
          } else {
            sendResponse({ url: null });
          }
        });
        return true; // Keeps message channel open

      case "OPEN_OPTIONS_PAGE":
        chrome.runtime.openOptionsPage(() => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          } else {
            console.log("Options page opened successfully.");
          }
        });
        break;

      case "loginWithGoogle":
        console.log("loginWithGoogle called ...");
        (async () => {
          try {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: chrome.identity.getRedirectURL(),
              },
            });

            if (error) throw error;

            console.log(
              "Redirecting to:",
              `${data.url}&redirect_uri=${chrome.identity.getRedirectURL()}`,
            );

            await chrome.tabs.create({ url: data.url });
            sendResponse({ success: true });
          } catch (error) {
            console.error(error);
            sendResponse({ success: false });
          }
        })();
        return true; // Keeps message channel open

      case "logout":
        (async () => {
          console.log("Logging out ...");
          try {
            await supabase.auth.signOut();
            await chrome.storage.local.remove("session");

            console.log("Broadcasting logout to all tabs ...");
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
              if (tab.id) {
                console.log(`Sending logout message to tab ${tab.id}`);
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "logout" },
                  (response) => {
                    if (chrome.runtime.lastError) {
                      console.warn(
                        "Could not send message:",
                        chrome.runtime.lastError,
                      );
                    }
                  },
                );
              }
            }

            sendResponse({ success: true });
          } catch (error) {
            console.error("Logout error:", error);
            sendResponse({ success: false });
          }
        })();
        return true; // Keeps message channel open

      case "TOGGLE_BAD_WORDS_FILTER":
        const { badWordsFiltered } = message;
        // Apply the new filter status in the current tab
        // For example, update a local state variable or apply filter logic
        console.log(`Bad words filter status changed: ${badWordsFiltered}`);
      // Apply the filtering logic in this tab

      default:
        break;
    }
  };
  chrome.runtime.onMessage.addListener(messageListener);
  cleanupFunctions.push(() =>
    chrome.runtime.onMessage.removeListener(messageListener),
  );

  // Add cleanup for tab update listener
  const tabUpdateListener = (
    tabId: number,
    changeInfo: any,
    tab: chrome.tabs.Tab,
  ) => {
    if (changeInfo.url?.startsWith(chrome.identity.getRedirectURL())) {
      console.log(`handling OAuth callback ...`);
      finishUserOAuth(changeInfo.url);
    }
  };
  chrome.tabs.onUpdated.addListener(tabUpdateListener);
  cleanupFunctions.push(() =>
    chrome.tabs.onUpdated.removeListener(tabUpdateListener),
  );

  // Return cleanup function
  return () => {
    console.log("Cleaning up background script...");
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
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

    // Update all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "login" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Could not send message:", chrome.runtime.lastError);
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function restoreSession() {
  const { session } = await chrome.storage.local.get("session");

  if (session?.access_token && session?.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) {
      console.error("Failed to restore session:", error);
    } else {
      console.log("Session restored:", data.session);
    }
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
    }),
  );

  return hashMap;
}
