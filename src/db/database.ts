import { CapturedPhoto } from '../types/index';
import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('fieldInspection.db');

export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      localPath TEXT,
      capturedAt TEXT,
      label TEXT
    );
  `);
}

export function insertPhoto(photo: CapturedPhoto): void {
  db.runSync(
    'INSERT INTO photos (id, localPath, capturedAt, label) VALUES (?, ?, ?, ?)',
    [photo.id, photo.localPath, photo.capturedAt, photo.label]
  );
}

export function fetchAllPhotos(): CapturedPhoto[] {
  const result = db.getAllSync(
    'SELECT id, localPath, capturedAt, label FROM photos ORDER BY capturedAt DESC'
  );
  return result as CapturedPhoto[];
}

export function deletePhoto(id: string): void {
  db.runSync('DELETE FROM photos WHERE id = ?', [id]);
}

export { db };
