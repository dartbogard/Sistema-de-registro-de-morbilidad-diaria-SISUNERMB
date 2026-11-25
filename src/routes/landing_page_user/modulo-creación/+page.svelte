<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    crearDoctorConEspecialidades, 
    editarDoctor,
    eliminarDoctor,
    obtenerDoctoresDetallados, 
    type DoctorDetallado 
  } from '$lib/queries/doctores';
  import { 
    crearEspecialidad, 
    editarEspecialidad,
    eliminarEspecialidad,
    obtenerEspecialidades,
    obtenerEspecialidadesDetalladas, 
    type EspecialidadDetallada 
  } from '$lib/queries/especialidades';
  import type { Especialidad } from '$lib/types/especialidad';
  import { 
    crearUsuario, 
    editarUsuario,
    eliminarUsuario,
    obtenerUsuariosExistentes, 
    type UsuarioDetallado 
  } from '$lib/queries/usuarios';
  import { 
    crearPaciente, 
    editarPaciente,
    eliminarPaciente,
    obtenerPacientesRecientes,
    buscarPacientePorCedula
  } from '$lib/queries/pacientes';
  import type { Paciente, CrearPacienteInput } from '$lib/types/paciente';
  import { 
    obtenerHistorialAuditoria 
  } from '$lib/queries/auditoria';
  import type { RegistroAuditoria } from '$lib/types/auditoria';
  import { generarPDFAuditoria } from '$lib/utils/reporte-auditoria-pdf';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  // Datos de la sesión
  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;

  // Control de la pestaña activa
  let tabActiva: 'doctor' | 'especialidad' | 'usuario' | 'paciente' | 'auditoria' = 'doctor';

  // Mensajes de respuesta
  let mensajeExito = '';
  let mensajeError = '';
  let guardando = false;

  // Catálogo de especialidades para asignar a doctores
  let especialidadesDisponibles: Especialidad[] = [];
  let especialidadesDoctorSeleccionadas: string[] = [];

  // ==========================================
  // ESTADOS BAJO DEMANDA (ON-DEMAND)
  // ==========================================
  // DOCTORES
  let mostrarDoctores = false;
  let cargandoDoctores = false;
  let listaDoctores: DoctorDetallado[] = [];
  let filtroBusquedaDoctores = '';

  // ESPECIALIDADES
  let mostrarEspecialidades = false;
  let cargandoEspecialidades = false;
  let listaEspecialidades: EspecialidadDetallada[] = [];
  let filtroBusquedaEspecialidades = '';

  // USUARIOS
  let mostrarUsuarios = false;
  let cargandoUsuarios = false;
  let listaUsuarios: UsuarioDetallado[] = [];
  let filtroBusquedaUsuarios = '';

  // PACIENTES
  let mostrarPacientes = false;
  let cargandoPacientes = false;
  let listaPacientes: Paciente[] = [];
  let filtroBusquedaPacientes = '';

  // AUDITORÍA (HISTORIAL DE ACCIONES)
  let cargandoAuditoria = false;
  let listaAuditoria: RegistroAuditoria[] = [];
  let filtroBusquedaAuditoria = '';
  let filtroAccionAuditoria = 'TODAS';
  let filtroEntidadAuditoria = 'TODAS';

  // ==========================================
  // MODALES DE EDICIÓN Y ELIMINACIÓN
  // ==========================================
  // Doctor
  let doctorAEditar: DoctorDetallado | null = null;
  let formEditarDoctor = {
    nombre_doctor: '',
    apellido_doctor: '',
    ci_profesional_doctor: '',
    ci_doctor: '',
    especialidadesIds: [] as string[]
  };
  let doctorAEliminar: DoctorDetallado | null = null;

  // Especialidad
  let especialidadAEditar: EspecialidadDetallada | null = null;
  let nombreEspecialidadEditar = '';
  let especialidadAEliminar: EspecialidadDetallada | null = null;

  // Usuario
  let usuarioAEditar: UsuarioDetallado | null = null;
  let formEditarUsuario = {
    nombre_usuario: '',
    password_usuario: '',
    rol_usuario: 'MEDICO'
  };
  let usuarioAEliminar: UsuarioDetallado | null = null;

  // Paciente
  let pacienteAEditar: Paciente | null = null;
  let formEditarPaciente: CrearPacienteInput = {
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
  let esTitularEdicion = true;
  let pacienteAEliminar: Paciente | null = null;

  // ==========================================
  // FILTRADO REACTIVO EN MEMORIA (Soporte multi-palabra y nombres compuestos)
  // ==========================================
  $: doctoresFiltrados = listaDoctores.filter(doc => {
    if (!filtroBusquedaDoctores.trim()) return true;
    const palabras = filtroBusquedaDoctores.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cadenaDoc = `${doc.nombre_completo || ''} ${doc.ci_doctor || ''} ${doc.ci_profesional_doctor || ''} ${doc.especialidades || ''}`.toLowerCase();
    return palabras.every(palabra => cadenaDoc.includes(palabra));
  });

  $: especialidadesFiltradas = listaEspecialidades.filter(esp => {
    if (!filtroBusquedaEspecialidades.trim()) return true;
    const palabras = filtroBusquedaEspecialidades.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cadenaEsp = (esp.tipo_especialidad || '').toLowerCase();
    return palabras.every(palabra => cadenaEsp.includes(palabra));
  });

  $: usuariosFiltrados = listaUsuarios.filter(usr => {
    if (!filtroBusquedaUsuarios.trim()) return true;
    const palabras = filtroBusquedaUsuarios.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cadenaUsr = `${usr.nombre_usuario || ''} ${usr.rol_usuario || ''}`.toLowerCase();
    return palabras.every(palabra => cadenaUsr.includes(palabra));
  });

  $: pacientesFiltrados = listaPacientes.filter(pac => {
    if (!filtroBusquedaPacientes.trim()) return true;
    const palabras = filtroBusquedaPacientes.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cadenaPac = `${pac.nombre_completo_paciente || ''} ${pac.nombre_titular_paciente || ''} ${pac.ci_titular_paciente || ''} ${pac.ci_beneficiario_paciente || ''} ${pac.tipo_personal_paciente || ''} ${pac.categoria_trabajador_paciente || ''}`.toLowerCase();
    return palabras.every(palabra => cadenaPac.includes(palabra));
  });

  $: auditoriaFiltrada = listaAuditoria.filter(item => {
    if (filtroAccionAuditoria !== 'TODAS' && item.accion_auditoria !== filtroAccionAuditoria) {
      return false;
    }
    if (filtroEntidadAuditoria !== 'TODAS' && item.entidad_auditoria !== filtroEntidadAuditoria) {
      return false;
    }
    if (!filtroBusquedaAuditoria.trim()) return true;
    const palabras = filtroBusquedaAuditoria.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cadenaAud = `${item.usuario_auditoria || ''} ${item.detalle_auditoria || ''} ${item.accion_auditoria || ''} ${item.entidad_auditoria || ''}`.toLowerCase();
    return palabras.every(palabra => cadenaAud.includes(palabra));
  });

  // ==========================================
  // CARGA BAJO DEMANDA Y UTILIDADES
  // ==========================================
  async function cargarEspecialidadesCatalogo() {
    try {
      especialidadesDisponibles = await obtenerEspecialidades();
    } catch (err) {
      console.error('Error al cargar catálogo de especialidades:', err);
    }
  }

  function toggleEspecialidadDoctor(id: string) {
    if (especialidadesDoctorSeleccionadas.includes(id)) {
      especialidadesDoctorSeleccionadas = especialidadesDoctorSeleccionadas.filter(item => item !== id);
    } else {
      especialidadesDoctorSeleccionadas = [...especialidadesDoctorSeleccionadas, id];
    }
  }

  function toggleEspecialidadDoctorEdicion(id: string) {
    if (formEditarDoctor.especialidadesIds.includes(id)) {
      formEditarDoctor.especialidadesIds = formEditarDoctor.especialidadesIds.filter(item => item !== id);
    } else {
      formEditarDoctor.especialidadesIds = [...formEditarDoctor.especialidadesIds, id];
    }
  }

  async function toggleDoctores() {
    mostrarDoctores = !mostrarDoctores;
    if (mostrarDoctores && listaDoctores.length === 0) {
      await recargarDoctores();
    }
  }

  async function recargarDoctores() {
    cargandoDoctores = true;
    try {
      listaDoctores = await obtenerDoctoresDetallados();
    } catch (err) {
      console.error('Error al cargar directorio de médicos:', err);
    } finally {
      cargandoDoctores = false;
    }
  }

  async function toggleEspecialidades() {
    mostrarEspecialidades = !mostrarEspecialidades;
    if (mostrarEspecialidades && listaEspecialidades.length === 0) {
      await recargarEspecialidades();
    }
  }

  async function recargarEspecialidades() {
    cargandoEspecialidades = true;
    try {
      listaEspecialidades = await obtenerEspecialidadesDetalladas();
      await cargarEspecialidadesCatalogo();
    } catch (err) {
      console.error('Error al cargar catálogo de especialidades:', err);
    } finally {
      cargandoEspecialidades = false;
    }
  }

  async function toggleUsuarios() {
    mostrarUsuarios = !mostrarUsuarios;
    if (mostrarUsuarios && listaUsuarios.length === 0) {
      await recargarUsuarios();
    }
  }

  async function recargarUsuarios() {
    cargandoUsuarios = true;
    try {
      listaUsuarios = await obtenerUsuariosExistentes();
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      cargandoUsuarios = false;
    }
  }

  async function togglePacientes() {
    mostrarPacientes = !mostrarPacientes;
    if (mostrarPacientes && listaPacientes.length === 0) {
      await recargarPacientes();
    }
  }

  async function recargarPacientes() {
    cargandoPacientes = true;
    try {
      if (filtroBusquedaPacientes.trim()) {
        listaPacientes = await buscarPacientePorCedula(filtroBusquedaPacientes.trim());
      } else {
        listaPacientes = await obtenerPacientesRecientes(50);
      }
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
    } finally {
      cargandoPacientes = false;
    }
  }

  async function recargarAuditoria() {
    cargandoAuditoria = true;
    try {
      listaAuditoria = await obtenerHistorialAuditoria(250);
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
    } finally {
      cargandoAuditoria = false;
    }
  }

  let generandoPdfAuditoria = false;

  async function descargarPDFAuditoria() {
    if (auditoriaFiltrada.length === 0) {
      mensajeError = 'No hay registros de auditoría disponibles para generar el reporte PDF.';
      return;
    }

    mensajeExito = '';
    mensajeError = '';
    generandoPdfAuditoria = true;

    try {
      const res = await generarPDFAuditoria({
        usuarioGenerador: usuarioActual?.nombre || 'Personal Administrativo',
        registros: auditoriaFiltrada,
        filtroAccion: filtroAccionAuditoria !== 'TODAS' ? filtroAccionAuditoria : 'Todas las acciones',
        filtroEntidad: filtroEntidadAuditoria !== 'TODAS' ? filtroEntidadAuditoria : 'Todos los módulos',
        filtroTexto: filtroBusquedaAuditoria
      });
      mensajeExito = `¡Reporte PDF de Auditoría generado e impreso exitosamente! Archivo: ${res.nombreArchivo}`;
    } catch (err: any) {
      console.error('Error al generar PDF de auditoría:', err);
      mensajeError = `Error al emitir el reporte PDF de auditoría: ${err.message || err}`;
    } finally {
      generandoPdfAuditoria = false;
    }
  }

  // ==========================================
  // FORMULARIOS DE ALTA
  // ==========================================
  let formDoctor = {
    nombre_doctor: '',
    apellido_doctor: '',
    ci_profesional_doctor: '',
    ci_doctor: ''
  };

  let tipoEspecialidad = '';

  let formUsuario = {
    nombre_usuario: '',
    password_usuario: '',
    rol_usuario: 'MEDICO'
  };

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

  onMount(async () => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'paciente' || tabParam === 'doctor' || tabParam === 'especialidad' || tabParam === 'usuario' || tabParam === 'auditoria') {
        tabActiva = tabParam;
      }
      // Cargar catálogo liviano de especialidades para doctor
      await cargarEspecialidadesCatalogo();
      if (tabActiva === 'auditoria') {
        await recargarAuditoria();
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

  function alCambiarCondicionPacienteEdicion() {
    if (esTitularEdicion) {
      formEditarPaciente.ci_beneficiario_paciente = null;
      formEditarPaciente.parentesco_paciente = null;
      formEditarPaciente.nombre_titular_paciente = formEditarPaciente.nombre_completo_paciente;
    } else {
      if (!formEditarPaciente.parentesco_paciente) {
        formEditarPaciente.parentesco_paciente = 'HIJO(A)';
      }
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

  // ==========================================
  // OPERACIONES GUARDAR
  // ==========================================
  async function guardarDoctor() {
    mensajeExito = '';
    mensajeError = '';

    if (!formDoctor.nombre_doctor.trim() || !formDoctor.apellido_doctor.trim() || !formDoctor.ci_doctor.trim() || !formDoctor.ci_profesional_doctor.trim()) {
      mensajeError = 'Por favor complete todos los datos requeridos del médico.';
      return;
    }

    guardando = true;
    try {
      // Obtener nombres de especialidades seleccionadas para la auditoría
      const nombresEsp = especialidadesDisponibles
        .filter(e => especialidadesDoctorSeleccionadas.includes(String(e.id_especialidad)))
        .map(e => e.tipo_especialidad)
        .join(', ');

      await crearDoctorConEspecialidades(
        formDoctor,
        especialidadesDoctorSeleccionadas,
        usuarioActual?.nombre || 'Administrador',
        nombresEsp
      );

      mensajeExito = `¡Especialista médico ${formDoctor.nombre_doctor} ${formDoctor.apellido_doctor} registrado exitosamente!`;
      formDoctor = {
        nombre_doctor: '',
        apellido_doctor: '',
        ci_profesional_doctor: '',
        ci_doctor: ''
      };
      especialidadesDoctorSeleccionadas = [];
      if (mostrarDoctores) {
        await recargarDoctores();
      }
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
    if (!tipoEspecialidad.trim()) {
      mensajeError = 'Debe indicar el nombre de la especialidad.';
      return;
    }
    guardando = true;
    try {
      await crearEspecialidad({ tipo_especialidad: tipoEspecialidad }, usuarioActual?.nombre || 'Administrador');
      mensajeExito = '¡Especialidad médica registrada exitosamente!';
      tipoEspecialidad = '';
      await cargarEspecialidadesCatalogo();
      if (mostrarEspecialidades) {
        await recargarEspecialidades();
      }
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
    if (!formUsuario.nombre_usuario.trim() || !formUsuario.password_usuario.trim()) {
      mensajeError = 'Por favor complete el nombre de usuario y contraseña.';
      return;
    }
    guardando = true;
    try {
      await crearUsuario(formUsuario, usuarioActual?.nombre || 'Administrador');
      mensajeExito = `¡Cuenta de usuario "${formUsuario.nombre_usuario}" creada exitosamente!`;
      formUsuario = {
        nombre_usuario: '',
        password_usuario: '',
        rol_usuario: 'MEDICO'
      };
      if (mostrarUsuarios) {
        await recargarUsuarios();
      }
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      mensajeError = `Error al registrar usuario: ${error.message || error}`;
    } finally {
      guardando = false;
    }
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

      await crearPaciente(datosAEnviar, usuarioActual?.nombre || 'Administrador');
      mensajeExito = `¡Paciente ${nombreCompleto} registrado exitosamente en la base de datos!`;
      limpiarFormPaciente();
      if (mostrarPacientes) {
        await recargarPacientes();
      }
    } catch (error: any) {
      console.error('Error al registrar paciente:', error);
      mensajeError = error?.message || 'Ocurrió un error al registrar el paciente en el sistema.';
    } finally {
      guardando = false;
    }
  }

  // ==========================================
  // OPERACIONES DE EDICIÓN Y ELIMINACIÓN
  // ==========================================
  // DOCTOR
  function abrirModalEditarDoctor(doc: DoctorDetallado) {
    doctorAEditar = doc;
    formEditarDoctor = {
      nombre_doctor: doc.nombre_doctor || '',
      apellido_doctor: doc.apellido_doctor || '',
      ci_profesional_doctor: doc.ci_profesional_doctor || '',
      ci_doctor: doc.ci_doctor || '',
      especialidadesIds: doc.especialidades_ids ? [...doc.especialidades_ids] : []
    };
  }

  async function ejecutarEdicionDoctor() {
    if (!doctorAEditar) return;
    guardando = true;
    try {
      const nombresEsp = especialidadesDisponibles
        .filter(e => formEditarDoctor.especialidadesIds.includes(String(e.id_especialidad)))
        .map(e => e.tipo_especialidad)
        .join(', ');

      await editarDoctor(
        doctorAEditar.id_doctor,
        {
          nombre_doctor: formEditarDoctor.nombre_doctor,
          apellido_doctor: formEditarDoctor.apellido_doctor,
          ci_profesional_doctor: formEditarDoctor.ci_profesional_doctor,
          ci_doctor: formEditarDoctor.ci_doctor
        },
        formEditarDoctor.especialidadesIds,
        usuarioActual?.nombre || 'Administrador',
        nombresEsp
      );

      mensajeExito = `¡Médico ${formEditarDoctor.nombre_doctor} ${formEditarDoctor.apellido_doctor} actualizado exitosamente!`;
      doctorAEditar = null;
      await recargarDoctores();
    } catch (err: any) {
      console.error('Error al editar doctor:', err);
      mensajeError = `Error al actualizar doctor: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  function abrirModalEliminarDoctor(doc: DoctorDetallado) {
    doctorAEliminar = doc;
  }

  async function ejecutarBajaDoctor() {
    if (!doctorAEliminar) return;
    guardando = true;
    try {
      await eliminarDoctor(
        doctorAEliminar.id_doctor,
        doctorAEliminar.nombre_completo,
        doctorAEliminar.ci_doctor,
        usuarioActual?.nombre || 'Administrador'
      );
      mensajeExito = `¡Médico ${doctorAEliminar.nombre_completo} dado de baja (ocultado) del sistema. Sus registros previos se conservan intactos.`;
      doctorAEliminar = null;
      await recargarDoctores();
    } catch (err: any) {
      console.error('Error al dar de baja doctor:', err);
      mensajeError = `Error al procesar baja del médico: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  // ESPECIALIDAD
  function abrirModalEditarEspecialidad(esp: EspecialidadDetallada) {
    especialidadAEditar = esp;
    nombreEspecialidadEditar = esp.tipo_especialidad;
  }

  async function ejecutarEdicionEspecialidad() {
    if (!especialidadAEditar || !nombreEspecialidadEditar.trim()) return;
    guardando = true;
    try {
      await editarEspecialidad(
        especialidadAEditar.id_especialidad,
        nombreEspecialidadEditar.trim(),
        usuarioActual?.nombre || 'Administrador'
      );
      mensajeExito = '¡Especialidad médica actualizada exitosamente!';
      especialidadAEditar = null;
      await recargarEspecialidades();
    } catch (err: any) {
      console.error('Error al editar especialidad:', err);
      mensajeError = `Error al actualizar especialidad: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  function abrirModalEliminarEspecialidad(esp: EspecialidadDetallada) {
    especialidadAEliminar = esp;
  }

  async function ejecutarBajaEspecialidad() {
    if (!especialidadAEliminar) return;
    guardando = true;
    try {
      await eliminarEspecialidad(
        especialidadAEliminar.id_especialidad,
        especialidadAEliminar.tipo_especialidad,
        usuarioActual?.nombre || 'Administrador'
      );
      mensajeExito = `¡Especialidad "${especialidadAEliminar.tipo_especialidad}" dada de baja (ocultada) exitosamente!`;
      especialidadAEliminar = null;
      await recargarEspecialidades();
    } catch (err: any) {
      console.error('Error al eliminar especialidad:', err);
      mensajeError = `Error al procesar baja de especialidad: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  // USUARIO
  function abrirModalEditarUsuario(usr: UsuarioDetallado) {
    usuarioAEditar = usr;
    formEditarUsuario = {
      nombre_usuario: usr.nombre_usuario,
      password_usuario: '',
      rol_usuario: usr.rol_usuario
    };
  }

  async function ejecutarEdicionUsuario() {
    if (!usuarioAEditar) return;
    guardando = true;
    try {
      await editarUsuario(
        usuarioAEditar.id_usuario,
        formEditarUsuario,
        usuarioActual?.nombre || 'Administrador'
      );
      mensajeExito = `¡Cuenta de usuario "${formEditarUsuario.nombre_usuario}" actualizada correctamente!`;
      usuarioAEditar = null;
      await recargarUsuarios();
    } catch (err: any) {
      console.error('Error al editar usuario:', err);
      mensajeError = `Error al actualizar usuario: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  function abrirModalEliminarUsuario(usr: UsuarioDetallado) {
    usuarioAEliminar = usr;
  }

  async function ejecutarBajaUsuario() {
    if (!usuarioAEliminar) return;
    if (usuarioAEliminar.nombre_usuario === usuarioActual?.nombre) {
      mensajeError = 'No puede darse de baja a sí mismo mientras tiene la sesión activa.';
      usuarioAEliminar = null;
      return;
    }
    guardando = true;
    try {
      await eliminarUsuario(
        usuarioAEliminar.id_usuario,
        usuarioAEliminar.nombre_usuario,
        usuarioActual?.nombre || 'Administrador'
      );
      mensajeExito = `¡Usuario "${usuarioAEliminar.nombre_usuario}" desactivado (ocultado) del sistema!`;
      usuarioAEliminar = null;
      await recargarUsuarios();
    } catch (err: any) {
      console.error('Error al desactivar usuario:', err);
      mensajeError = `Error al desactivar usuario: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  // PACIENTE
  function abrirModalEditarPaciente(pac: Paciente) {
    pacienteAEditar = pac;
    esTitularEdicion = !pac.ci_beneficiario_paciente && (!pac.parentesco_paciente || pac.parentesco_paciente.trim() === '');
    formEditarPaciente = {
      nombre_completo_paciente: pac.nombre_completo_paciente || '',
      nombre_titular_paciente: pac.nombre_titular_paciente || '',
      ci_titular_paciente: pac.ci_titular_paciente || '',
      ci_beneficiario_paciente: pac.ci_beneficiario_paciente || null,
      fecha_nacimiento_paciente: pac.fecha_nacimiento_paciente ? pac.fecha_nacimiento_paciente.split('T')[0] : '',
      sexo_paciente: pac.sexo_paciente || 'M',
      tipo_personal_paciente: pac.tipo_personal_paciente || 'DOCENTE',
      categoria_trabajador_paciente: pac.categoria_trabajador_paciente || 'ACTIVO',
      parentesco_paciente: pac.parentesco_paciente || null
    };
  }

  async function ejecutarEdicionPaciente() {
    if (!pacienteAEditar) return;
    guardando = true;
    try {
      const datosAEnviar: CrearPacienteInput = {
        nombre_completo_paciente: formEditarPaciente.nombre_completo_paciente.trim(),
        nombre_titular_paciente: esTitularEdicion ? formEditarPaciente.nombre_completo_paciente.trim() : formEditarPaciente.nombre_titular_paciente.trim(),
        ci_titular_paciente: formEditarPaciente.ci_titular_paciente?.trim() || null,
        ci_beneficiario_paciente: esTitularEdicion ? null : (formEditarPaciente.ci_beneficiario_paciente?.trim() || null),
        fecha_nacimiento_paciente: formEditarPaciente.fecha_nacimiento_paciente?.trim() || '',
        sexo_paciente: formEditarPaciente.sexo_paciente,
        tipo_personal_paciente: formEditarPaciente.tipo_personal_paciente,
        categoria_trabajador_paciente: formEditarPaciente.categoria_trabajador_paciente,
        parentesco_paciente: esTitularEdicion ? null : formEditarPaciente.parentesco_paciente
      };

      await editarPaciente(
        pacienteAEditar.id_paciente,
        datosAEnviar,
        usuarioActual?.nombre || 'Administrador'
      );

      mensajeExito = `¡Datos del paciente ${formEditarPaciente.nombre_completo_paciente} actualizados con éxito!`;
      pacienteAEditar = null;
      await recargarPacientes();
    } catch (err: any) {
      console.error('Error al editar paciente:', err);
      mensajeError = `Error al actualizar paciente: ${err.message || err}`;
    } finally {
      guardando = false;
    }
  }

  function abrirModalEliminarPaciente(pac: Paciente) {
    pacienteAEliminar = pac;
  }

  async function ejecutarBajaPaciente() {
    if (!pacienteAEliminar) return;
    guardando = true;
    try {
      await eliminarPaciente(
        pacienteAEliminar.id_paciente,
        pacienteAEliminar.nombre_completo_paciente,
        pacienteAEliminar.ci_titular_paciente || pacienteAEliminar.ci_beneficiario_paciente || '',
        usuarioActual?.nombre || 'Administrador'
      );
      mensajeExito = `¡Paciente ${pacienteAEliminar.nombre_completo_paciente} dado de baja (ocultado). Sus consultas e historial permanecen en la base de datos.`;
      pacienteAEliminar = null;
      await recargarPacientes();
    } catch (err: any) {
      console.error('Error al dar de baja paciente:', err);
      mensajeError = `Error al procesar baja del paciente: ${err.message || err}`;
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
        <p class="subtitulo">Gestione el alta de especialistas médicos, asignación múltiple de especialidades, cuentas operativas y pacientes institucionales. Todo con auditoría cronológica y bajas lógicas seguras.</p>
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

          <button 
            type="button"
            class="tab-btn tab-btn-auditoria"
            class:active={tabActiva === 'auditoria'} 
            on:click={() => { tabActiva = 'auditoria'; mensajeExito = ''; mensajeError = ''; recargarAuditoria(); }}
          >
            <span class="material-symbols-outlined">history</span>
            <span>Historial Agregado/editado/eliminado</span>
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

        <!-- ======================================================= -->
        <!-- TAB 1: DOCTOR -->
        <!-- ======================================================= -->
        {#if tabActiva === 'doctor'}
          <div class="bloque-formulario">
            <div class="form-seccion-header">
              <h3>Registro de Especialista Médico</h3>
              <p>Ingrese los datos personales, colegiatura profesional y asigne una o varias especialidades clínicas.</p>
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

              <!-- Selector de Especialidades Múltiples -->
              <div class="form-group full-width seccion-especialidades-doc">
                <div class="header-subcampo-esp">
                  <label>Especialidades Clínicas del Doctor *</label>
                  <span class="contador-esp-seleccionadas">
                    {especialidadesDoctorSeleccionadas.length} especialidad(es) seleccionada(s)
                  </span>
                </div>
                <p class="ayuda-subcampo">Puede marcar múltiples áreas si el médico ejerce varias disciplinas (ej. Traumatología y Medicina General):</p>

                {#if especialidadesDisponibles.length === 0}
                  <div class="aviso-sin-esp">
                    <span class="material-symbols-outlined">info</span>
                    <span>No hay especialidades registradas en el sistema. Puede registrar especialidades en la pestaña "Registrar Especialidad".</span>
                  </div>
                {:else}
                  <div class="grid-checkboxes-esp">
                    {#each especialidadesDisponibles as esp}
                      <label 
                        class="chip-checkbox-esp"
                        class:chip-seleccionado={especialidadesDoctorSeleccionadas.includes(String(esp.id_especialidad))}
                      >
                        <input 
                          type="checkbox" 
                          checked={especialidadesDoctorSeleccionadas.includes(String(esp.id_especialidad))}
                          on:change={() => toggleEspecialidadDoctor(String(esp.id_especialidad))}
                          disabled={guardando}
                        />
                        <span class="material-symbols-outlined icono-chip">
                          {especialidadesDoctorSeleccionadas.includes(String(esp.id_especialidad)) ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span class="texto-chip">{esp.tipo_especialidad}</span>
                      </label>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="form-group full-width btn-container">
                <button type="submit" class="btn-submit" disabled={guardando}>
                  <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
                  <span>{guardando ? 'Guardando...' : 'Guardar Especialista'}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- SECCIÓN BAJO DEMANDA: DOCTORES EN EXISTENCIA -->
          <div class="seccion-ondemand-contenedor">
            <div class="barra-ondemand-header">
              <div class="info-ondemand">
                <span class="material-symbols-outlined icono-ondemand">clinical_notes</span>
                <div>
                  <h4 class="titulo-ondemand">Directorio de Médicos en Existencia</h4>
                  <p class="sub-ondemand">Consulte la nómina de especialistas, edite datos o dé de baja bajo demanda.</p>
                </div>
              </div>

              <div class="acciones-ondemand">
                <button 
                  type="button" 
                  class="btn-ondemand {mostrarDoctores ? 'activo' : ''}" 
                  on:click={toggleDoctores}
                  disabled={cargandoDoctores}
                >
                  <span class="material-symbols-outlined">{mostrarDoctores ? 'expand_less' : 'visibility'}</span>
                  <span>{mostrarDoctores ? 'Ocultar Listado' : 'Consultar Médicos en Existencia'}</span>
                </button>

                {#if mostrarDoctores}
                  <button 
                    type="button" 
                    class="btn-recargar-ondemand" 
                    on:click={recargarDoctores} 
                    disabled={cargandoDoctores}
                    title="Actualizar listado de médicos"
                  >
                    <span class="material-symbols-outlined {cargandoDoctores ? 'spinner-icon' : ''}">refresh</span>
                  </button>
                {/if}
              </div>
            </div>

            {#if mostrarDoctores}
              <div class="bloque-tabla-ondemand">
                <div class="listado-buscador-wrapper">
                  <div class="listado-buscador">
                    <span class="material-symbols-outlined">search</span>
                    <input 
                      type="text" 
                      placeholder="Filtrar por nombre, cédula o especialidad..." 
                      bind:value={filtroBusquedaDoctores} 
                    />
                  </div>
                  <span class="badge-total-items">{doctoresFiltrados.length} médicos encontrados</span>
                </div>

                {#if cargandoDoctores}
                  <div class="cargando-fila">
                    <span class="material-symbols-outlined spinner-icon">progress_activity</span>
                    <span>Consultando base de datos de especialistas...</span>
                  </div>
                {:else if doctoresFiltrados.length === 0}
                  <div class="vacio-fila">
                    <span class="material-symbols-outlined">person_off</span>
                    <p>No se encontraron especialistas médicos registrados o coincidentes.</p>
                  </div>
                {:else}
                  <div class="tabla-existencia-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Cédula</th>
                          <th>MPPS / Profesional</th>
                          <th>Nombre del Médico</th>
                          <th>Especialidades</th>
                          <th>Consultas</th>
                          <th>Estado</th>
                          <th class="th-acciones">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each doctoresFiltrados as doc}
                          <tr>
                            <td class="texto-bold">{doc.ci_doctor}</td>
                            <td><span class="badge-profesional">{doc.ci_profesional_doctor}</span></td>
                            <td class="texto-bold-primario">{doc.nombre_completo}</td>
                            <td><span class="badge-esp-tabla">{doc.especialidades}</span></td>
                            <td class="texto-centro">{doc.total_consultas}</td>
                            <td><span class="badge-activo">Activo</span></td>
                            <td class="td-acciones">
                              <div class="botones-accion-fila">
                                <button 
                                  type="button" 
                                  class="btn-accion-editar" 
                                  on:click={() => abrirModalEditarDoctor(doc)}
                                  title="Editar médico y especialidades"
                                >
                                  <span class="material-symbols-outlined">edit</span>
                                  <span>Editar</span>
                                </button>
                                <button 
                                  type="button" 
                                  class="btn-accion-eliminar" 
                                  on:click={() => abrirModalEliminarDoctor(doc)}
                                  title="Dar de baja (ocultamiento lógico)"
                                >
                                  <span class="material-symbols-outlined">delete</span>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- ======================================================= -->
        <!-- TAB 2: ESPECIALIDAD -->
        <!-- ======================================================= -->
        {#if tabActiva === 'especialidad'}
          <div class="bloque-formulario">
            <div class="form-seccion-header">
              <h3>Registro de Especialidad Médica</h3>
              <p>Ingrese el nombre del área o especialidad médica disponible en el centro de salud SISUNERMB.</p>
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
          </div>

          <!-- SECCIÓN BAJO DEMANDA: ESPECIALIDADES EN EXISTENCIA -->
          <div class="seccion-ondemand-contenedor">
            <div class="barra-ondemand-header">
              <div class="info-ondemand">
                <span class="material-symbols-outlined icono-ondemand">medical_services</span>
                <div>
                  <h4 class="titulo-ondemand">Catálogo de Especialidades en Existencia</h4>
                  <p class="sub-ondemand">Consulte o edite las áreas clínicas registradas bajo demanda.</p>
                </div>
              </div>

              <div class="acciones-ondemand">
                <button 
                  type="button" 
                  class="btn-ondemand {mostrarEspecialidades ? 'activo' : ''}" 
                  on:click={toggleEspecialidades}
                  disabled={cargandoEspecialidades}
                >
                  <span class="material-symbols-outlined">{mostrarEspecialidades ? 'expand_less' : 'visibility'}</span>
                  <span>{mostrarEspecialidades ? 'Ocultar Listado' : 'Consultar Especialidades'}</span>
                </button>

                {#if mostrarEspecialidades}
                  <button 
                    type="button" 
                    class="btn-recargar-ondemand" 
                    on:click={recargarEspecialidades} 
                    disabled={cargandoEspecialidades}
                    title="Actualizar catálogo de especialidades"
                  >
                    <span class="material-symbols-outlined {cargandoEspecialidades ? 'spinner-icon' : ''}">refresh</span>
                  </button>
                {/if}
              </div>
            </div>

            {#if mostrarEspecialidades}
              <div class="bloque-tabla-ondemand">
                <div class="listado-buscador-wrapper">
                  <div class="listado-buscador">
                    <span class="material-symbols-outlined">search</span>
                    <input 
                      type="text" 
                      placeholder="Filtrar especialidad clínica..." 
                      bind:value={filtroBusquedaEspecialidades} 
                    />
                  </div>
                  <span class="badge-total-items">{especialidadesFiltradas.length} especialidades</span>
                </div>

                {#if cargandoEspecialidades}
                  <div class="cargando-fila">
                    <span class="material-symbols-outlined spinner-icon">progress_activity</span>
                    <span>Consultando catálogo de especialidades...</span>
                  </div>
                {:else if especialidadesFiltradas.length === 0}
                  <div class="vacio-fila">
                    <span class="material-symbols-outlined">category</span>
                    <p>No se encontraron especialidades médicas registradas.</p>
                  </div>
                {:else}
                  <div class="tabla-existencia-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Área o Especialidad Médica</th>
                          <th>Doctores Vinculados</th>
                          <th>Consultas Registradas</th>
                          <th>Disponibilidad</th>
                          <th class="th-acciones">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each especialidadesFiltradas as esp}
                          <tr>
                            <td class="texto-bold-primario">{esp.tipo_especialidad}</td>
                            <td class="texto-centro">{esp.total_doctores} médico(s)</td>
                            <td class="texto-centro">{esp.total_consultas}</td>
                            <td><span class="badge-activo">Disponible</span></td>
                            <td class="td-acciones">
                              <div class="botones-accion-fila">
                                <button 
                                  type="button" 
                                  class="btn-accion-editar" 
                                  on:click={() => abrirModalEditarEspecialidad(esp)}
                                  title="Editar nombre de la especialidad"
                                >
                                  <span class="material-symbols-outlined">edit</span>
                                  <span>Editar</span>
                                </button>
                                <button 
                                  type="button" 
                                  class="btn-accion-eliminar" 
                                  on:click={() => abrirModalEliminarEspecialidad(esp)}
                                  title="Dar de baja especialidad"
                                >
                                  <span class="material-symbols-outlined">delete</span>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- ======================================================= -->
        <!-- TAB 3: USUARIO -->
        <!-- ======================================================= -->
        {#if tabActiva === 'usuario'}
          <div class="bloque-formulario">
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
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="MEDICO">MÉDICO / TRATANTE</option>
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
          </div>

          <!-- SECCIÓN BAJO DEMANDA: USUARIOS EN EXISTENCIA -->
          <div class="seccion-ondemand-contenedor">
            <div class="barra-ondemand-header">
              <div class="info-ondemand">
                <span class="material-symbols-outlined icono-ondemand">manage_accounts</span>
                <div>
                  <h4 class="titulo-ondemand">Cuentas de Usuario en Existencia</h4>
                  <p class="sub-ondemand">Consulte, edite o desactive cuentas operativas autorizadas bajo demanda.</p>
                </div>
              </div>

              <div class="acciones-ondemand">
                <button 
                  type="button" 
                  class="btn-ondemand {mostrarUsuarios ? 'activo' : ''}" 
                  on:click={toggleUsuarios}
                  disabled={cargandoUsuarios}
                >
                  <span class="material-symbols-outlined">{mostrarUsuarios ? 'expand_less' : 'visibility'}</span>
                  <span>{mostrarUsuarios ? 'Ocultar Listado' : 'Consultar Usuarios'}</span>
                </button>

                {#if mostrarUsuarios}
                  <button 
                    type="button" 
                    class="btn-recargar-ondemand" 
                    on:click={recargarUsuarios} 
                    disabled={cargandoUsuarios}
                    title="Actualizar cuentas de usuario"
                  >
                    <span class="material-symbols-outlined {cargandoUsuarios ? 'spinner-icon' : ''}">refresh</span>
                  </button>
                {/if}
              </div>
            </div>

            {#if mostrarUsuarios}
              <div class="bloque-tabla-ondemand">
                <div class="listado-buscador-wrapper">
                  <div class="listado-buscador">
                    <span class="material-symbols-outlined">search</span>
                    <input 
                      type="text" 
                      placeholder="Filtrar por nombre de usuario o rol..." 
                      bind:value={filtroBusquedaUsuarios} 
                    />
                  </div>
                  <span class="badge-total-items">{usuariosFiltrados.length} cuentas registradas</span>
                </div>

                {#if cargandoUsuarios}
                  <div class="cargando-fila">
                    <span class="material-symbols-outlined spinner-icon">progress_activity</span>
                    <span>Consultando cuentas de acceso...</span>
                  </div>
                {:else if usuariosFiltrados.length === 0}
                  <div class="vacio-fila">
                    <span class="material-symbols-outlined">no_accounts</span>
                    <p>No se encontraron cuentas de usuario registradas.</p>
                  </div>
                {:else}
                  <div class="tabla-existencia-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Usuario (Login)</th>
                          <th>Rol Asignado</th>
                          <th>Fecha de Registro</th>
                          <th>Estado</th>
                          <th class="th-acciones">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each usuariosFiltrados as usr}
                          <tr>
                            <td class="texto-bold-primario">
                              <div class="usuario-fila-nombre">
                                <span class="material-symbols-outlined">account_circle</span>
                                <span>{usr.nombre_usuario}</span>
                              </div>
                            </td>
                            <td>
                              <span class="badge-rol {usr.rol_usuario.toLowerCase()}">{usr.rol_usuario}</span>
                            </td>
                            <td>{usr.fecha_creacion_usuario || 'Registrado en sistema'}</td>
                            <td><span class="badge-activo">Habilitado</span></td>
                            <td class="td-acciones">
                              <div class="botones-accion-fila">
                                <button 
                                  type="button" 
                                  class="btn-accion-editar" 
                                  on:click={() => abrirModalEditarUsuario(usr)}
                                  title="Editar usuario o contraseña"
                                >
                                  <span class="material-symbols-outlined">edit</span>
                                  <span>Editar</span>
                                </button>
                                <button 
                                  type="button" 
                                  class="btn-accion-eliminar" 
                                  on:click={() => abrirModalEliminarUsuario(usr)}
                                  title="Desactivar (ocultamiento lógico)"
                                >
                                  <span class="material-symbols-outlined">delete</span>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- ======================================================= -->
        <!-- TAB 4: PACIENTE -->
        <!-- ======================================================= -->
        {#if tabActiva === 'paciente'}
          <div class="bloque-formulario">
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

              {#if !esTitular}
                <div class="form-group">
                  <label for="pac_nom_titular">Nombre Completo del Titular *</label>
                  <div class="input-con-icono">
                    <span class="material-symbols-outlined">badge</span>
                    <input 
                      type="text" 
                      id="pac_nom_titular" 
                      bind:value={formPaciente.nombre_titular_paciente} 
                      required={!esTitular} 
                      placeholder="Ej. Juan Carlos Rodríguez" 
                      disabled={guardando} 
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="pac_ci_beneficiario">Cédula del Beneficiario (Opcional)</label>
                  <div class="input-con-icono">
                    <span class="material-symbols-outlined">id_card</span>
                    <input 
                      type="text" 
                      id="pac_ci_beneficiario" 
                      bind:value={formPaciente.ci_beneficiario_paciente} 
                      placeholder="Ej. V-28123456 (Dejar vacío si es menor sin C.I.)" 
                      disabled={guardando} 
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="pac_parentesco">Parentesco con el Titular *</label>
                  <div class="input-con-icono">
                    <span class="material-symbols-outlined">family_restroom</span>
                    <select id="pac_parentesco" bind:value={formPaciente.parentesco_paciente} disabled={guardando} required={!esTitular}>
                      <option value="HIJO(A)">HIJO(A)</option>
                      <option value="CONYUGE">CÓNYUGE / ESPOSO(A)</option>
                      <option value="PADRE/MADRE">PADRE / MADRE</option>
                      <option value="HERMANO(A)">HERMANO(A)</option>
                      <option value="OTRO">OTRO FAMILIAR</option>
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
          </div>

          <!-- SECCIÓN BAJO DEMANDA: PACIENTES EN EXISTENCIA -->
          <div class="seccion-ondemand-contenedor">
            <div class="barra-ondemand-header">
              <div class="info-ondemand">
                <span class="material-symbols-outlined icono-ondemand">personal_injury</span>
                <div>
                  <h4 class="titulo-ondemand">Directorio de Pacientes en Existencia</h4>
                  <p class="sub-ondemand">Busque pacientes institucionales, modifique datos erróneos o gestione bajas lógicas seguras.</p>
                </div>
              </div>

              <div class="acciones-ondemand">
                <button 
                  type="button" 
                  class="btn-ondemand {mostrarPacientes ? 'activo' : ''}" 
                  on:click={togglePacientes}
                  disabled={cargandoPacientes}
                >
                  <span class="material-symbols-outlined">{mostrarPacientes ? 'expand_less' : 'visibility'}</span>
                  <span>{mostrarPacientes ? 'Ocultar Listado' : 'Consultar Pacientes en Existencia'}</span>
                </button>

                {#if mostrarPacientes}
                  <button 
                    type="button" 
                    class="btn-recargar-ondemand" 
                    on:click={recargarPacientes} 
                    disabled={cargandoPacientes}
                    title="Actualizar listado de pacientes"
                  >
                    <span class="material-symbols-outlined {cargandoPacientes ? 'spinner-icon' : ''}">refresh</span>
                  </button>
                {/if}
              </div>
            </div>

            {#if mostrarPacientes}
              <div class="bloque-tabla-ondemand">
                <div class="listado-buscador-wrapper">
                  <div class="listado-buscador">
                    <span class="material-symbols-outlined">search</span>
                    <input 
                      type="text" 
                      placeholder="Buscar por cédula titular/beneficiario o nombre completo..." 
                      bind:value={filtroBusquedaPacientes} 
                      on:keydown={(e) => { if (e.key === 'Enter') recargarPacientes(); }}
                    />
                  </div>
                  <button type="button" class="btn-buscar-mini" on:click={recargarPacientes} disabled={cargandoPacientes}>
                    Buscar
                  </button>
                  <span class="badge-total-items">{pacientesFiltrados.length} pacientes encontrados</span>
                </div>

                {#if cargandoPacientes}
                  <div class="cargando-fila">
                    <span class="material-symbols-outlined spinner-icon">progress_activity</span>
                    <span>Consultando padrón de pacientes...</span>
                  </div>
                {:else if pacientesFiltrados.length === 0}
                  <div class="vacio-fila">
                    <span class="material-symbols-outlined">person_off</span>
                    <p>No se encontraron pacientes registrados con los criterios indicados.</p>
                  </div>
                {:else}
                  <div class="tabla-existencia-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Cédula Titular</th>
                          <th>C.I. Beneficiario</th>
                          <th>Nombre del Paciente</th>
                          <th>Condición / Parentesco</th>
                          <th>Tipo Personal</th>
                          <th>Categoría</th>
                          <th class="th-acciones">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each pacientesFiltrados as pac}
                          <tr>
                            <td class="texto-bold">{pac.ci_titular_paciente || 'S/C'}</td>
                            <td>{pac.ci_beneficiario_paciente || '—'}</td>
                            <td class="texto-bold-primario">{pac.nombre_completo_paciente}</td>
                            <td>
                              <span class="badge-parentesco {pac.parentesco_paciente ? 'beneficiario' : 'titular'}">
                                {pac.parentesco_paciente ? `Beneficiario (${pac.parentesco_paciente})` : 'Titular'}
                              </span>
                            </td>
                            <td>{pac.tipo_personal_paciente}</td>
                            <td><span class="badge-categoria">{pac.categoria_trabajador_paciente}</span></td>
                            <td class="td-acciones">
                              <div class="botones-accion-fila">
                                <button 
                                  type="button" 
                                  class="btn-accion-editar" 
                                  on:click={() => abrirModalEditarPaciente(pac)}
                                  title="Editar datos del paciente"
                                >
                                  <span class="material-symbols-outlined">edit</span>
                                  <span>Editar</span>
                                </button>
                                <button 
                                  type="button" 
                                  class="btn-accion-eliminar" 
                                  on:click={() => abrirModalEliminarPaciente(pac)}
                                  title="Dar de baja (ocultamiento lógico)"
                                >
                                  <span class="material-symbols-outlined">delete</span>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- ======================================================= -->
        <!-- TAB 5: HISTORIAL AGREGADO / EDITADO / ELIMINADO -->
        <!-- ======================================================= -->
        {#if tabActiva === 'auditoria'}
          <div class="bloque-formulario">
            <div class="form-seccion-header barra-auditoria-top">
              <div>
                <h3>Historial Agregado/editado/eliminado</h3>
                <p>Auditoría cronológica de las acciones operativas ejecutadas por los usuarios (altas, modificaciones y bajas lógicas).</p>
              </div>

              <div class="acciones-auditoria-top">
                <button 
                  type="button" 
                  class="btn-pdf-auditoria" 
                  on:click={descargarPDFAuditoria}
                  disabled={generandoPdfAuditoria || cargandoAuditoria || auditoriaFiltrada.length === 0}
                  title="Generar e imprimir reporte PDF oficial de auditoría"
                >
                  <span class="material-symbols-outlined">{generandoPdfAuditoria ? 'hourglass_top' : 'picture_as_pdf'}</span>
                  <span>{generandoPdfAuditoria ? 'Generando PDF...' : 'Imprimir Reporte PDF'}</span>
                </button>

                <button 
                  type="button" 
                  class="btn-recargar-auditoria" 
                  on:click={recargarAuditoria} 
                  disabled={cargandoAuditoria}
                  title="Actualizar registro de auditoría"
                >
                  <span class="material-symbols-outlined {cargandoAuditoria ? 'spinner-icon' : ''}">refresh</span>
                  <span>Actualizar Historial</span>
                </button>
              </div>
            </div>

            <!-- Filtros de Auditoría -->
            <div class="filtros-auditoria-grid">
              <div class="listado-buscador full-width-buscador">
                <span class="material-symbols-outlined">search</span>
                <input 
                  type="text" 
                  placeholder="Buscar por usuario, nombre de médico, paciente o palabra clave..." 
                  bind:value={filtroBusquedaAuditoria} 
                />
              </div>

              <div class="select-filtro-item">
                <label for="filtro_accion">Tipo de Acción:</label>
                <select id="filtro_accion" bind:value={filtroAccionAuditoria}>
                  <option value="TODAS">Todas las acciones</option>
                  <option value="AGREGÓ">Altas (AGREGÓ)</option>
                  <option value="EDITÓ">Modificaciones (EDITÓ)</option>
                  <option value="ELIMINÓ">Bajas lógicas (ELIMINÓ)</option>
                </select>
              </div>

              <div class="select-filtro-item">
                <label for="filtro_entidad">Módulo / Entidad:</label>
                <select id="filtro_entidad" bind:value={filtroEntidadAuditoria}>
                  <option value="TODAS">Todos los módulos</option>
                  <option value="DOCTOR">Doctores</option>
                  <option value="PACIENTE">Pacientes</option>
                  <option value="USUARIO">Usuarios</option>
                  <option value="ESPECIALIDAD">Especialidades</option>
                </select>
              </div>
            </div>

            <div class="info-auditoria-resumen">
              <span>Mostrando <strong>{auditoriaFiltrada.length}</strong> eventos registrados</span>
              <span class="badge-aviso-seguridad">
                <span class="material-symbols-outlined">verified_user</span>
                <span>Los datos no se eliminan físicamente; las bajas representan ocultamiento lógico.</span>
              </span>
            </div>

            {#if cargandoAuditoria}
              <div class="cargando-fila">
                <span class="material-symbols-outlined spinner-icon">progress_activity</span>
                <span>Cargando eventos de auditoría desde PostgreSQL...</span>
              </div>
            {:else if auditoriaFiltrada.length === 0}
              <div class="vacio-fila">
                <span class="material-symbols-outlined">event_busy</span>
                <p>No se encontraron registros de auditoría que coincidan con los filtros seleccionados.</p>
              </div>
            {:else}
              <div class="tabla-existencia-responsive">
                <table>
                  <thead>
                    <tr>
                      <th style="min-width: 160px;">Fecha y Hora (VET)</th>
                      <th>Usuario Operativo</th>
                      <th>Acción</th>
                      <th>Entidad</th>
                      <th>Detalle de la Operación Realizada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each auditoriaFiltrada as reg}
                      <tr>
                        <td class="col-fecha-auditoria">
                          <div class="fecha-item">
                            <span class="material-symbols-outlined">schedule</span>
                            <span>{reg.fecha_formateada || reg.fecha_auditoria}</span>
                          </div>
                        </td>
                        <td>
                          <div class="usuario-fila-nombre">
                            <span class="material-symbols-outlined">account_circle</span>
                            <strong>{reg.usuario_auditoria}</strong>
                          </div>
                        </td>
                        <td>
                          <span class="badge-accion-auditoria {reg.accion_auditoria.toLowerCase()}">
                            {#if reg.accion_auditoria === 'AGREGÓ'}
                              <span class="material-symbols-outlined">add_circle</span>
                            {:else if reg.accion_auditoria === 'EDITÓ'}
                              <span class="material-symbols-outlined">edit_note</span>
                            {:else}
                              <span class="material-symbols-outlined">remove_circle</span>
                            {/if}
                            <span>{reg.accion_auditoria}</span>
                          </span>
                        </td>
                        <td>
                          <span class="badge-entidad-auditoria">{reg.entidad_auditoria}</span>
                        </td>
                        <td class="detalle-auditoria-texto">
                          {reg.detalle_auditoria}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<!-- ======================================================= -->
<!-- MODALES DE EDICIÓN Y CONFIRMACIÓN DE BAJA -->
<!-- ======================================================= -->

<!-- MODAL: EDITAR DOCTOR -->
{#if doctorAEditar}
  <div class="modal-overlay" on:click|self={() => doctorAEditar = null}>
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-titulo">
          <span class="material-symbols-outlined">local_hospital</span>
          <h3>Editar Especialista Médico</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => doctorAEditar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form on:submit|preventDefault={ejecutarEdicionDoctor} class="modal-body form-grid">
        <div class="form-group">
          <label for="ed_nom_doc">Nombre del Doctor *</label>
          <input type="text" id="ed_nom_doc" bind:value={formEditarDoctor.nombre_doctor} required disabled={guardando} />
        </div>

        <div class="form-group">
          <label for="ed_ape_doc">Apellido del Doctor *</label>
          <input type="text" id="ed_ape_doc" bind:value={formEditarDoctor.apellido_doctor} required disabled={guardando} />
        </div>

        <div class="form-group">
          <label for="ed_ci_doc">Cédula de Identidad *</label>
          <input type="text" id="ed_ci_doc" bind:value={formEditarDoctor.ci_doctor} required disabled={guardando} />
        </div>

        <div class="form-group">
          <label for="ed_mpps_doc">Cédula Profesional (MPPS) *</label>
          <input type="text" id="ed_mpps_doc" bind:value={formEditarDoctor.ci_profesional_doctor} required disabled={guardando} />
        </div>

        <!-- Especialidades del doctor en edición -->
        <div class="form-group full-width seccion-especialidades-doc">
          <div class="header-subcampo-esp">
            <label>Especialidades Clínicas Asignadas *</label>
            <span class="contador-esp-seleccionadas">
              {formEditarDoctor.especialidadesIds.length} especialidad(es) seleccionada(s)
            </span>
          </div>
          <div class="grid-checkboxes-esp">
            {#each especialidadesDisponibles as esp}
              <label 
                class="chip-checkbox-esp"
                class:chip-seleccionado={formEditarDoctor.especialidadesIds.includes(String(esp.id_especialidad))}
              >
                <input 
                  type="checkbox" 
                  checked={formEditarDoctor.especialidadesIds.includes(String(esp.id_especialidad))}
                  on:change={() => toggleEspecialidadDoctorEdicion(String(esp.id_especialidad))}
                  disabled={guardando}
                />
                <span class="material-symbols-outlined icono-chip">
                  {formEditarDoctor.especialidadesIds.includes(String(esp.id_especialidad)) ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span class="texto-chip">{esp.tipo_especialidad}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="modal-footer full-width">
          <button type="button" class="btn-cancelar" on:click={() => doctorAEditar = null} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" class="btn-guardar-modal" disabled={guardando}>
            <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
            <span>{guardando ? 'Actualizando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: CONFIRMAR BAJA (ELIMINAR) DOCTOR -->
{#if doctorAEliminar}
  <div class="modal-overlay" on:click|self={() => doctorAEliminar = null}>
    <div class="modal-card modal-peligro">
      <div class="modal-header">
        <div class="modal-titulo titulo-peligro">
          <span class="material-symbols-outlined">warning</span>
          <h3>Dar de Baja a Especialista Médico</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => doctorAEliminar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal-body">
        <p class="pregunta-eliminar">
          ¿Está seguro de que desea dar de baja (ocultar) al doctor <strong>{doctorAEliminar.nombre_completo}</strong> (C.I. {doctorAEliminar.ci_doctor})?
        </p>
        <div class="caja-aviso-segura">
          <span class="material-symbols-outlined">lock</span>
          <div>
            <strong>Conservación de Datos:</strong>
            <p>El médico dejará de aparecer en la lista activa de consultas, pero todas sus atenciones pasadas, diagnósticos y suspensiones otorgadas se preservarán intactas en la base de datos.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancelar" on:click={() => doctorAEliminar = null} disabled={guardando}>
          Cancelar
        </button>
        <button type="button" class="btn-confirmar-eliminar" on:click={ejecutarBajaDoctor} disabled={guardando}>
          <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'delete'}</span>
          <span>{guardando ? 'Procesando...' : 'Confirmar Ocultamiento'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: EDITAR ESPECIALIDAD -->
{#if especialidadAEditar}
  <div class="modal-overlay" on:click|self={() => especialidadAEditar = null}>
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-titulo">
          <span class="material-symbols-outlined">medical_services</span>
          <h3>Editar Especialidad Clínica</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => especialidadAEditar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form on:submit|preventDefault={ejecutarEdicionEspecialidad} class="modal-body">
        <div class="form-group full-width">
          <label for="ed_esp_nom">Nombre del Área o Especialidad *</label>
          <input type="text" id="ed_esp_nom" bind:value={nombreEspecialidadEditar} required disabled={guardando} />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancelar" on:click={() => especialidadAEditar = null} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" class="btn-guardar-modal" disabled={guardando}>
            <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
            <span>{guardando ? 'Actualizando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: CONFIRMAR BAJA ESPECIALIDAD -->
{#if especialidadAEliminar}
  <div class="modal-overlay" on:click|self={() => especialidadAEliminar = null}>
    <div class="modal-card modal-peligro">
      <div class="modal-header">
        <div class="modal-titulo titulo-peligro">
          <span class="material-symbols-outlined">warning</span>
          <h3>Dar de Baja Especialidad Médica</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => especialidadAEliminar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal-body">
        <p class="pregunta-eliminar">
          ¿Desea ocultar el área de <strong>{especialidadAEliminar.tipo_especialidad}</strong> del sistema?
        </p>
        <div class="caja-aviso-segura">
          <span class="material-symbols-outlined">lock</span>
          <div>
            <strong>Conservación de Historial:</strong>
            <p>Se realiza una baja lógica; las consultas previamente vinculadas a esta especialidad permanecen en las estadísticas de morbilidad.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancelar" on:click={() => especialidadAEliminar = null} disabled={guardando}>
          Cancelar
        </button>
        <button type="button" class="btn-confirmar-eliminar" on:click={ejecutarBajaEspecialidad} disabled={guardando}>
          <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'delete'}</span>
          <span>{guardando ? 'Procesando...' : 'Confirmar Ocultamiento'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: EDITAR USUARIO -->
{#if usuarioAEditar}
  <div class="modal-overlay" on:click|self={() => usuarioAEditar = null}>
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-titulo">
          <span class="material-symbols-outlined">manage_accounts</span>
          <h3>Editar Cuenta de Usuario</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => usuarioAEditar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form on:submit|preventDefault={ejecutarEdicionUsuario} class="modal-body form-grid">
        <div class="form-group full-width">
          <label for="ed_usr_nombre">Nombre de Usuario (Login) *</label>
          <input type="text" id="ed_usr_nombre" bind:value={formEditarUsuario.nombre_usuario} required disabled={guardando} />
        </div>

        <div class="form-group">
          <label for="ed_usr_rol">Rol Asignado *</label>
          <select id="ed_usr_rol" bind:value={formEditarUsuario.rol_usuario} disabled={guardando}>
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="MEDICO">MÉDICO / TRATANTE</option>
            <option value="RECEPCIONISTA">RECEPCIONISTA</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ed_usr_pass">Nueva Contraseña (Opcional)</label>
          <input type="password" id="ed_usr_pass" bind:value={formEditarUsuario.password_usuario} placeholder="Dejar en blanco para conservar" disabled={guardando} />
        </div>

        <div class="modal-footer full-width">
          <button type="button" class="btn-cancelar" on:click={() => usuarioAEditar = null} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" class="btn-guardar-modal" disabled={guardando}>
            <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
            <span>{guardando ? 'Actualizando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: CONFIRMAR BAJA USUARIO -->
{#if usuarioAEliminar}
  <div class="modal-overlay" on:click|self={() => usuarioAEliminar = null}>
    <div class="modal-card modal-peligro">
      <div class="modal-header">
        <div class="modal-titulo titulo-peligro">
          <span class="material-symbols-outlined">warning</span>
          <h3>Desactivar Cuenta de Usuario</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => usuarioAEliminar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal-body">
        <p class="pregunta-eliminar">
          ¿Desea desactivar (ocultar) la cuenta del usuario <strong>{usuarioAEliminar.nombre_usuario}</strong>?
        </p>
        <div class="caja-aviso-segura">
          <span class="material-symbols-outlined">lock</span>
          <div>
            <strong>Acceso Revocado:</strong>
            <p>El usuario ya no podrá iniciar sesión en SISUNERMB, pero la autoría de sus registros previos permanecerá en el sistema.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancelar" on:click={() => usuarioAEliminar = null} disabled={guardando}>
          Cancelar
        </button>
        <button type="button" class="btn-confirmar-eliminar" on:click={ejecutarBajaUsuario} disabled={guardando}>
          <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'delete'}</span>
          <span>{guardando ? 'Procesando...' : 'Confirmar Desactivación'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: EDITAR PACIENTE -->
{#if pacienteAEditar}
  <div class="modal-overlay" on:click|self={() => pacienteAEditar = null}>
    <div class="modal-card modal-grande">
      <div class="modal-header">
        <div class="modal-titulo">
          <span class="material-symbols-outlined">personal_injury</span>
          <h3>Editar Paciente Institucional</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => pacienteAEditar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form on:submit|preventDefault={ejecutarEdicionPaciente} class="modal-body form-grid">
        <div class="form-group full-width">
          <div class="condicion-card" style="margin-bottom: 0;">
            <label class="label-switch">
              <input 
                type="checkbox" 
                bind:checked={esTitularEdicion} 
                on:change={alCambiarCondicionPacienteEdicion}
                disabled={guardando} 
              />
              <span class="switch-texto">
                {esTitularEdicion 
                  ? 'El paciente es el propio Titular universitario' 
                  : 'El paciente es un Beneficiario asignado a un Titular'}
              </span>
            </label>
          </div>
        </div>

        <div class="form-group full-width">
          <label for="ed_pac_nombre">Nombre Completo del Paciente *</label>
          <input type="text" id="ed_pac_nombre" bind:value={formEditarPaciente.nombre_completo_paciente} required disabled={guardando} />
        </div>

        <div class="form-group">
          <label for="ed_pac_ci_titular">Cédula del Titular *</label>
          <input type="text" id="ed_pac_ci_titular" bind:value={formEditarPaciente.ci_titular_paciente} required disabled={guardando} />
        </div>

        {#if !esTitularEdicion}
          <div class="form-group">
            <label for="ed_pac_nom_titular">Nombre Completo del Titular *</label>
            <input type="text" id="ed_pac_nom_titular" bind:value={formEditarPaciente.nombre_titular_paciente} required disabled={guardando} />
          </div>

          <div class="form-group">
            <label for="ed_pac_ci_beneficiario">Cédula del Beneficiario</label>
            <input type="text" id="ed_pac_ci_beneficiario" bind:value={formEditarPaciente.ci_beneficiario_paciente} placeholder="V-28... (o vacío si es menor)" disabled={guardando} />
          </div>

          <div class="form-group">
            <label for="ed_pac_parentesco">Parentesco *</label>
            <select id="ed_pac_parentesco" bind:value={formEditarPaciente.parentesco_paciente} disabled={guardando} required>
              <option value="HIJO(A)">HIJO(A)</option>
              <option value="CONYUGE">CÓNYUGE / ESPOSO(A)</option>
              <option value="PADRE/MADRE">PADRE / MADRE</option>
              <option value="HERMANO(A)">HERMANO(A)</option>
              <option value="OTRO">OTRO FAMILIAR</option>
            </select>
          </div>
        {/if}

        <div class="form-group">
          <label for="ed_pac_fecha_nac">Fecha de Nacimiento *</label>
          <input type="date" id="ed_pac_fecha_nac" bind:value={formEditarPaciente.fecha_nacimiento_paciente} required disabled={guardando} />
        </div>

        <div class="form-group">
          <label for="ed_pac_sexo">Sexo *</label>
          <select id="ed_pac_sexo" bind:value={formEditarPaciente.sexo_paciente} disabled={guardando} required>
            <option value="M">Masculino (M)</option>
            <option value="F">Femenino (F)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ed_pac_tipo_personal">Tipo de Personal *</label>
          <select id="ed_pac_tipo_personal" bind:value={formEditarPaciente.tipo_personal_paciente} disabled={guardando} required>
            <option value="DOCENTE">DOCENTE</option>
            <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
            <option value="OBRERO">OBRERO</option>
            <option value="ESTUDIANTE">ESTUDIANTE</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ed_pac_categoria">Categoría del Trabajador *</label>
          <select id="ed_pac_categoria" bind:value={formEditarPaciente.categoria_trabajador_paciente} disabled={guardando} required>
            <option value="ACTIVO">ACTIVO</option>
            <option value="JUBILADO">JUBILADO</option>
            <option value="PENSIONADO">PENSIONADO</option>
            <option value="CONTRATADO">CONTRATADO</option>
          </select>
        </div>

        <div class="modal-footer full-width">
          <button type="button" class="btn-cancelar" on:click={() => pacienteAEditar = null} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" class="btn-guardar-modal" disabled={guardando}>
            <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'save'}</span>
            <span>{guardando ? 'Actualizando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: CONFIRMAR BAJA PACIENTE -->
{#if pacienteAEliminar}
  <div class="modal-overlay" on:click|self={() => pacienteAEliminar = null}>
    <div class="modal-card modal-peligro">
      <div class="modal-header">
        <div class="modal-titulo titulo-peligro">
          <span class="material-symbols-outlined">warning</span>
          <h3>Dar de Baja a Paciente</h3>
        </div>
        <button type="button" class="btn-cerrar-modal" on:click={() => pacienteAEliminar = null}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal-body">
        <p class="pregunta-eliminar">
          ¿Desea dar de baja (ocultar) al paciente <strong>{pacienteAEliminar.nombre_completo_paciente}</strong> (C.I. {pacienteAEliminar.ci_titular_paciente || pacienteAEliminar.ci_beneficiario_paciente || 'S/C'})?
        </p>
        <div class="caja-aviso-segura">
          <span class="material-symbols-outlined">lock</span>
          <div>
            <strong>Protección de Historial Médico:</strong>
            <p>Se efectúa una baja lógica. Las consultas médicas previas y reposos otorgados permanecen registrados en la base de datos para auditorías legales.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancelar" on:click={() => pacienteAEliminar = null} disabled={guardando}>
          Cancelar
        </button>
        <button type="button" class="btn-confirmar-eliminar" on:click={ejecutarBajaPaciente} disabled={guardando}>
          <span class="material-symbols-outlined">{guardando ? 'hourglass_top' : 'delete'}</span>
          <span>{guardando ? 'Procesando...' : 'Confirmar Ocultamiento'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<Footer />

<style>
  .form-container {
    background-color: #ffffff;
    padding: 30px 34px;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    max-width: 1080px;
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

  .tab-btn-auditoria {
    background: #f0fdf4;
    border-color: #86efac;
    color: #166534;
  }

  .tab-btn-auditoria.active {
    background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
    color: #ffffff;
    border-color: #22c55e;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
  }

  .bloque-formulario {
    background: #ffffff;
    padding: 4px 0 16px 0;
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
    max-width: 650px;
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
    font-size: 0.85rem;
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
    left: 12px;
    font-size: 20px;
    color: #94a3b8;
    pointer-events: none;
  }

  .input-con-icono input,
  .input-con-icono select {
    width: 100%;
    padding: 10px 14px 10px 42px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    background-color: #f8fafc;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .input-con-icono input:focus,
  .input-con-icono select:focus {
    outline: none;
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }

  /* ESPECIALIDADES MULTI-SELECCIÓN */
  .seccion-especialidades-doc {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
  }

  .header-subcampo-esp {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .contador-esp-seleccionadas {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0055b3;
    background: #e0f2fe;
    padding: 2px 10px;
    border-radius: 12px;
  }

  .ayuda-subcampo {
    font-size: 0.82rem;
    color: #64748b;
    margin-bottom: 12px;
  }

  .grid-checkboxes-esp {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px 2px;
  }

  .chip-checkbox-esp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }

  .chip-checkbox-esp input {
    display: none;
  }

  .chip-checkbox-esp .icono-chip {
    font-size: 18px;
    color: #94a3b8;
  }

  .chip-checkbox-esp:hover {
    border-color: #007aff;
    background: #f0f7ff;
  }

  .chip-checkbox-esp.chip-seleccionado {
    background: #eff6ff;
    border-color: #007aff;
    color: #0055b3;
  }

  .chip-checkbox-esp.chip-seleccionado .icono-chip {
    color: #007aff;
  }

  .aviso-sin-esp {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-radius: 8px;
    color: #b45309;
    font-size: 0.85rem;
  }

  /* CONDICIÓN SWITCH PACIENTE */
  .condicion-card {
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
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
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
  }

  /* BOTONES FORMULARIO */
  .btn-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .btn-container-dual {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
  }

  .btn-submit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 12px 26px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.25);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(0, 122, 255, 0.35);
  }

  .btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-secundario {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-secundario:hover:not(:disabled) {
    background-color: #e2e8f0;
    color: #1e293b;
  }

  /* CONTENEDOR BAJO DEMANDA */
  .seccion-ondemand-contenedor {
    margin-top: 32px;
    border-top: 1.5px dashed #cbd5e1;
    padding-top: 24px;
  }

  .barra-ondemand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    gap: 16px;
  }

  .info-ondemand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .icono-ondemand {
    font-size: 32px;
    color: #007aff;
    background: #e0f2fe;
    padding: 8px;
    border-radius: 10px;
  }

  .titulo-ondemand {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    font-family: 'Montserrat', sans-serif;
  }

  .sub-ondemand {
    font-size: 0.82rem;
    color: #64748b;
    margin-top: 2px;
  }

  .acciones-ondemand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-ondemand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    background: #ffffff;
    color: #0055b3;
    border: 1.5px solid #007aff;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-ondemand:hover:not(:disabled) {
    background: #f0f7ff;
  }

  .btn-ondemand.activo {
    background: #0055b3;
    color: #ffffff;
  }

  .btn-recargar-ondemand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-recargar-ondemand:hover:not(:disabled) {
    background: #f1f5f9;
    color: #007aff;
    border-color: #94a3b8;
  }

  .bloque-tabla-ondemand {
    margin-top: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
  }

  .listado-buscador-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .listado-buscador {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 14px;
    width: 100%;
    max-width: 480px;
  }

  .listado-buscador .material-symbols-outlined {
    font-size: 20px;
    color: #94a3b8;
  }

  .listado-buscador input {
    border: none;
    background: transparent;
    width: 100%;
    font-size: 0.88rem;
    color: #1e293b;
    outline: none;
    font-family: inherit;
  }

  .btn-buscar-mini {
    padding: 8px 14px;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .badge-total-items {
    font-size: 0.82rem;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 5px 12px;
    border-radius: 20px;
  }

  /* TABLAS DE EXISTENCIA */
  .tabla-existencia-responsive {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
    text-align: left;
  }

  th {
    background-color: #f8fafc;
    color: #475569;
    font-weight: 700;
    padding: 12px 14px;
    border-bottom: 1.5px solid #e2e8f0;
    white-space: nowrap;
  }

  td {
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: middle;
  }

  tr:hover td {
    background-color: #f8fafc;
  }

  .texto-bold {
    font-weight: 700;
    color: #1e293b;
  }

  .texto-bold-primario {
    font-weight: 700;
    color: #0055b3;
  }

  .texto-centro {
    text-align: center;
    font-weight: 600;
  }

  .badge-profesional {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #334155;
    font-family: monospace;
    font-size: 0.8rem;
    border: 1px solid #e2e8f0;
  }

  .badge-esp-tabla {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 600;
    font-size: 0.82rem;
  }

  .badge-activo {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 12px;
    background: #dcfce7;
    color: #15803d;
    font-weight: 700;
    font-size: 0.76rem;
  }

  .badge-parentesco {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.78rem;
  }

  .badge-parentesco.titular {
    background: #eff6ff;
    color: #1e40af;
  }

  .badge-parentesco.beneficiario {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-categoria {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #475569;
    font-weight: 600;
    font-size: 0.78rem;
  }

  .badge-rol {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.76rem;
    text-transform: uppercase;
  }

  .badge-rol.administrador {
    background: #fee2e2;
    color: #b91c1c;
  }

  .badge-rol.medico {
    background: #e0e7ff;
    color: #4338ca;
  }

  .badge-rol.recepcionista {
    background: #fef3c7;
    color: #b45309;
  }

  .usuario-fila-nombre {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .usuario-fila-nombre .material-symbols-outlined {
    font-size: 20px;
    color: #007aff;
  }

  /* BOTONES DE ACCIÓN (EDITAR / ELIMINAR) */
  .th-acciones {
    text-align: center;
    min-width: 140px;
  }

  .td-acciones {
    text-align: center;
  }

  .botones-accion-fila {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn-accion-editar {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-accion-editar:hover {
    background: #dbeafe;
    border-color: #93c5fd;
  }

  .btn-accion-editar .material-symbols-outlined {
    font-size: 16px;
  }

  .btn-accion-eliminar {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-accion-eliminar:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }

  .btn-accion-eliminar .material-symbols-outlined {
    font-size: 16px;
  }

  /* ESTILOS AUDITORÍA */
  .barra-auditoria-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .acciones-auditoria-top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn-pdf-auditoria {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.86rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-pdf-auditoria:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
  }

  .btn-pdf-auditoria:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-recargar-auditoria {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #334155;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-recargar-auditoria:hover:not(:disabled) {
    background: #f8fafc;
    color: #007aff;
    border-color: #94a3b8;
  }

  .filtros-auditoria-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .full-width-buscador {
    max-width: 100%;
  }

  .select-filtro-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .select-filtro-item label {
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
  }

  .select-filtro-item select {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #f8fafc;
    font-size: 0.85rem;
    font-family: inherit;
    color: #1e293b;
  }

  .info-auditoria-resumen {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 12px;
  }

  .badge-aviso-seguridad {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .badge-aviso-seguridad .material-symbols-outlined {
    font-size: 16px;
  }

  .col-fecha-auditoria {
    white-space: nowrap;
    font-family: monospace;
    font-size: 0.82rem;
    color: #475569;
  }

  .fecha-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .fecha-item .material-symbols-outlined {
    font-size: 16px;
    color: #94a3b8;
  }

  .badge-accion-auditoria {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.76rem;
    letter-spacing: 0.02em;
  }

  .badge-accion-auditoria .material-symbols-outlined {
    font-size: 14px;
  }

  .badge-accion-auditoria.agregó {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .badge-accion-auditoria.editó {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .badge-accion-auditoria.eliminó {
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge-entidad-auditoria {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    font-size: 0.75rem;
    border: 1px solid #e2e8f0;
  }

  .detalle-auditoria-texto {
    font-size: 0.85rem;
    color: #1e293b;
    line-height: 1.4;
  }

  /* MODALES FLOTANTES */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 14px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #cbd5e1;
    display: flex;
    flex-direction: column;
  }

  .modal-card.modal-grande {
    max-width: 760px;
  }

  .modal-card.modal-peligro {
    max-width: 500px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 22px;
    border-bottom: 1.5px solid #f1f5f9;
  }

  .modal-titulo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .modal-titulo .material-symbols-outlined {
    font-size: 24px;
    color: #007aff;
  }

  .modal-titulo h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    font-family: 'Montserrat', sans-serif;
  }

  .modal-titulo.titulo-peligro .material-symbols-outlined {
    color: #dc2626;
  }

  .btn-cerrar-modal {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
  }

  .btn-cerrar-modal:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .modal-body {
    padding: 20px 22px;
  }

  .modal-body input,
  .modal-body select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    font-family: inherit;
    background: #f8fafc;
  }

  .modal-body input:focus,
  .modal-body select:focus {
    outline: none;
    border-color: #007aff;
    background: #ffffff;
  }

  .pregunta-eliminar {
    font-size: 0.95rem;
    color: #1e293b;
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .caja-aviso-segura {
    display: flex;
    gap: 12px;
    padding: 14px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    color: #166534;
    font-size: 0.85rem;
  }

  .caja-aviso-segura .material-symbols-outlined {
    font-size: 22px;
    color: #16a34a;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .caja-aviso-segura strong {
    display: block;
    margin-bottom: 4px;
  }

  .caja-aviso-segura p {
    margin: 0;
    line-height: 1.4;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 22px;
    border-top: 1.5px solid #f1f5f9;
    background: #f8fafc;
    border-bottom-left-radius: 14px;
    border-bottom-right-radius: 14px;
  }

  .btn-cancelar {
    padding: 10px 18px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .btn-cancelar:hover {
    background: #f1f5f9;
  }

  .btn-guardar-modal {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    background: #007aff;
    color: #ffffff;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .btn-guardar-modal:hover:not(:disabled) {
    background: #0055b3;
  }

  .btn-confirmar-eliminar {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    background: #dc2626;
    color: #ffffff;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .btn-confirmar-eliminar:hover:not(:disabled) {
    background: #b91c1c;
  }

  /* ALERTAS Y ESTADOS */
  .cargando-fila, .vacio-fila {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 26px 20px;
    gap: 10px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px dashed #cbd5e1;
    color: #64748b;
    font-size: 0.88rem;
  }

  .vacio-fila .material-symbols-outlined {
    font-size: 32px;
    color: #94a3b8;
  }

  .spinner-icon {
    font-size: 24px;
    color: #007aff;
    animation: rotar 1s linear infinite;
  }

  @keyframes rotar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .alerta-exito {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .alerta-error {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .form-group.full-width {
      grid-column: span 1;
    }
    .filtros-auditoria-grid {
      grid-template-columns: 1fr;
    }
    .barra-ondemand-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .acciones-ondemand {
      width: 100%;
      justify-content: flex-start;
    }
    .listado-buscador {
      max-width: 100%;
      width: 100%;
    }
  }
</style>
