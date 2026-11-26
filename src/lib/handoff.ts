// Übergabe einer Datei von einer Ratgeber-Seite an das Werkzeug auf der Startseite.
// Die Datei bleibt im Browser (IndexedDB dieser Website) und wird beim Abholen sofort gelöscht – nichts wird übertragen.
const DB = 'ics-editor-handoff';
const STORE = 'files';
const KEY = 'pending';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

/** Dateien für das Werkzeug ablegen. Gibt false zurück, wenn der Browser keinen Speicher erlaubt (z. B. privater Modus). */
export async function putHandoff(files: File[]): Promise<boolean> {
  try {
    const items = await Promise.all(files.map(async (f) => ({ name: f.name, type: f.type, data: await f.arrayBuffer() })));
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ items, t: Date.now() }, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** Abgelegte Dateien abholen und sofort löschen. Älter als 10 Minuten: verwerfen. */
export async function takeHandoff(): Promise<File[]> {
  try {
    if (!('indexedDB' in globalThis)) return [];
    const db = await open();
    const rec = await new Promise<{ items: { name: string; type: string; data: ArrayBuffer }[]; t: number } | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const g = st.get(KEY);
      g.onsuccess = () => { st.delete(KEY); resolve(g.result); };
      g.onerror = () => reject(g.error);
    });
    db.close();
    if (!rec || Date.now() - rec.t > 10 * 60 * 1000) return [];
    return rec.items.map((i) => new File([i.data], i.name, { type: i.type }));
  } catch {
    return [];
  }
}
