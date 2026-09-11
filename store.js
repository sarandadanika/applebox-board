// Tiny Firestore + Auth wrapper used by both pages.
// Exposes window.AppleBoxStore: .configured, .watch(path, cb, onErr), .merge(path, data, who),
// .removeFields(path, fields, who), .get(path), .signIn(), .signOut(), .onAuth(cb), .user
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot, setDoc, updateDoc, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const cfg = window.APPLEBOX_FIREBASE || {};
const configured = cfg.projectId && cfg.projectId !== "PASTE_HERE";
let db = null, auth = null;
if (configured) {
  try { const app = initializeApp(cfg); db = getFirestore(app); auth = getAuth(app); } catch (e) { console.error("Firebase init failed", e); }
}
const ref = path => { const [col, id] = path.split("/"); return doc(db, col, id); };

window.AppleBoxStore = {
  configured: !!db,
  user: null,
  watch(path, cb, onErr) {
    if (!db) return () => {};
    return onSnapshot(ref(path), snap => cb(snap.exists() ? snap.data() : null), err => onErr && onErr(err));
  },
  async get(path) {
    if (!db) throw new Error("not_configured");
    const snap = await getDoc(ref(path)); return snap.exists() ? snap.data() : null;
  },
  async merge(path, data, who) {
    if (!db) throw new Error("not_configured");
    await setDoc(ref(path), { ...data, updatedAt: serverTimestamp(), updatedBy: who || "" }, { merge: true });
  },
  // Remove fields (dot paths, e.g. "people.john") from a document.
  async removeFields(path, fields, who) {
    if (!db) throw new Error("not_configured");
    const upd = { updatedAt: serverTimestamp(), updatedBy: who || "" };
    fields.forEach(f => { upd[f] = deleteField(); });
    await updateDoc(ref(path), upd);
  },
  async signIn() {
    if (!auth) throw new Error("not_configured");
    const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    return signInWithPopup(auth, p);
  },
  async signOut() { if (auth) await signOut(auth); },
  onAuth(cb) {
    if (!auth) { cb(null); return () => {}; }
    return onAuthStateChanged(auth, u => { window.AppleBoxStore.user = u; cb(u); });
  }
};
document.dispatchEvent(new Event("applebox-store-ready"));
