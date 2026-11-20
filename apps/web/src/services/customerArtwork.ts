const databaseName = "printly-customer-artwork";
const objectStoreName = "artwork";

function openArtworkDatabase(): Promise<IDBDatabase> {
  if (!("indexedDB" in window)) return Promise.reject(new Error("Este navegador no permite guardar el diseño para continuar."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(objectStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir el almacenamiento de diseños."));
    request.onblocked = () => reject(new Error("Cierra otras pestañas de Printly para guardar tu diseño."));
  });
}

export async function saveCustomerArtwork(file: File): Promise<string> {
  const database = await openArtworkDatabase();
  const key = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(objectStoreName, "readwrite");
      transaction.objectStore(objectStoreName).put(file, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("No se pudo guardar el diseño."));
      transaction.onabort = () => reject(transaction.error ?? new Error("No se pudo guardar el diseño."));
    });
    return key;
  } finally {
    database.close();
  }
}

export async function loadCustomerArtwork(key: string): Promise<Blob | null> {
  const database = await openArtworkDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(objectStoreName, "readonly");
      const request = transaction.objectStore(objectStoreName).get(key);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error("No se pudo recuperar el diseño guardado."));
    });
  } finally {
    database.close();
  }
}

export async function deleteCustomerArtwork(key: string): Promise<void> {
  const database = await openArtworkDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(objectStoreName, "readwrite");
      transaction.objectStore(objectStoreName).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("No se pudo limpiar el diseño local."));
      transaction.onabort = () => reject(transaction.error ?? new Error("No se pudo limpiar el diseño local."));
    });
  } finally {
    database.close();
  }
}
