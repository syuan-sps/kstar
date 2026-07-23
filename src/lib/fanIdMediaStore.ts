import {
  isFanIdMediaRecord,
  makeFanIdMediaKey,
  type FanIdMediaRecord,
  type FanIdMediaRole,
} from "./fanIdMedia";

const DATABASE_NAME = "kstar-fanid-media";
const DATABASE_VERSION = 1;
const STORE_NAME = "media";
const CARD_SERIAL_INDEX = "cardSerial";

function openDatabase(factory: IDBFactory | undefined): Promise<IDBDatabase> {
  if (!factory) return Promise.reject(new Error("Fan ID media storage unavailable"));

  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction!.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: "key" });

      if (!store.indexNames.contains(CARD_SERIAL_INDEX)) {
        store.createIndex(CARD_SERIAL_INDEX, "cardSerial", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    transaction.oncomplete = () => settle(resolve);
    transaction.onabort = () => settle(() => reject(transaction.error));
    transaction.onerror = () => settle(() => reject(transaction.error));
  });
}

async function runTransaction<T>(
  factory: IDBFactory | undefined,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase(factory);
  try {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    const [result] = await Promise.all([requestResult(request), transactionComplete(transaction)]);
    return result;
  } finally {
    database.close();
  }
}

export async function getFanIdMediaRecord(
  cardSerial: string,
  role: FanIdMediaRole,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<FanIdMediaRecord | null> {
  const record = await runTransaction(factory, "readonly", (store) =>
    store.get(makeFanIdMediaKey(cardSerial, role)),
  );

  return isFanIdMediaRecord(record) ? record : null;
}

export async function putFanIdMediaRecord(
  record: FanIdMediaRecord,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<void> {
  if (!isFanIdMediaRecord(record)) throw new Error("Invalid Fan ID media record");

  await runTransaction(factory, "readwrite", (store) => store.put(record));
}

export async function removeFanIdMediaRecord(
  cardSerial: string,
  role: FanIdMediaRole,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<void> {
  await runTransaction(factory, "readwrite", (store) =>
    store.delete(makeFanIdMediaKey(cardSerial, role)),
  );
}

export async function removeAllFanIdMediaForCard(
  cardSerial: string,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<void> {
  makeFanIdMediaKey(cardSerial, { kind: "user" });
  const database = await openDatabase(factory);
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const index = transaction.objectStore(STORE_NAME).index(CARD_SERIAL_INDEX);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        callback();
      };
      const store = transaction.objectStore(STORE_NAME);
      const request = index.openCursor(cardSerial);
      request.onerror = () => settle(() => reject(request.error));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;

        try {
          const deleteRequest = store.delete(cursor.primaryKey);
          deleteRequest.onerror = () => settle(() => reject(deleteRequest.error));
          cursor.continue();
        } catch (error) {
          settle(() => reject(error));
        }
      };
      transaction.oncomplete = () => settle(resolve);
      transaction.onabort = () => settle(() => reject(transaction.error));
      transaction.onerror = () => settle(() => reject(transaction.error));
    });
  } finally {
    database.close();
  }
}
