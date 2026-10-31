const fs = require('fs');

function updateDump(filePath) {
  let sql = fs.readFileSync(filePath, 'utf8');

  // Fix DOCTOR_ESPECIALIDAD primary key if single column
  sql = sql.replace(
    /CREATE TABLE public\."DOCTOR_ESPECIALIDAD" \(\s*"id_doctor" uuid NOT NULL,\s*"id_especialidad" uuid NOT NULL,\s*PRIMARY KEY \("id_doctor"\)\s*\);/,
    `CREATE TABLE public."DOCTOR_ESPECIALIDAD" (
  "id_doctor" uuid NOT NULL,
  "id_especialidad" uuid NOT NULL,
  PRIMARY KEY ("id_doctor", "id_especialidad")
);`
  );

  // Add HISTORIAL_AUDITORIA if not present
  if (!sql.includes('HISTORIAL_AUDITORIA')) {
    const auditSql = `

-- Tabla: HISTORIAL_AUDITORIA
CREATE TABLE IF NOT EXISTS public."HISTORIAL_AUDITORIA" (
  "id_auditoria" uuid DEFAULT gen_random_uuid() NOT NULL,
  "usuario_auditoria" text NOT NULL,
  "accion_auditoria" text NOT NULL,
  "entidad_auditoria" text NOT NULL,
  "detalle_auditoria" text NOT NULL,
  "fecha_auditoria" timestamp with time zone DEFAULT (NOW() AT TIME ZONE 'America/Caracas') NOT NULL,
  PRIMARY KEY ("id_auditoria")
);
`;
    sql += auditSql;
  }

  fs.writeFileSync(filePath, sql, 'utf8');
  console.log(`Updated ${filePath}`);
}

updateDump('backup_base_de_datos_sisunermb.sql');
updateDump('INSTALADOR_FINAL/backup_base_de_datos_sisunermb.sql');
if (fs.existsSync('C:/Users/Esthefani Laguna/Desktop/SISUNERMB_INSTALADOR/backup_base_de_datos_sisunermb.sql')) {
  updateDump('C:/Users/Esthefani Laguna/Desktop/SISUNERMB_INSTALADOR/backup_base_de_datos_sisunermb.sql');
}

