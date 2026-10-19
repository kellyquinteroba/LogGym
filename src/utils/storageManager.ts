import { WorkoutSet, Exercise, WeeklySchedule, CardioWorkout } from '../types';

export type StorageMode = 'local' | 'cloud';
export type CloudProvider = 'google_drive' | 'onedrive' | 'cloud_file';

export const CURRENT_APP_VERSION = '2.5.0';

export const STORAGE_KEYS = {
  STORAGE_MODE: 'loggym_storage_mode_v1',
  STORAGE_PROMPTED_ONCE: 'loggym_storage_prompted_v1',
  CLOUD_PROVIDER: 'loggym_cloud_provider_v1',
  CLOUD_USER_EMAIL: 'loggym_cloud_user_email_v1',
  CLOUD_FOLDER_NAME: 'loggym_cloud_folder_name_v1',
  LAST_CLOUD_SYNC: 'loggym_last_cloud_sync_v1',
  LAST_SEEN_CHANGELOG_VERSION: 'loggym_last_seen_changelog_v1',
};

export interface AppDataSnapshot {
  version: string;
  exportDate: string;
  timestamp: number;
  sets: WorkoutSet[];
  exercises: Exercise[];
  schedule: WeeklySchedule;
  cardioWorkouts: CardioWorkout[];
}

export interface StoragePreference {
  mode: StorageMode | null;
  hasBeenPrompted: boolean;
  provider: CloudProvider;
  accountEmail?: string;
  folderName: string;
  lastSyncTimestamp?: number;
}

/**
 * Retrieve current storage preference
 */
export function getStoragePreference(): StoragePreference {
  try {
    const rawMode = localStorage.getItem(STORAGE_KEYS.STORAGE_MODE) as StorageMode | null;
    const prompted = localStorage.getItem(STORAGE_KEYS.STORAGE_PROMPTED_ONCE) === 'true';
    const provider = (localStorage.getItem(STORAGE_KEYS.CLOUD_PROVIDER) as CloudProvider) || 'google_drive';
    const accountEmail = localStorage.getItem(STORAGE_KEYS.CLOUD_USER_EMAIL) || undefined;
    const folderName = localStorage.getItem(STORAGE_KEYS.CLOUD_FOLDER_NAME) || 'LogGym';
    const lastSyncRaw = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC);
    const lastSyncTimestamp = lastSyncRaw ? parseInt(lastSyncRaw, 10) : undefined;

    return {
      mode: rawMode === 'local' || rawMode === 'cloud' ? rawMode : null,
      hasBeenPrompted: prompted,
      provider,
      accountEmail,
      folderName,
      lastSyncTimestamp,
    };
  } catch {
    return {
      mode: null,
      hasBeenPrompted: false,
      provider: 'google_drive',
      folderName: 'LogGym',
    };
  }
}

/**
 * Set and persist storage preference
 */
export function setStoragePreference(
  mode: StorageMode,
  provider: CloudProvider = 'google_drive',
  accountEmail?: string,
  folderName: string = 'LogGym'
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);
    localStorage.setItem(STORAGE_KEYS.STORAGE_PROMPTED_ONCE, 'true');
    localStorage.setItem(STORAGE_KEYS.CLOUD_PROVIDER, provider);
    localStorage.setItem(STORAGE_KEYS.CLOUD_FOLDER_NAME, folderName || 'LogGym');
    if (accountEmail) {
      localStorage.setItem(STORAGE_KEYS.CLOUD_USER_EMAIL, accountEmail);
    }
  } catch (e) {
    console.error('Error saving storage preference:', e);
  }
}

/**
 * Check if the user needs to see the Changelog modal
 */
export function shouldShowChangelog(): boolean {
  try {
    const lastSeen = localStorage.getItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG_VERSION);
    return lastSeen !== CURRENT_APP_VERSION;
  } catch {
    return false;
  }
}

/**
 * Mark current changelog as read
 */
export function markChangelogSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG_VERSION, CURRENT_APP_VERSION);
  } catch {
    // ignore
  }
}

/**
 * Create a full data backup snapshot of all app data
 */
export function createAppDataSnapshot(
  sets: WorkoutSet[],
  exercises: Exercise[],
  schedule: WeeklySchedule,
  cardioWorkouts: CardioWorkout[]
): AppDataSnapshot {
  return {
    version: CURRENT_APP_VERSION,
    exportDate: new Date().toISOString(),
    timestamp: Date.now(),
    sets,
    exercises,
    schedule,
    cardioWorkouts,
  };
}

/**
 * Download or share the backup JSON file
 */
export async function exportAndShareBackup(snapshot: AppDataSnapshot): Promise<boolean> {
  const jsonString = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const fileName = `LogGym_Backup_${new Date().toISOString().slice(0, 10)}.json`;

  // Try Web Share API (native share on mobile to Google Drive / OneDrive / iCloud / Files)
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Copia de seguridad LogGym',
          text: 'Respaldo completo de entrenamientos de fuerza y cardio.',
          files: [file],
        });
        localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, String(Date.now()));
        return true;
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return false;
      }
      console.warn('Native share failed, falling back to download:', err);
    }
  }

  // Fallback: standard file download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, String(Date.now()));
  return true;
}

/**
 * Validate and parse an imported backup file
 */
export function parseAppDataSnapshot(jsonContent: string): AppDataSnapshot {
  const data = JSON.parse(jsonContent);
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no contiene un formato JSON válido.');
  }
  if (!Array.isArray(data.sets) && !Array.isArray(data.cardioWorkouts)) {
    throw new Error('El archivo no contiene datos de entrenamientos de LogGym.');
  }

  return {
    version: data.version || '1.0.0',
    exportDate: data.exportDate || new Date().toISOString(),
    timestamp: data.timestamp || Date.now(),
    sets: Array.isArray(data.sets) ? data.sets : [],
    exercises: Array.isArray(data.exercises) ? data.exercises : [],
    schedule: data.schedule && typeof data.schedule === 'object' ? data.schedule : undefined as any,
    cardioWorkouts: Array.isArray(data.cardioWorkouts) ? data.cardioWorkouts : [],
  };
}
