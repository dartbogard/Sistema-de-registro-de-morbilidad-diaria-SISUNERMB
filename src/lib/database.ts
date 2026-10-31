// src/lib/database.ts
import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

export function obtenerUrlBaseDatos(): string {
  if (typeof window !== 'undefined') {
    const urlConfigurada = localStorage.getItem('sisunermb_database_url');
    if (urlConfigurada && urlConfigurada.trim()) {
      return urlConfigurada.trim();
    }
  }
  return import.meta.env.VITE_DATABASE_URL || 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb';
}

export function guardarUrlBaseDatos(nuevaUrl: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sisunermb_database_url', nuevaUrl.trim());
    dbInstance = null; // Reiniciar instancia para forzar reconexión
  }
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    const url = obtenerUrlBaseDatos();

    if (!url) {
      throw new Error(
        '❌ No se ha configurado la dirección de conexión a la base de datos PostgreSQL.'
      );
    }

    dbInstance = await Database.load(url);
    console.log('✅ Conectado a PostgreSQL:', url);
  }
  return dbInstance;
}
