// Tiny Firestore wrapper used by both pages.
// Exposes: AppleBoxStore.ready (Promise), .watch(path, cb), .merge(path, data)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg = window.APPLEBOX_FIREBASE || {};
const configured = cfg.projectId && cfg.projectId !== "PASTE_HERE";
let db = null;
if (configured) {
  try { db = getFirestore(initializeApp(cfg)); } catch (e) { console.error("Firebase init failed", e); }
}

window.AppleBoxStore = {
  configured: !!db,
  watch(path, cb, onErr) {
    if (!db) return () => {};
    const [col, id] = path.split("/");
    return onSnapshot(doc(db, col, id), snap => cb(snap.exists() ? snap.data() : null), err => onErr && onErr(err));
  },
  async merge(path, data, who) {
    if (!db) throw new Error("not_configured");
    const [col, id] = path.split("/");
    await setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp(), updatedBy: who || "" }, { merge: true });
  }
};
document.dispatchEvent(new Event("applebox-store-ready"));
