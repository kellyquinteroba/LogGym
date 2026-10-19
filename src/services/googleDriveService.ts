import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { WorkoutSet, Exercise, WeeklySchedule, CardioWorkout } from '../types';
import { CURRENT_APP_VERSION, AppDataSnapshot } from '../utils/storageManager';

// Scopes required for Google Drive app folder & file access
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveSyncResult {
  success: boolean;
  fileId?: string;
  folderId?: string;
  folderName?: string;
  timestamp?: number;
  error?: string;
  itemCount?: {
    sets: number;
    cardio: number;
  };
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
}

/**
 * Initialize Auth State Listener
 */
export function initAuthListener(
  onUserChanged: (user: User | null, token: string | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      onUserChanged(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        onUserChanged(user, null);
      }
    }
  });
}

/**
 * Sign in with Google Account (Prompts account chooser)
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('No se recibió el token de acceso de Google.');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Error during Google sign in:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign out of Google
 */
export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

/**
 * Get current access token
 */
export function getCurrentAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Helper: Find or create the 'LogGym' folder in the user's personal Google Drive
 */
export async function getOrCreateLogGymFolder(accessToken: string): Promise<GoogleDriveFolder> {
  // Search for existing active folder named 'LogGym'
  const query = encodeURIComponent("name = 'LogGym' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error buscando carpeta en Google Drive');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      name: searchData.files[0].name,
    };
  }

  // Not found: create folder 'LogGym'
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'LogGym',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Carpeta oficial de respaldos y entrenamientos de LogGym',
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error creando carpeta LogGym en Google Drive');
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    name: 'LogGym',
  };
}

/**
 * Upload & Sync application data to Google Drive in the LogGym folder
 */
export async function syncAppDataToGoogleDrive(
  accessToken: string,
  snapshot: AppDataSnapshot
): Promise<DriveSyncResult> {
  try {
    // 1. Ensure folder exists in user's Drive
    const folder = await getOrCreateLogGymFolder(accessToken);

    // 2. Search if 'LogGym_Entrenamientos.json' already exists in that folder
    const fileName = 'LogGym_Entrenamientos.json';
    const query = encodeURIComponent(`name = '${fileName}' and '${folder.id}' in parents and trashed = false`);
    const checkFileUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

    const checkRes = await fetch(checkFileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const checkData = await checkRes.json();
    const existingFileId = checkData.files?.[0]?.id;

    const fileContent = JSON.stringify(snapshot, null, 2);

    if (existingFileId) {
      // Update existing file content
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const updateRes = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!updateRes.ok) {
        throw new Error('Error al actualizar el archivo en Google Drive');
      }

      return {
        success: true,
        fileId: existingFileId,
        folderId: folder.id,
        folderName: folder.name,
        timestamp: Date.now(),
        itemCount: {
          sets: snapshot.sets.length,
          cardio: snapshot.cardioWorkouts.length,
        },
      };
    } else {
      // Create new file with multipart upload
      const metadata = {
        name: fileName,
        parents: [folder.id],
        mimeType: 'application/json',
        description: 'Respaldo automático de series y cardio en LogGym',
      };

      const boundary = '-------LogGymBoundary' + Math.random().toString(36).substring(2);
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
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
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Error al guardar archivo en Google Drive');
      }

      const createdFile = await createRes.json();

      return {
        success: true,
        fileId: createdFile.id,
        folderId: folder.id,
        folderName: folder.name,
        timestamp: Date.now(),
        itemCount: {
          sets: snapshot.sets.length,
          cardio: snapshot.cardioWorkouts.length,
        },
      };
    }
  } catch (error: any) {
    console.error('Error syncing with Google Drive:', error);
    return {
      success: false,
      error: error.message || 'Error de sincronización con Google Drive',
    };
  }
}

/**
 * Fetch and restore the latest backup from Google Drive 'LogGym' folder
 */
export async function fetchAppDataFromGoogleDrive(accessToken: string): Promise<AppDataSnapshot> {
  const folder = await getOrCreateLogGymFolder(accessToken);
  const fileName = 'LogGym_Entrenamientos.json';
  const query = encodeURIComponent(`name = '${fileName}' and '${folder.id}' in parents and trashed = false`);
  const checkFileUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`;

  const checkRes = await fetch(checkFileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!checkRes.ok) {
    throw new Error('No se pudo consultar el archivo de respaldo en Google Drive');
  }

  const checkData = await checkRes.json();
  const file = checkData.files?.[0];

  if (!file?.id) {
    throw new Error(`No se encontró ningún archivo de respaldo "${fileName}" en la carpeta LogGym de tu Google Drive.`);
  }

  // Download file content
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!downloadRes.ok) {
    throw new Error('Error al descargar los datos desde Google Drive');
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
