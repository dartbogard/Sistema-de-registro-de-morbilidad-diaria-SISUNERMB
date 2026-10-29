// src-tauri/src/lib.rs
use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn guardar_reporte_pdf(nombre: String, bytes: Vec<u8>) -> Result<String, String> {
    let ruta_descargas = match std::env::var("USERPROFILE") {
        Ok(perfil) => PathBuf::from(perfil).join("Downloads"),
        Err(_) => std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
    };

    if !ruta_descargas.exists() {
        let _ = fs::create_dir_all(&ruta_descargas);
    }

    let ruta_completa = ruta_descargas.join(&nombre);

    fs::write(&ruta_completa, bytes)
        .map_err(|e| format!("Error al escribir el archivo: {}", e))?;

    let ruta_str = ruta_completa.to_string_lossy().to_string();

    // Abrir automáticamente el archivo con el visor de PDF predeterminado de Windows
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", &ruta_str])
            .spawn();
    }

    Ok(ruta_str)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![guardar_reporte_pdf])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
