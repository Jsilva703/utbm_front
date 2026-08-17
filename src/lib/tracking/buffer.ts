import type { LocationPayload } from "@/lib/api/types";

const DB_NAME = "utmb-trail-tracking";
const STORE_NAME = "pending_locations";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "client_point_id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
) {
  const db = await openDb();

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    if (request) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => {
      db.close();
      if (!request) {
        resolve(undefined);
      }
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function savePendingLocation(location: LocationPayload) {
  await withStore("readwrite", (store) => store.put(location));
}

export async function listPendingLocations(limit = 25) {
  const all = await withStore<LocationPayload[]>("readonly", (store) => store.getAll());
  return (all || [])
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(0, limit);
}

export async function deletePendingLocations(ids: string[]) {
  if (ids.length === 0) {
    return;
  }

  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    ids.forEach((id) => store.delete(id));

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function countPendingLocations() {
  const count = await withStore<number>("readonly", (store) => store.count());
  return count || 0;
}

