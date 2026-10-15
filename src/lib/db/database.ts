// src/lib/db/database.ts
import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    const url = import.meta.env.VITE_DATABASE_URL;

    if (!url) {
      throw new Error(
        '❌ Falta la variable VITE_DATABASE_URL en el archivo .env'
      );
    }

    dbInstance = await Database.load(url);
    console.log('✅ Conectado a PostgreSQL');
  }
  return dbInstance;
}