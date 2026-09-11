// Tiny Firestore + Auth wrapper used by both pages.
// Exposes window.AppleBoxStore with:
//   configured, user
//   watch(path, cb, onErr)            live single document  ("col/id")
//   watchCollection(col, cb, onErr)   live whole collection -> cb([{id,...data}])
//   get(path)                         one-off read
//   merge(path, data, who)            setDoc(..., {merge:true}) + updatedAt/updatedBy
//   removeFields(path, fields, who)   updateDoc with deleteField for each dot-path
//   batch(ops, who)                   [{op:'merge'|'set'|'delete', path, data}] in one atomic write
//   nextKeys(count)                   transaction on board/meta.nextKey -> first number reserved
//   signIn(), signOut(), onAuth(cb)   Google sign-in
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, collection, getDoc, onSnapshot, setDoc, updateDoc, deleteField,
         writeBatch, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const cfg = window.APPLEBOX_FIREBASE || {};
const configured = cfg.projectId && cfg.projectId !== "PASTE_HERE";
let db = null, auth = null;
if (configured) {
  try { const app = initializeApp(cfg); db = getFirestore(app); auth = getAuth(app); } catch (e) { console.error("Firebase init failed", e); }
}
const ref = path => { const [col, id] = path.split("/"); return doc(db, col, id); };
const stamp = who => ({ updatedAt: serverTimestamp(), updatedBy: who || "" });

window.AppleBoxStore = {
  configured: !!db,
  user: null,
  watch(path, cb, onErr) {
    if (!db) return () => {};
    return onSnapshot(ref(path), snap => cb(snap.exists() ? snap.data() : null), err => onErr && onErr(err));
  },
  watchCollection(col, cb, onErr) {
    if (!db) return () => {};
    return onSnapshot(collection(db, col), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => onErr && onErr(err));
  },
  async get(path) {
    if (!db) throw new Error("not_configured");
    const snap = await getDoc(ref(path)); return snap.exists() ? snap.data() : null;
  },
  async merge(path, data, who) {
    if (!db) throw new Error("not_configured");
    await setDoc(ref(path), { ...data, ...stamp(who) }, { merge: true });
  },
  async removeFields(path, fields, who) {
    if (!db) throw new Error("not_configured");
    const upd = stamp(who);
    fields.forEach(f => { upd[f] = deleteField(); });
    await updateDoc(ref(path), upd);
  },
  // All ops succeed or none do. Max 500 ops per batch (Firestore limit).
  async batch(ops, who) {
    if (!db) throw new Error("not_configured");
    const b = writeBatch(db);
    ops.forEach(o => {
      if (o.op === "delete") b.delete(ref(o.path));
      else if (o.op === "set") b.set(ref(o.path), { ...o.data, ...stamp(who) });
      else b.set(ref(o.path), { ...o.data, ...stamp(who) }, { merge: true });
    });
    await b.commit();
  },
  // Reserve `count` story numbers. Returns the first one; caller uses first..first+count-1.
  async nextKeys(count) {
    if (!db) throw new Error("not_configured");
    const metaRef = ref("board/meta");
    return runTransaction(db, async tx => {
      const snap = await tx.get(metaRef);
      const cur = (snap.exists() && snap.data().nextKey) || 41;
      tx.set(metaRef, { nextKey: cur + count }, { merge: true });
      return cur;
    });
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
