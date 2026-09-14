<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  let nombre = 'SISUNERMB';
  let mensaje = '';
  let estado = '';

  async function probar() {
    estado = 'Llamando a Rust...';
    try {
      mensaje = await invoke<string>('saludar', { nombre });
      estado = '✅ Comunicación exitosa';
    } catch (e) {
      mensaje = `❌ Error: ${e}`;
      estado = '❌ Falló la comunicación';
    }
  }
</script>

<main>
  <h1>Registro de Morbilidad Diaria SISUNERMB</h1>
  <p>Prueba de integración Tauri + SvelteKit</p>

  <label>
    Nombre:
    <input bind:value={nombre} />
  </label>

  <button on:click={probar}>Probar comunicación</button>

  {#if estado}
    <p><strong>{estado}</strong></p>
  {/if}

  {#if mensaje}
    <p>{mensaje}</p>
  {/if}
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }
  input {
    padding: 0.5rem;
    margin-left: 0.5rem;
    font-size: 1rem;
  }
  button {
    display: block;
    margin: 1rem 0;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>