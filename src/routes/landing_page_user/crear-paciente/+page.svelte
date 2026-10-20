<script lang="ts">
  import { crearPaciente } from '$lib/queries/pacientes';
  import type { CrearPacienteInput } from '$lib/types/paciente';

  // Objeto reactivo para el formulario
  let formulario: CrearPacienteInput = {
    nombre_completo_paciente: '',
    nombre_titular_paciente: '',
    ci_titular_paciente: '',
    ci_beneficiario_paciente: null,
    fecha_nacimiento_paciente: '',
    sexo_paciente: 'M',
    tipo_personal_paciente: 'DOCENTE',
    categoria_trabajador_paciente: 'ACTIVO',
    parentesco_paciente: null,
    // Se agrega opcionalmente o se deja omitido si se marcó con ? en la interfaz
    fecha_actualización_paciente: null
  };

  let esTitular: boolean = true;
  let cargando: boolean = false;
  let mensajeExito: string = '';
  let mensajeError: string = '';

  async function manejarRegistro() {
    mensajeError = '';
    mensajeExito = '';

    // Solución al error 18047: Usar ?.trim() o verificar que exista el string
    const ciTitular = formulario.ci_titular_paciente?.trim() || '';
    const nombreCompleto = formulario.nombre_completo_paciente?.trim() || '';

    if (!nombreCompleto || !ciTitular || !formulario.fecha_nacimiento_paciente) {
      mensajeError = 'Por favor complete todos los campos obligatorios (*).';
      return;
    }

    cargando = true;

    try {
      // Preparación limpia del objeto a enviar
      const datosAEnviar: CrearPacienteInput = {
        ...formulario,
        nombre_completo_paciente: nombreCompleto,
        nombre_titular_paciente: formulario.nombre_titular_paciente?.trim() || nombreCompleto,
        ci_titular_paciente: ciTitular,
        ci_beneficiario_paciente: esTitular ? null : formulario.ci_beneficiario_paciente?.trim() || null,
        parentesco_paciente: esTitular ? null : formulario.parentesco_paciente,
        fecha_actualización_paciente: new Date().toISOString()
      };

      await crearPaciente(datosAEnviar);
      mensajeExito = '¡Paciente registrado exitosamente!';
      limpiarFormulario();

    } catch (error) {
      console.error('Error al registrar paciente:', error);
      mensajeError = 'Ocurrió un error al guardar el registro en la base de datos.';
    } finally {
      cargando = false;
    }
  }

  function limpiarFormulario() {
    formulario = {
      nombre_completo_paciente: '',
      nombre_titular_paciente: '',
      ci_titular_paciente: '',
      ci_beneficiario_paciente: null,
      fecha_nacimiento_paciente: '',
      sexo_paciente: 'M',
      tipo_personal_paciente: 'DOCENTE',
      categoria_trabajador_paciente: 'ACTIVO',
      parentesco_paciente: null,
      fecha_actualización_paciente: null
    };
    esTitular = true;
  }
</script>

<svelte:head>
  <title>Registrar Paciente - SISUNERMB</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=person_add" />
</svelte:head>

<div class="modulo-container">
  <!-- Cabecera del Módulo -->
  <header class="modulo-header">
    <a href="/landing_page_user" class="btn-regresar">
      <span class="material-symbols-outlined">arrow_back</span>
      Volver al Panel
    </a>
    <h2>
      <span class="material-symbols-outlined">person_add</span>
      Registro de Nuevo Paciente
    </h2>
  </header>

  <!-- Formulario Principal -->
  <form on:submit|preventDefault={manejarRegistro} class="form-registrar-paciente">
    
    {#if mensajeError}
      <div class="alert alert-error">{mensajeError}</div>
    {/if}

    {#if mensajeExito}
      <div class="alert alert-exito">{mensajeExito}</div>
    {/if}

    <!-- SECCIÓN 1: Condición del Paciente -->
    <fieldset class="form-section">
      <legend>Condición del Paciente</legend>
      <div class="checkbox-wrapper">
        <label class="label-checkbox">
          <input type="checkbox" bind:checked={esTitular} disabled={cargando} />
          <span>El paciente es el mismo Titular del beneficio</span>
        </label>
      </div>
    </fieldset>

    <!-- SECCIÓN 2: Datos Personales del Paciente -->
    <fieldset class="form-section">
      <legend>Datos Personales</legend>
      <div class="grid-form">
        
        <!-- Nombre Completo Paciente -->
        <div class="form-group col-span-2">
          <label for="nombre">Nombre Completo del Paciente *</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">person</span>
            <input 
              type="text" 
              id="nombre" 
              bind:value={formulario.nombre_completo_paciente} 
              placeholder="Ej. Juan Alberto Pérez Gómez"
              disabled={cargando}
              required 
            />
          </div>
        </div>

        <!-- Cédula Titular -->
        <div class="form-group">
          <label for="ci_titular">Cédula del Titular *</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">badge</span>
            <input 
              type="text" 
              id="ci_titular" 
              bind:value={formulario.ci_titular_paciente} 
              placeholder="Ej. V-12345678"
              disabled={cargando}
              required 
            />
          </div>
        </div>

        <!-- Cédula Beneficiario (Si aplica) -->
        <div class="form-group">
          <label for="ci_beneficiario">Cédula del Beneficiario {esTitular ? '(N/A)' : '*'}</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">badge</span>
            <input 
              type="text" 
              id="ci_beneficiario" 
              bind:value={formulario.ci_beneficiario_paciente} 
              placeholder={esTitular ? 'No aplica para Titular' : 'Ej. V-28765432'}
              disabled={cargando || esTitular}
              required={!esTitular}
            />
          </div>
        </div>

        <!-- Nombre Titular (Inhabilitado si esTitular es true) -->
        {#if !esTitular}
          <div class="form-group col-span-2">
            <label for="nombre_titular">Nombre Completo del Titular *</label>
            <div class="div-icon-wrapper">
              <span class="material-symbols-outlined icon-input">person</span>
              <input 
                type="text" 
                id="nombre_titular" 
                bind:value={formulario.nombre_titular_paciente} 
                placeholder="Nombre del titular asignado"
                disabled={cargando}
                required
              />
            </div>
          </div>

          <!-- Parentesco -->
          <div class="form-group">
            <label for="parentesco">Parentesco *</label>
            <div class="div-icon-wrapper">
              <span class="material-symbols-outlined icon-input">family_restroom</span>
              <select id="parentesco" bind:value={formulario.parentesco_paciente} disabled={cargando} required>
                <option value={null} disabled selected>Seleccione...</option>
                <option value="HIJO(A)">HIJO(A)</option>
                <option value="CÓNYUGE">CÓNYUGE</option>
                <option value="PADRE/MADRE">PADRE/MADRE</option>
              </select>
            </div>
          </div>
        {/if}

        <!-- Fecha Nacimiento -->
        <div class="form-group">
          <label for="fecha_nac">Fecha de Nacimiento *</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">calendar_today</span>
            <input 
              type="date" 
              id="fecha_nac" 
              bind:value={formulario.fecha_nacimiento_paciente} 
              disabled={cargando}
              required 
            />
          </div>
        </div>

        <!-- Sexo -->
        <div class="form-group">
          <label for="sexo">Sexo *</label>
          <select id="sexo" bind:value={formulario.sexo_paciente} disabled={cargando} required>
            <option value="M">Masculino (M)</option>
            <option value="F">Femenino (F)</option>
          </select>
        </div>

      </div>
    </fieldset>

    <!-- SECCIÓN 3: Clasificación Institucional (UNERMB) -->
    <fieldset class="form-section">
      <legend>Clasificación Institucional</legend>
      <div class="grid-form">
        
        <!-- Tipo de Personal -->
        <div class="form-group">
          <label for="tipo_personal">Tipo de Personal *</label>
          <select id="tipo_personal" bind:value={formulario.tipo_personal_paciente} disabled={cargando} required>
            <option value="DOCENTE">DOCENTE</option>
            <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
            <option value="OBRERO">OBRERO</option>
            <option value="ESTUDIANTE">ESTUDIANTE</option>
          </select>
        </div>

        <!-- Categoría de Trabajador -->
        <div class="form-group">
          <label for="categoria">Categoría del Trabajador *</label>
          <select id="categoria" bind:value={formulario.categoria_trabajador_paciente} disabled={cargando} required>
            <option value="ACTIVO">ACTIVO</option>
            <option value="JUBILADO">JUBILADO</option>
            <option value="PENSIONADO">PENSIONADO</option>
            <option value="CONTRATADO">CONTRATADO</option>
          </select>
        </div>

      </div>
    </fieldset>

    <!-- Botones de Acción -->
    <div class="form-actions">
      <button type="button" class="btn-cancelar" on:click={limpiarFormulario} disabled={cargando}>
        Limpiar
      </button>
      <button type="submit" class="btn-guardar" disabled={cargando}>
        {cargando ? 'Guardando...' : 'Registrar Paciente'}
      </button>
    </div>

  </form>
</div>

<style>
  .modulo-container {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    max-width: 900px;
    margin: 0 auto;
  }

  .modulo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #eef2f5;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }

  .btn-regresar {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #007aff;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .btn-regresar:hover {
    text-decoration: underline;
  }

  .modulo-header h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #2c3e50;
    font-size: 1.4rem;
  }

  .form-section {
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 18px;
    margin-bottom: 20px;
  }

  .form-section legend {
    font-weight: 600;
    color: #007aff;
    padding: 0 8px;
    font-size: 0.95rem;
  }

  .grid-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .col-span-2 {
    grid-column: span 2;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 6px;
  }

  .div-icon-wrapper {
    position: relative;
    width: 100%;
  }

  .icon-input {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
    font-size: 20px;
    pointer-events: none;
  }

  input[type="text"],
  input[type="date"],
  select {
    width: 100%;
    padding: 9px 10px 9px 38px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 0.95rem;
    outline: none;
    background-color: #fcfcfc;
    transition: all 0.2s ease;
  }

  select {
    padding-left: 10px; /* Sin icono para selects simples */
  }

  .div-icon-wrapper select {
    padding-left: 38px;
  }

  input:focus, select:focus {
    border-color: #007aff;
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
  }

  input:disabled, select:disabled {
    background-color: #eef2f5;
    cursor: not-allowed;
  }

  .label-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    color: #2c3e50;
  }

  .label-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
  }

  .btn-guardar {
    background-color: #007aff;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-guardar:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .btn-cancelar {
    background-color: #e0e0e0;
    color: #333;
    border: none;
    padding: 10px 18px;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-cancelar:hover:not(:disabled) {
    background-color: #d0d0d0;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Alertas */
  .alert {
    padding: 12px;
    border-radius: 5px;
    margin-bottom: 15px;
    font-size: 0.9rem;
    text-align: center;
    font-weight: 600;
  }

  .alert-error {
    background-color: #fde8e8;
    color: #9b1c1c;
    border: 1px solid #fbd5d5;
  }

  .alert-exito {
    background-color: #def7ec;
    color: #03543f;
    border: 1px solid #bcf0da;
  }
</style>