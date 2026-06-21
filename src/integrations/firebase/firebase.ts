// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMflFxQBGFmnnp8ll5A_6HE5rVfEG6X7M",
  authDomain: "shorten-link-d3726.firebaseapp.com",
  projectId: "shorten-link-d3726",
  storageBucket: "shorten-link-d3726.firebasestorage.app",
  messagingSenderId: "72511701676",
  appId: "1:72511701676:web:f1c879377b2de0c65e1509",
  measurementId: "G-EV6GX5SG03",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
