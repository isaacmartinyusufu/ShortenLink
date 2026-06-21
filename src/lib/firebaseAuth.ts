import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

import { auth } from "@/integrations/firebase/firebase";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export async function logout() {
  return signOut(auth);
}
