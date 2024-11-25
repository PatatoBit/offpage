export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
});

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
