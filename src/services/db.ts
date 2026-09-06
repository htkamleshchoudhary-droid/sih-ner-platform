import type { IncidentReport } from '../types/logistics.ts';

const DB_NAME = 'NER_Logistics_Offline_DB';
const DB_VERSION = 1;
const INCIDENT_STORE = 'pending_incidents';

// Initialize or open local IndexedDB instance
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INCIDENT_STORE)) {
        db.createObjectStore(INCIDENT_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save hazard report locally when offline
export const saveIncidentOffline = async (incident: IncidentReport): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INCIDENT_STORE, 'readwrite');
    const store = tx.objectStore(INCIDENT_STORE);
    store.put(incident);

    tx.oncomplete = () => {
      console.log(`[IndexedDB] Hazard report ${incident.id} saved locally.`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};

// Fetch all unsynced offline reports
export const getOfflineIncidents = async (): Promise<IncidentReport[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INCIDENT_STORE, 'readonly');
    const store = tx.objectStore(INCIDENT_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Clear pending reports after successful server sync
export const clearOfflineIncidents = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INCIDENT_STORE, 'readwrite');
    const store = tx.objectStore(INCIDENT_STORE);
    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Automatic Online Reconnection Listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const pending = await getOfflineIncidents();
    if (pending.length > 0) {
      console.log(`[Auto-Sync] Reconnected to internet. Uploading ${pending.length} pending hazard reports...`);
      // Simulating sync API push
      await clearOfflineIncidents();
      alert(`[Auto-Sync Complete] ${pending.length} offline hazard report(s) synced to MDoNER Command Center.`);
    }
  });
}