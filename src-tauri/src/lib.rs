#[tauri::command]
fn saludar(nombre: String) -> String {
    format!("Hola desde Rust, {}!", nombre)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![saludar])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}