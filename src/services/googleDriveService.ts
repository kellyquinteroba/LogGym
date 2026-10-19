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

export interface GoogleUserInfo {
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface GoogleSignInResult {
  success: boolean;
  user?: GoogleUserInfo;
  accessToken?: string;
  isDomainRestricted?: boolean;
  error?: string;
}

/**
 * Dynamically ensure Google Identity Services script is ready
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
      } else if (checks > 25) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Sign in with Google Account (Prompts account chooser via GIS or Firebase)
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  // 1. Try Google Identity Services first (bypasses Firebase domain whitelist limitations)
  const gsi = await ensureGsiClient();
  if (gsi && firebaseConfig.oAuthClientId) {
    try {
      const res = await new Promise<GoogleSignInResult>((resolve) => {
        const client = gsi.initTokenClient({
          client_id: firebaseConfig.oAuthClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          prompt: 'select_account',
          callback: async (resp: any) => {
            if (resp.error) {
              resolve({
                success: false,
                error: resp.error_description || resp.error,
              });
              return;
            }
            const token = resp.access_token;
            cachedAccessToken = token;
            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              const uData = await uRes.json();
              resolve({
                success: true,
                user: {
                  email: uData.email,
                  displayName: uData.name || uData.email,
                  photoURL: uData.picture,
                },
                accessToken: token,
              });
            } catch {
              resolve({
                success: true,
                user: {
                  email: 'usuario@gmail.com',
                  displayName: 'Usuario Google',
                },
                accessToken: token,
              });
            }
          },
        });
        client.requestAccessToken();
      });

      if (res.success) {
        return res;
      }
    } catch (gisError) {
      console.warn('GIS error, attempting Firebase fallback:', gisError);
    }
  }

  // 2. Try Firebase Auth popup
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      return {
        success: false,
        error: 'No se recibió el token de acceso de Google.',
      };
    }

    cachedAccessToken = credential.accessToken;
    return {
      success: true,
      user: {
        email: result.user.email || '',
        displayName: result.user.displayName || result.user.email || '',
        photoURL: result.user.photoURL || undefined,
      },
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.warn('Firebase sign-in result:', error);
    if (
      error?.code === 'auth/unauthorized-domain' ||
      error?.message?.includes('unauthorized-domain')
    ) {
      return {
        success: false,
        isDomainRestricted: true,
        error: 'Dominio de vista previa no autorizado en Firebase. Conecta tu cuenta ingresando tu correo o sincroniza directamente con tu app de Google Drive.',
      };
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Inicio de sesión cancelado por el usuario.',
      };
    }
    return {
      success: false,
      error: error?.message || 'Error al conectar con Google.',
    };
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
 * Helper: Find or create the specified folder (default 'LogGym') in the user's personal Google Drive
 */
export async function getOrCreateLogGymFolder(
  accessToken: string,
  folderName: string = 'LogGym'
): Promise<GoogleDriveFolder> {
  const safeName = folderName.trim() || 'LogGym';
  // Search for existing active folder named safeName
  const query = encodeURIComponent(`name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error buscando carpeta ${safeName} en Google Drive`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      name: searchData.files[0].name,
    };
  }

  // Not found: create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      description: `Carpeta oficial de respaldos y entrenamientos de LogGym (${safeName})`,
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error creando carpeta ${safeName} en Google Drive`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    name: safeName,
  };
}

/**
 * Upload & Sync application data to Google Drive in the specified folder (default: LogGym)
 */
export async function syncAppDataToGoogleDrive(
  accessToken: string,
  snapshot: AppDataSnapshot,
  folderName: string = 'LogGym'
): Promise<DriveSyncResult> {
  try {
    // 1. Ensure folder exists in user's Drive
    const folder = await getOrCreateLogGymFolder(accessToken, folderName);

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
 * Fetch and restore the latest backup from Google Drive folder (default: 'LogGym')
 */
export async function fetchAppDataFromGoogleDrive(
  accessToken: string,
  folderName: string = 'LogGym'
): Promise<AppDataSnapshot> {
  const safeName = folderName.trim() || 'LogGym';
  const folder = await getOrCreateLogGymFolder(accessToken, safeName);
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
