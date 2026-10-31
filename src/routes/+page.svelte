<script lang="ts">
  import { goto } from '$app/navigation';
  import { obtenerUsuarioPorNombre } from '$lib/queries/usuarios';
  import { obtenerUrlBaseDatos, guardarUrlBaseDatos } from '$lib/database';
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let nombreUsuario: string = '';
  let passwordUsuario: string = '';
  let cargando: boolean = false;
  let mensajeError: string = '';

  // Configuración de conexión de base de datos
  let mostrarModalConfig: boolean = false;
  let urlConexionActual: string = '';
  let mensajeConfig: string = '';

  function abrirModalConfig() {
    urlConexionActual = obtenerUrlBaseDatos();
    mensajeConfig = '';
    mostrarModalConfig = true;
  }

  function guardarConfiguracion() {
    if (!urlConexionActual.trim()) {
      mensajeConfig = 'La URL de conexión no puede estar vacía.';
      return;
    }
    guardarUrlBaseDatos(urlConexionActual.trim());
    mensajeConfig = '¡Configuración de conexión guardada exitosamente!';
    setTimeout(() => {
      mostrarModalConfig = false;
    }, 1200);
  }

  function setLocalhost() {
    urlConexionActual = 'postgres://postgres:Tormentadefuego4.*@localhost:5432/Sistema_Sisunermb';
  }

  function setRemoto() {
    urlConexionActual = 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb';
  }

  async function manejarLogin() {
    mensajeError = '';
    if (!nombreUsuario.trim() || !passwordUsuario.trim()) {
      mensajeError = 'Por favor complete todos los campos requeridos.';
      return;
    }
    cargando = true;
    try {
      const usuario = await obtenerUsuarioPorNombre(nombreUsuario.trim());
      if (!usuario) {
        mensajeError = 'El usuario ingresado no existe en el sistema.';
        return;
      }
      if (usuario.password_usuario !== passwordUsuario) {
        mensajeError = 'Contraseña incorrecta. Verifique sus datos.';
        return;
      }
      localStorage.setItem('usuario_sesion', JSON.stringify({
        id: usuario.id_usuario,
        nombre: usuario.nombre_usuario,
        rol: usuario.rol_usuario
      }));
      goto('/landing_page_user');
    } catch (error) {
      console.error('Error durante la autenticación:', error);
      mensajeError = 'Error de conexión con la base de datos PostgreSQL.';
    } finally {
      cargando = false;
    }
  }
</script>

<svelte:head>
  <title>Acceso al Sistema – SISUNERMB</title>
</svelte:head>

<!-- Cabecera Institucional Unificada -->
<Navbar esLogin={true} />

<!-- Área Central de Login con Escenario Compuesto HD y Tarjeta -->
<main class="login-main-area">
  <!-- Fondo Decorativo Institucional HD (Funciona 100% Offline) -->
  <div class="login-bg-stage">
    <!-- Lado Izquierdo: Retrato Institucional de Don Rafael María Baralt -->
    <div class="baralt-portrait-container">
      <div class="baralt-frame">
        <img src="/baralt-hd.jpg" alt="Don Rafael María Baralt" class="baralt-img" />
        <div class="baralt-vignette"></div>
      </div>
      <div class="baralt-caption">
        <span class="baralt-name">Don Rafael María Baralt</span>
        <span class="baralt-dates">1810 – 1860 · Epónimo Universitario</span>
      </div>
    </div>

    <!-- Lado Derecho: Marca de Agua Institucional UNERMB -->
    <div class="unermb-watermark-container">
      <img src="/unermb-logo.png" alt="Escudo UNERMB" class="unermb-watermark-img" />
    </div>
  </div>

  <!-- Tarjeta de Login Centrada -->
  <div class="login-card">
    <div class="login-header">
      <!-- Logos Oficiales Protagonistas: UNERMB y SISUNERMB -->
      <div class="login-brand-logos">
        <div class="brand-badge-item" title="Universidad Nacional Experimental Rafael María Baralt">
          <img src="/unermb-logo.png" alt="Escudo Oficial UNERMB" class="card-logo-unermb" />
          <span class="brand-badge-label">UNERMB</span>
        </div>
        <div class="brand-divider"></div>
        <div class="brand-badge-item" title="Sistema Integral de Salud">
          <img src="/sisunermb.png" alt="Logo Oficial SISUNERMB" class="card-logo-sisunermb" />
          <span class="brand-badge-label">SISUNERMB</span>
        </div>
      </div>

      <h2>Acceso Institucional</h2>
      <p class="login-subtitle">Sistema Integral de Salud – SISUNERMB</p>
      <span class="login-org-tag">Universidad Nacional Experimental "Rafael María Baralt"</span>
    </div>

    <form on:submit|preventDefault={manejarLogin} class="login-form">
      {#if mensajeError}
        <div class="alerta-error">
          <span class="material-symbols-outlined">error</span>
          <p>{mensajeError}</p>
        </div>
      {/if}

      <div class="campo-grupo">
        <label for="usuario">Usuario del Sistema</label>
        <div class="input-con-icono">
          <span class="material-symbols-outlined">person</span>
          <input
            bind:value={nombreUsuario}
            type="text"
            id="usuario"
            name="username"
            placeholder="Ingrese su usuario..."
            required
            autocomplete="username"
            disabled={cargando}
          />
        </div>
      </div>

      <div class="campo-grupo">
        <label for="contrasena">Contraseña de Acceso</label>
        <div class="input-con-icono">
          <span class="material-symbols-outlined">key</span>
          <input
            bind:value={passwordUsuario}
            type="password"
            id="contrasena"
            name="password"
            placeholder="Ingrese su contraseña..."
            required
            autocomplete="current-password"
            disabled={cargando}
          />
        </div>
      </div>

      <button type="submit" class="btn-login-submit" disabled={cargando}>
        {#if cargando}
          <span class="material-symbols-outlined spin">progress_activity</span>
          <span>Verificando credenciales...</span>
        {:else}
          <span class="material-symbols-outlined">login</span>
          <span>Ingresar al Sistema</span>
        {/if}
      </button>
    </form>

    <div class="login-card-footer">
      <button type="button" class="btn-config-db" on:click={abrirModalConfig} title="Configurar dirección de conexión con PostgreSQL">
        <span class="material-symbols-outlined">settings</span>
        <span>Configurar Conexión BD</span>
      </button>
    </div>
  </div>
</main>

<!-- Modal de Configuración de Conexión a Base de Datos -->
{#if mostrarModalConfig}
  <div class="modal-backdrop-db" on:click|self={() => mostrarModalConfig = false} role="presentation">
    <div class="modal-card-db" role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header-db">
        <div class="titulo-con-icono">
          <span class="material-symbols-outlined icono-modal-db">database</span>
          <h3>Conexión con PostgreSQL</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => mostrarModalConfig = false}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal-body-db">
        <p class="modal-desc">
          Configure la dirección del servidor de base de datos PostgreSQL donde reside <strong>Sistema_Sisunermb</strong>:
        </p>

        <div class="presets-conexion">
          <span class="lbl-presets">Opciones de Conexión Rápida:</span>
          <div class="botones-presets">
            <button type="button" class="btn-preset" on:click={setLocalhost}>
              <span class="material-symbols-outlined">computer</span>
              <span>Esta misma PC (Localhost)</span>
            </button>
            <button type="button" class="btn-preset" on:click={setRemoto}>
              <span class="material-symbols-outlined">cloud</span>
              <span>Servidor Remoto (100.99.19.74)</span>
            </button>
          </div>
        </div>

        <div class="campo-grupo-modal">
          <label for="url_db">Cadena de Conexión (PostgreSQL URL):</label>
          <input 
            id="url_db" 
            type="text" 
            bind:value={urlConexionActual} 
            placeholder="postgres://usuario:password@host:5432/Sistema_Sisunermb"
          />
        </div>

        {#if mensajeConfig}
          <div class="alerta-config">
            <span class="material-symbols-outlined">check_circle</span>
            <p>{mensajeConfig}</p>
          </div>
        {/if}
      </div>

      <div class="modal-footer-db">
        <button type="button" class="btn-cancelar-modal" on:click={() => mostrarModalConfig = false}>
          Cancelar
        </button>
        <button type="button" class="btn-guardar-modal" on:click={guardarConfiguracion}>
          <span class="material-symbols-outlined">save</span>
          <span>Guardar y Aplicar</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Footer Institucional Unificado -->
<Footer />

<style>
  .login-main-area {
    flex: 1;
    min-height: 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    overflow: hidden;
    background: radial-gradient(circle at 50% 45%, #134074 0%, #0b2545 60%, #061527 100%);
  }

  /* Escenario de Fondo Decorativo HD */
  .login-bg-stage {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 6%;
    overflow: hidden;
  }

  /* Retrato Baralt a la izquierda */
  .baralt-portrait-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.38;
    transition: opacity 0.3s ease;
  }

  .baralt-frame {
    position: relative;
    width: 270px;
    height: 360px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    border: 2px solid rgba(255, 255, 255, 0.18);
  }

  .baralt-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    filter: grayscale(25%) contrast(1.15);
  }

  .baralt-vignette {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(11, 37, 69, 0.15) 0%, rgba(11, 37, 69, 0.8) 100%);
  }

  .baralt-caption {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .baralt-name {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    color: #e2e8f0;
    letter-spacing: 0.4px;
  }

  .baralt-dates {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  /* Marca de agua UNERMB a la derecha */
  .unermb-watermark-container {
    opacity: 0.12;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .unermb-watermark-img {
    width: 400px;
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.3));
  }

  /* Tarjeta de Inicio de Sesión */
  .login-card {
    position: relative;
    z-index: 10;
    background: #ffffff;
    border-radius: 20px;
    padding: 34px 38px;
    width: 100%;
    max-width: 430px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.9);
  }

  .login-header {
    text-align: center;
    margin-bottom: 22px;
  }

  /* Logos oficiales en la tarjeta */
  .login-brand-logos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
    padding: 10px 18px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .brand-badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .card-logo-unermb {
    height: 50px;
    width: auto;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
  }

  .card-logo-sisunermb {
    height: 50px;
    width: auto;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
  }

  .brand-badge-label {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.8px;
    color: #0b2545;
  }

  .brand-divider {
    width: 1.5px;
    height: 46px;
    background-color: #cbd5e1;
  }

  .login-header h2 {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
    margin-bottom: 3px;
  }

  .login-subtitle {
    font-size: 0.84rem;
    color: #0066cc;
    font-weight: 600;
  }

  .login-org-tag {
    display: block;
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 2px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .campo-grupo {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .campo-grupo label {
    font-size: 0.84rem;
    font-weight: 600;
    color: #334155;
  }

  .input-con-icono {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-con-icono .material-symbols-outlined {
    position: absolute;
    left: 14px;
    font-size: 20px;
    color: #94a3b8;
    pointer-events: none;
  }

  .input-con-icono input {
    width: 100%;
    padding: 11px 14px 11px 44px;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    font-size: 0.92rem;
    color: #0f172a;
    background-color: #f8fafc;
    outline: none;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .input-con-icono input:focus {
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.14);
  }

  .input-con-icono input:disabled {
    background-color: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .btn-login-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: #ffffff;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(0, 122, 255, 0.3);
    margin-top: 4px;
  }

  .btn-login-submit:hover:not(:disabled) {
    background: linear-gradient(135deg, #004494 0%, #0066d6 100%);
    box-shadow: 0 6px 18px rgba(0, 122, 255, 0.4);
    transform: translateY(-1px);
  }

  .btn-login-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .login-card-footer {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: center;
  }

  .btn-config-db {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .btn-config-db:hover {
    color: #007aff;
    background: #f1f5f9;
  }

  .btn-config-db .material-symbols-outlined {
    font-size: 16px;
  }

  /* Modal de Configuración DB */
  .modal-backdrop-db {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-card-db {
    background: #ffffff;
    border-radius: 14px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: modalIn 0.25s ease-out;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .modal-header-db {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .titulo-con-icono {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icono-modal-db {
    color: #007aff;
    font-size: 24px;
  }

  .titulo-con-icono h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .btn-cerrar-modal {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
  }

  .btn-cerrar-modal:hover {
    color: #dc2626;
    background: #fee2e2;
  }

  .modal-body-db {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-desc {
    font-size: 0.86rem;
    color: #475569;
    line-height: 1.45;
  }

  .presets-conexion {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .lbl-presets {
    font-size: 0.78rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }

  .botones-presets {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-preset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-preset:hover {
    background: #e2e8f0;
    color: #007aff;
    border-color: #007aff;
  }

  .btn-preset .material-symbols-outlined {
    font-size: 16px;
  }

  .campo-grupo-modal {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .campo-grupo-modal label {
    font-size: 0.82rem;
    font-weight: 700;
    color: #334155;
  }

  .campo-grupo-modal input {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.88rem;
    color: #0f172a;
    background: #ffffff;
    font-family: monospace;
    outline: none;
    transition: all 0.2s;
  }

  .campo-grupo-modal input:focus {
    border-color: #007aff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
  }

  .alerta-config {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    border-radius: 8px;
    font-size: 0.84rem;
  }

  .modal-footer-db {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 22px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }

  .btn-cancelar-modal {
    padding: 9px 16px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #475569;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-guardar-modal {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: 8px;
    border: none;
    background: #007aff;
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 122, 255, 0.25);
  }

  .btn-guardar-modal:hover {
    background: #0062cc;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @media (max-width: 992px) {
    .baralt-portrait-container,
    .unermb-watermark-container {
      display: none;
    }
  }
</style>
