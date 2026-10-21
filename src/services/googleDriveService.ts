import { AppDataSnapshot, CURRENT_APP_VERSION } from '../utils/storageManager';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export interface GoogleDriveUser {
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface GoogleDriveFileMeta {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
}

// Client ID configured or default
const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  '274829857053-bjc3drjvkg30ae63j0qdgf5j695q25bn.apps.googleusercontent.com';

// In-memory token & session cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let cachedUser: GoogleDriveUser | null = null;
let cachedFolder: GoogleDriveFolder | null = null;

type SimpleAuthListener = (user: GoogleDriveUser | null, token: string | null) => void;
type DriveAuthChangeListener = (
  user: GoogleDriveUser | null,
  token: string | null,
  folder: GoogleDriveFolder | null
) => void;

const simpleAuthListeners: SimpleAuthListener[] = [];
const driveAuthListeners: DriveAuthChangeListener[] = [];

/**
 * Access token getter for sync checks
 */
export const getCachedToken = (): string | null => cachedAccessToken;
export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;

/**
 * Folder getter for sync checks
 */
export const getCachedFolder = (): GoogleDriveFolder | null => cachedFolder;

/**
 * Helper to ensure Google Identity Services client is loaded
 */
async function ensureGsiClient(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).google?.accounts?.oauth2) {
    return (window as any).google.accounts.oauth2;
  }

  return new Promise((resolve) => {
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      if ((window as any).google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve((window as any).google.accounts.oauth2);
      } else if (checks > 30) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Register auth listener (simple user + token)
 */
export const initAuth = (
  onAuthSuccess?: (user: GoogleDriveUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener: SimpleAuthListener = (user, token) => {
    if (user && token) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };

  simpleAuthListeners.push(listener);

  if (cachedUser && cachedAccessToken) {
    listener(cachedUser, cachedAccessToken);
  } else {
    listener(null, null);
  }

  return () => {
    const idx = simpleAuthListeners.indexOf(listener);
    if (idx !== -1) simpleAuthListeners.splice(idx, 1);
  };
};

/**
 * Register Drive auth listener (user + token + folder) - used by App.tsx
 */
export const onDriveAuthChange = (
  callback: (user: GoogleDriveUser | null, token: string | null, folder: GoogleDriveFolder | null) => void
): (() => void) => {
  driveAuthListeners.push(callback);

  // Immediately notify with current cache
  callback(cachedUser, cachedAccessToken, cachedFolder);

  return () => {
    const idx = driveAuthListeners.indexOf(callback);
    if (idx !== -1) driveAuthListeners.splice(idx, 1);
  };
};

function notifyAllListeners(
  user: GoogleDriveUser | null,
  token: string | null,
  folder: GoogleDriveFolder | null
) {
  simpleAuthListeners.forEach((fn) => {
    try {
      fn(user, token);
    } catch (e) {
      console.warn('Simple auth listener error:', e);
    }
  });

  driveAuthListeners.forEach((fn) => {
    try {
      fn(user, token, folder);
    } catch (e) {
      console.warn('Drive auth listener error:', e);
    }
  });
}

/**
 * Interactive Sign-in with Google Account (Requests Google Drive scope)
 */
export const googleSignIn = async (): Promise<{ user: GoogleDriveUser; accessToken: string } | null> => {
  const gsi = await ensureGsiClient();
  if (!gsi) {
    throw new Error('Google Identity Services no está disponible en este navegador. Revisa tu conexión.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = gsi.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        prompt: 'select_account',
        callback: async (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
            return;
          }
          const token = resp.access_token;
          cachedAccessToken = token;

          try {
            // Fetch profile info from Google OAuth API
            const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const uData = await uRes.json();
            const user: GoogleDriveUser = {
              email: uData.email || 'usuario@gmail.com',
              displayName: uData.name || uData.email || 'Usuario Google',
              photoURL: uData.picture || undefined,
            };
            cachedUser = user;

            // Automatically resolve or create the default 'LogGym' folder
            try {
              const folder = await getOrCreateLogGymFolder(token, 'LogGym');
              cachedFolder = folder;
            } catch (folderErr) {
              console.warn('Could not auto-create LogGym folder at login:', folderErr);
            }

            notifyAllListeners(user, token, cachedFolder);
            resolve({ user, accessToken: token });
          } catch {
            const fallbackUser: GoogleDriveUser = {
              email: 'usuario@gmail.com',
              displayName: 'Usuario Google Drive',
            };
            cachedUser = fallbackUser;
            notifyAllListeners(fallbackUser, token, cachedFolder);
            resolve({ user: fallbackUser, accessToken: token });
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
};

export const logout = async () => {
  if (cachedAccessToken && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
    try {
      (window as any).google.accounts.oauth2.revoke(cachedAccessToken, () => {});
    } catch {
      // ignore
    }
  }
  cachedAccessToken = null;
  cachedUser = null;
  cachedFolder = null;
  notifyAllListeners(null, null, null);
};

/**
 * Find or create dedicated 'LogGym' folder in user's personal Google Drive
 */
export async function getOrCreateLogGymFolder(
  accessToken: string,
  folderName: string = 'LogGym'
): Promise<GoogleDriveFolder> {
  const safeName = folderName.trim() || 'LogGym';

  // 1. Search for existing folder
  const query = encodeURIComponent(
    `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error buscando carpeta ${safeName} en Google Drive`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = {
      id: searchData.files[0].id,
      name: searchData.files[0].name,
    };
    cachedFolder = existing;
    return existing;
  }

  // 2. Folder does not exist, create it
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      description: `Carpeta dedicada de LogGym (${safeName}) para tus entrenamientos y datos.`,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error creando carpeta ${safeName} en Google Drive`);
  }

  const createdFolder = await createRes.json();
  const resFolder = {
    id: createdFolder.id,
    name: safeName,
  };
  cachedFolder = resFolder;
  return resFolder;
}

/**
 * Upload consolidated data to a specific folder in Google Drive (used by App.tsx automated sync)
 */
export async function uploadConsolidatedDataToDrive(
  accessToken: string,
  folderId: string,
  snapshot: AppDataSnapshot,
  fileName: string = 'LogGym_Datos.json'
): Promise<{ success: boolean; fileId: string; fileName: string; timestamp: number }> {
  // Check if file exists in that folder
  const query = encodeURIComponent(
    `name = '${fileName}' and '${folderId}' in parents and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const checkRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const checkData = checkRes.ok ? await checkRes.json() : { files: [] };
  const existingFile = checkData.files?.[0];
  const jsonContent = JSON.stringify(snapshot, null, 2);

  if (existingFile?.id) {
    // Update existing file
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!updateRes.ok) {
      throw new Error('Error al actualizar archivo en Google Drive');
    }

    return {
      success: true,
      fileId: existingFile.id,
      fileName,
      timestamp: Date.now(),
    };
  }

  // Create new file
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
    description: 'Respaldo consolidado de LogGym',
  };

  const boundary = '-------LogGymConsolidated' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const createRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!createRes.ok) {
    throw new Error('Error al crear archivo consolidado en Google Drive');
  }

  const newFile = await createRes.json();
  return {
    success: true,
    fileId: newFile.id,
    fileName,
    timestamp: Date.now(),
  };
}

/**
 * Save/write workout JSON file into the dedicated 'LogGym' folder in Google Drive (used by modal)
 */
export async function writeWorkoutJsonToDrive(
  accessToken: string,
  data: AppDataSnapshot,
  folderName: string = 'LogGym'
): Promise<{ success: boolean; fileId: string; fileName: string; timestamp: number }> {
  const folder = await getOrCreateLogGymFolder(accessToken, folderName);
  return uploadConsolidatedDataToDrive(accessToken, folder.id, data, 'LogGym_Entrenamientos.json');
}

/**
 * Read and download workout JSON file from the dedicated 'LogGym' folder in Google Drive
 */
export async function readWorkoutJsonFromDrive(
  accessToken: string,
  folderName: string = 'LogGym'
): Promise<AppDataSnapshot> {
  const folder = await getOrCreateLogGymFolder(accessToken, folderName);

  // Search for either LogGym_Entrenamientos.json or LogGym_Datos.json
  const query = encodeURIComponent(
    `'${folder.id}' in parents and (name = 'LogGym_Entrenamientos.json' or name = 'LogGym_Datos.json') and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;

  const checkRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!checkRes.ok) {
    const err = await checkRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error buscando archivo de datos en Google Drive');
  }

  const checkData = await checkRes.json();
  const file = checkData.files?.[0];

  if (!file?.id) {
    throw new Error(
      `No se encontró ningún archivo de datos en la carpeta «${folderName}» de tu Google Drive. Guarda primero un respaldo antes de restaurar.`
    );
  }

  // Download file contents
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!downloadRes.ok) {
    const err = await downloadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al descargar datos desde Google Drive');
  }

  const rawJson = await downloadRes.json();

  return {
    version: rawJson.version || CURRENT_APP_VERSION,
    exportDate: rawJson.exportDate || new Date().toISOString(),
    timestamp: rawJson.timestamp || Date.now(),
    sets: Array.isArray(rawJson.sets) ? rawJson.sets : [],
    exercises: Array.isArray(rawJson.exercises) ? rawJson.exercises : [],
    schedule: rawJson.schedule || ({} as any),
    cardioWorkouts: Array.isArray(rawJson.cardioWorkouts) ? rawJson.cardioWorkouts : [],
  };
}

/**
 * List files inside the dedicated LogGym folder
 */
export async function listLogGymFolderFiles(
  accessToken: string,
  folderName: string = 'LogGym'
): Promise<GoogleDriveFileMeta[]> {
  try {
    const folder = await getOrCreateLogGymFolder(accessToken, folderName);
    const query = encodeURIComponent(`'${folder.id}' in parents and trashed = false`);
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;

    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}
