<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { crearDoctor } from '$lib/queries/doctores';
  import { crearEspecialidad } from '$lib/queries/especialidades';
  import { crearUsuario } from '$lib/queries/usuarios';
  import { crearPaciente } from '$lib/queries/pacientes';
  import type { CrearPacienteInput } from '$lib/types/paciente';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  // Datos de la sesión
  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;

  // Control de la pestaña activa ('doctor' | 'especialidad' | 'usuario' | 'paciente')
  let tabActiva: 'doctor' | 'especialidad' | 'usuario' | 'paciente' = 'doctor';

  // Mensajes de respuesta
  let mensajeExito = '';
  let mensajeError = '';
  let guardando = false;

  // Formulario de Doctor
  let formDoctor = {
    nombre_doctor: '',
    apellido_doctor: '',
    ci_profesional_doctor: '',
    ci_doctor: ''
  };

  // Formulario de Especialidad
  let tipoEspecialidad = '';

  // Formulario de Usuario
  let formUsuario = {
    nombre_usuario: '',
    password_usuario: '',
    rol_usuario: 'MEDICO'
  };

  // Formulario de Paciente (Módulo Administrativo)
  let esTitular: boolean = true;
  let formPaciente: CrearPacienteInput = {
    nombre_completo_paciente: '',
    nombre_titular_paciente: '',
    ci_titular_paciente: '',
    ci_beneficiario_paciente: null,
    fecha_nacimiento_paciente: '',
    sexo_paciente: 'M',
    tipo_personal_paciente: 'DOCENTE',
    categoria_trabajador_paciente: 'ACTIVO',
    parentesco_paciente: null
  };

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'paciente' || tabParam === 'doctor' || tabParam === 'especialidad' || tabParam === 'usuario') {
        tabActiva = tabParam;
      }
    } else {
      goto('/');
    }
  });

  function alCambiarCondicionPaciente() {
    if (esTitular) {
      formPaciente.ci_beneficiario_paciente = null;
      formPaciente.parentesco_paciente = null;
      formPaciente.nombre_titular_paciente = formPaciente.nombre_completo_paciente;
    } else {
      formPaciente.nombre_titular_paciente = '';
      formPaciente.parentesco_paciente = 'HIJO(A)';
    }
  }

  function limpiarFormPaciente() {
    formPaciente = {
      nombre_completo_paciente: '',
      nombre_titular_paciente: '',
      ci_titular_paciente: '',
      ci_beneficiario_paciente: null,
      fecha_nacimiento_paciente: '',
      sexo_paciente: 'M',
      tipo_personal_paciente: 'DOCENTE',
      categoria_trabajador_paciente: 'ACTIVO',
      parentesco_paciente: null
    };
    esTitular = true;
  }

  async function guardarPaciente() {
    mensajeExito = '';
    mensajeError = '';

    const nombreCompleto = formPaciente.nombre_completo_paciente?.trim() || '';
    const ciTitular = formPaciente.ci_titular_paciente?.trim() || '';
    const fechaNac = formPaciente.fecha_nacimiento_paciente?.trim() || '';

    if (!nombreCompleto || !ciTitular || !fechaNac) {
      mensajeError = 'Por favor complete todos los campos obligatorios del paciente (*).';
      return;
    }

    if (!esTitular) {
      if (!formPaciente.nombre_titular_paciente?.trim()) {
        mensajeError = 'Debe indicar el nombre completo del titular del beneficio.';
        return;
      }
      if (!formPaciente.parentesco_paciente) {
        mensajeError = 'Debe seleccionar el parentesco del beneficiario.';
        return;
      }
    }

    guardando = true;
    try {
      const datosAEnviar: CrearPacienteInput = {
        nombre_completo_paciente: nombreCompleto,
        nombre_titular_paciente: esTitular ? nombreCompleto : formPaciente.nombre_titular_paciente.trim(),
        ci_titular_paciente: ciTitular,
        ci_beneficiario_paciente: esTitular ? null : (formPaciente.ci_beneficiario_paciente?.trim() || null),
        fecha_nacimiento_paciente: fechaNac,
        sexo_paciente: formPaciente.sexo_paciente,
        tipo_personal_paciente: formPaciente.tipo_personal_paciente,
        categoria_trabajador_paciente: formPaciente.categoria_trabajador_paciente,
        parentesco_paciente: esTitular ? null : formPaciente.parentesco_paciente
      };

      await crearPaciente(datosAEnviar);
      mensajeExito = `¡Paciente ${nombreCompleto} registrado exitosamente en la base de datos!`;
      limpiarFormPaciente();
    } catch (error: any) {
      console.error('Error al registrar paciente:', error);
      mensajeError = error?.message || 'Ocurrió un error al registrar el paciente en el sistema.';
    } finally {
      guardando = false;
    }
  }

  async function guardarDoctor() {
    mensajeExito = '';
    mensajeError = '';
    guardando = true;
    try {
      await crearDoctor(formDoctor);
      mensajeExito = '¡Especialista médico registrado exitosamente en la base de datos!';
      formDoctor = {
        nombre_doctor: '',
        apellido_doctor: '',
        ci_profesional_doctor: '',
        ci_doctor: ''
      };
    } catch (error: any) {
      console.error('Error al registrar doctor:', error);
      mensajeError = `Error al registrar doctor: ${error.message || error}`;
    } finally {
      guardando = false;
    }
  }

  async function guardarEspecialidad() {
    mensajeExito = '';
    mensajeError = '';
    guardando = true;
    try {
      await crearEspecialidad({ tipo_especialidad: tipoEspecialidad });
      mensajeExito = '¡Especialidad médica registrada exitosamente!';
      tipoEspecialidad = '';
    } catch (error: any) {
      console.error('Error al registrar especialidad:', error);
      mensajeError = `Error al registrar especialidad: ${error.message || error}`;
    } finally {
      guardando = false;
    }
  }

  async function guardarUsuario() {
    mensajeExito = '';
    mensajeError = '';
    guardando = true;
    try {
      await crearUsuario(formUsuario);
      mensajeExito = '¡Usuario del sistema registrado exitosamente!';
      formUsuario = {
        nombre_usuario: '',
        password_usuario: '',
        rol_usuario: 'MEDICO'
      };
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      mensajeError = `Error al registrar usuario: ${error.message || error}`;
    } finally {
      guardando = false;
    }
  }
</script>

<svelte:head>
  <title>Módulo Administrativo – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="modulo-creacion" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Módulo de Creación y Configuración Administrativa</h2>
        <p class="subtitulo">Gestione el alta de pacientes institucionales, especialistas médicos, especialidades clínicas y usuarios con acceso al sistema.</p>
      </div>

      <div class="form-container">
        <!-- Pestañas de Selección -->
        <div class="tabs-header">
          <button 
            type="button"
            class="tab-btn"
            class:active={tabActiva === 'doctor'} 
            on:click={() => { tabActiva = 'doctor'; mensajeExito = ''; mensajeError = ''; }}
          >
            <span class="material-symbols-outlined">local_hospital</span>
            <span>Registrar Doctor</span>
          </button>

          <button 
            type="button"
            class="tab-btn"
            class:active={tabActiva === 'especialidad'} 
            on:click={() => { tabActiva = 'especialidad'; mensajeExito = ''; mensajeError = ''; }}
          >
            <span class="material-symbols-outlined">medical_services</span>
            <span>Registrar Especialidad</span>
          </button>

          <button 
            type="button"
            class="tab-btn"
            class:active={tabActiva === 'usuario'} 
            on:click={() => { tabActiva = 'usuario'; mensajeExito = ''; mensajeError = ''; }}
          >
            <span class="material-symbols-outlined">manage_accounts</span>
            <span>Registrar Usuario</span>
          </button>

          <button 
            type="button"
            class="tab-btn"
            class:active={tabActiva === 'paciente'} 
            on:click={() => { tabActiva = 'paciente'; mensajeExito = ''; mensajeError = ''; }}
          >
            <span class="material-symbols-outlined">person_add</span>
            <span>Registrar Paciente</span>
          </button>
        </div>

        {#if mensajeExito}
          <div class="alerta-exito">
            <span class="material-symbols-outlined">check_circle</span>
            <p>{mensajeExito}</p>
          </div>
        {/if}

        {#if mensajeError}
          <div class="alerta-error">
            <span class="material-symbols-outlined">error</span>
            <p>{mensajeError}</p>
          </div>
        {/if}

        <!-- FORMULARIO DOCTOR -->
        {#if tabActiva === 'doctor'}
          <div class="form-seccion-header">
            <h3>Registro de Especialista Médico</h3>
            <p>Ingrese los datos personales y de colegiatura del profesional de la salud.</p>
          </div>

          <form on:submit|preventDefault={guardarDoctor} class="form-grid">
            <div class="form-group">
              <label for="nombre_doctor">Nombre del Doctor *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">person</span>
                <input type="text" id="nombre_doctor" bind:value={formDoctor.nombre_doctor} required placeholder="Ej. Carlos" disabled={guardando} />
              </div>
            </div>

            <div class="form-group">
              <label for="apellido_doctor">Apellido del Doctor *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">person</span>
                <input type="text" id="apellido_doctor" bind:value={formDoctor.apellido_doctor} required placeholder="Ej. Mendoza" disabled={guardando} />
              </div>
            </div>

            <div class="form-group">
              <label for="ci_doctor">Cédula de Identidad *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">badge</span>
                <input type="text" id="ci_doctor" bind:value={formDoctor.ci_doctor} required placeholder="Ej. V-12345678" disabled={guardando} />
              </div>
            </div>

            <div class="form-group">
              <label for="ci_profesional">Cédula Profesional (MPPS / Colegio) *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">verified</span>
                <input type="text" id="ci_profesional" bind:value={formDoctor.ci_profesional_doctor} required placeholder="Ej. MPPS-12345" disabled={guardando} />
              </div>
            </div>

            <div class="form-group full-width btn-container">
              <button type="submit" class="btn-submit" disabled={guardando}>
                <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
                <span>{guardando ? 'Guardando...' : 'Guardar Especialista'}</span>
              </button>
            </div>
          </form>
        {/if}

        <!-- FORMULARIO ESPECIALIDAD -->
        {#if tabActiva === 'especialidad'}
          <div class="form-seccion-header">
            <h3>Registro de Especialidad Médica</h3>
            <p>Ingrese el nombre de la nueva especialidad médica disponible en SISUNERMB.</p>
          </div>

          <form on:submit|preventDefault={guardarEspecialidad} class="form-single">
            <div class="form-group full-width">
              <label for="tipo_esp">Nombre de la Especialidad Clínica *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">medical_information</span>
                <input type="text" id="tipo_esp" bind:value={tipoEspecialidad} required placeholder="Ej. Traumatología, Cardiología, Pediatría..." disabled={guardando} />
              </div>
            </div>

            <div class="btn-container">
              <button type="submit" class="btn-submit" disabled={guardando}>
                <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
                <span>{guardando ? 'Guardando...' : 'Guardar Especialidad'}</span>
              </button>
            </div>
          </form>
        {/if}

        <!-- FORMULARIO USUARIO -->
        {#if tabActiva === 'usuario'}
          <div class="form-seccion-header">
            <h3>Registro de Usuario Operativo</h3>
            <p>Cree credenciales para el personal con autorización para acceder al registro médico.</p>
          </div>

          <form on:submit|preventDefault={guardarUsuario} class="form-grid">
            <div class="form-group full-width">
              <label for="nombre_usr">Nombre de Usuario (Login) *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">account_circle</span>
                <input type="text" id="nombre_usr" bind:value={formUsuario.nombre_usuario} required placeholder="Ej. cmendoza" disabled={guardando} />
              </div>
            </div>

            <div class="form-group">
              <label for="pass_usr">Contraseña de Acceso *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">key</span>
                <input type="password" id="pass_usr" bind:value={formUsuario.password_usuario} required placeholder="••••••••" disabled={guardando} />
              </div>
            </div>

            <div class="form-group">
              <label for="rol_usr">Rol del Usuario *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">shield_person</span>
                <select id="rol_usr" bind:value={formUsuario.rol_usuario} disabled={guardando}>
                  <option value="MEDICO">MÉDICO / TRATANTE</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                  <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                </select>
              </div>
            </div>

            <div class="form-group full-width btn-container">
              <button type="submit" class="btn-submit" disabled={guardando}>
                <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
                <span>{guardando ? 'Guardando...' : 'Guardar Usuario'}</span>
              </button>
            </div>
          </form>
        {/if}

        <!-- FORMULARIO PACIENTE -->
        {#if tabActiva === 'paciente'}
          <div class="form-seccion-header">
            <h3>Registro de Nuevo Paciente Institucional</h3>
            <p>Incorpore titulares o beneficiarios universitarios que no figuren en la base de datos suministrada por Recursos Humanos.</p>
          </div>

          <!-- Condición del Paciente (Switch) -->
          <div class="condicion-card">
            <label class="label-switch">
              <input 
                type="checkbox" 
                bind:checked={esTitular} 
                on:change={alCambiarCondicionPaciente}
                disabled={guardando} 
              />
              <span class="switch-texto">
                {esTitular 
                  ? 'El paciente es el propio Titular del beneficio universitario' 
                  : 'El paciente es un Beneficiario asignado a un Titular'}
              </span>
            </label>
          </div>

          <form on:submit|preventDefault={guardarPaciente} class="form-grid">
            <div class="form-group full-width">
              <label for="pac_nombre">Nombre Completo del Paciente *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">person</span>
                <input 
                  type="text" 
                  id="pac_nombre" 
                  bind:value={formPaciente.nombre_completo_paciente} 
                  required 
                  placeholder="Ej. Carmen Elena Rodríguez Pérez" 
                  disabled={guardando} 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="pac_ci_titular">Cédula del Titular *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">fingerprint</span>
                <input 
                  type="text" 
                  id="pac_ci_titular" 
                  bind:value={formPaciente.ci_titular_paciente} 
                  required 
                  placeholder="Ej. V-12345678" 
                  disabled={guardando} 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="pac_ci_beneficiario">
                Cédula del Beneficiario {esTitular ? '(No aplica)' : '(Opcional)'}
              </label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">badge</span>
                <input 
                  type="text" 
                  id="pac_ci_beneficiario" 
                  bind:value={formPaciente.ci_beneficiario_paciente} 
                  placeholder={esTitular ? 'No aplica para Titular' : 'Ej. V-28765432'} 
                  disabled={guardando || esTitular} 
                />
              </div>
            </div>

            {#if !esTitular}
              <div class="form-group full-width">
                <label for="pac_nombre_titular">Nombre Completo del Titular *</label>
                <div class="input-con-icono">
                  <span class="material-symbols-outlined">supervisor_account</span>
                  <input 
                    type="text" 
                    id="pac_nombre_titular" 
                    bind:value={formPaciente.nombre_titular_paciente} 
                    required 
                    placeholder="Nombre completo del titular que posee el beneficio" 
                    disabled={guardando} 
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="pac_parentesco">Parentesco con el Titular *</label>
                <div class="input-con-icono">
                  <span class="material-symbols-outlined">family_restroom</span>
                  <select id="pac_parentesco" bind:value={formPaciente.parentesco_paciente} disabled={guardando} required>
                    <option value="HIJO(A)">HIJO(A)</option>
                    <option value="CÓNYUGE">CÓNYUGE</option>
                    <option value="PADRE/MADRE">PADRE/MADRE</option>
                    <option value="HERMANO(A)">HERMANO(A)</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>
              </div>
            {/if}

            <div class="form-group">
              <label for="pac_fecha_nac">Fecha de Nacimiento *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">calendar_today</span>
                <input 
                  type="date" 
                  id="pac_fecha_nac" 
                  bind:value={formPaciente.fecha_nacimiento_paciente} 
                  required 
                  disabled={guardando} 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="pac_sexo">Sexo *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">wc</span>
                <select id="pac_sexo" bind:value={formPaciente.sexo_paciente} disabled={guardando} required>
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="pac_tipo_personal">Tipo de Personal *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">groups</span>
                <select id="pac_tipo_personal" bind:value={formPaciente.tipo_personal_paciente} disabled={guardando} required>
                  <option value="DOCENTE">DOCENTE</option>
                  <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                  <option value="OBRERO">OBRERO</option>
                  <option value="ESTUDIANTE">ESTUDIANTE</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="pac_categoria">Categoría del Trabajador *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">work</span>
                <select id="pac_categoria" bind:value={formPaciente.categoria_trabajador_paciente} disabled={guardando} required>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="JUBILADO">JUBILADO</option>
                  <option value="PENSIONADO">PENSIONADO</option>
                  <option value="CONTRATADO">CONTRATADO</option>
                </select>
              </div>
            </div>

            <div class="form-group full-width btn-container-dual">
              <button type="button" class="btn-secundario" on:click={limpiarFormPaciente} disabled={guardando}>
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Limpiar Formulario</span>
              </button>

              <button type="submit" class="btn-submit" disabled={guardando}>
                <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
                <span>{guardando ? 'Guardando...' : 'Registrar Paciente'}</span>
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </main>
</div>

<Footer />

<style>
  .form-container {
    background-color: #ffffff;
    padding: 30px 34px;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    max-width: 860px;
  }

  .tabs-header {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 14px;
    flex-wrap: wrap;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.92rem;
    font-weight: 600;
    color: #475569;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .tab-btn:hover {
    background-color: #f1f5f9;
    color: #0f172a;
    border-color: #94a3b8;
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: #ffffff;
    border-color: #007aff;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
  }

  .form-seccion-header {
    margin-bottom: 20px;
  }

  .form-seccion-header h3 {
    font-size: 1.15rem;
    color: #0f172a;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
  }

  .form-seccion-header p {
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 3px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .form-single {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group.full-width {
    grid-column: span 2;
  }

  .form-group label {
    font-weight: 600;
    color: #334155;
    font-size: 0.85rem;
  }

  .input-con-icono {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-con-icono span.material-symbols-outlined {
    position: absolute;
    left: 12px;
    font-size: 20px;
    color: #94a3b8;
    pointer-events: none;
  }

  .input-con-icono input,
  .input-con-icono select {
    width: 100%;
    padding: 10px 14px 10px 42px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.94rem;
    font-family: inherit;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-con-icono input:focus,
  .input-con-icono select:focus {
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
  }

  .input-con-icono input:disabled,
  .input-con-icono select:disabled {
    background-color: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .btn-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 6px;
  }

  .condicion-card {
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 22px;
  }

  .label-switch {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .label-switch input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #007aff;
    cursor: pointer;
  }

  .switch-texto {
    font-size: 0.94rem;
    font-weight: 600;
    color: #1e293b;
  }

  .btn-container-dual {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
  }

  .btn-secundario {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f1f5f9;
    color: #475569;
    border: 1.5px solid #cbd5e1;
    padding: 12px 20px;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-secundario:hover:not(:disabled) {
    background: #e2e8f0;
    color: #1e293b;
    border-color: #94a3b8;
  }

  .btn-submit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: white;
    border: none;
    padding: 12px 26px;
    font-size: 0.95rem;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(0, 122, 255, 0.25);
    font-family: inherit;
  }

  .btn-submit:hover:not(:disabled) {
    background: linear-gradient(135deg, #004494 0%, #0066d6 100%);
    box-shadow: 0 5px 14px rgba(0, 122, 255, 0.35);
  }

  .btn-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .form-group.full-width {
      grid-column: span 1;
    }
  }
</style>
