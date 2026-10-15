// src-tauri/src/lib.rs

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build()) // <-- Debe estar esta línea
        .invoke_handler(tauri::generate_handler![/* tus comandos */])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}