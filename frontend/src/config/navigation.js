/**
 * Menús por rol. Fuente única para la barra lateral, el dashboard
 * y las rutas protegidas. El backend aplica los mismos permisos.
 */
export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  OPERADOR: 'OPERADOR',
  USUARIO: 'USUARIO',
}

const { ADMIN, OPERADOR, USUARIO } = ROLES

export const STAFF_MENU = [
  { to: '/admin', icon: '▦', label: 'Dashboard', roles: [ADMIN, OPERADOR], description: 'Resumen de la operación' },
  { to: '/admin/reservas', icon: '🎟️', label: 'Reservas', roles: [ADMIN, OPERADOR], description: 'Consultar y gestionar reservas' },
  { to: '/admin/salidas', icon: '🚌', label: 'Viajes', roles: [ADMIN, OPERADOR], description: 'Programación y estado de los viajes' },
  { to: '/admin/pasajeros', icon: '👥', label: 'Pasajeros', roles: [ADMIN, OPERADOR], description: 'Fichas de pasajeros' },
  { to: '/admin/control-pasajeros', icon: '✅', label: 'Control pasajeros', roles: [ADMIN, OPERADOR], description: 'Lista de abordaje y pasajeros a bordo' },
  { to: '/admin/metricas', icon: '📈', label: 'Métricas', roles: [ADMIN], description: 'Ocupación, reservas y destinos' },
  { to: '/admin/ventas', icon: '💳', label: 'Ventas', roles: [ADMIN], description: 'Cobros por período y método' },
  { to: '/admin/configuracion', icon: '⚙️', label: 'Configuración', roles: [ADMIN, OPERADOR], description: 'Perfil, seguridad y personal' },
]

/** Catálogo necesario para crear viajes (sólo administrador). */
export const CATALOG_MENU = [
  { to: '/admin/destinos', icon: '🗺️', label: 'Destinos', roles: [ADMIN], description: 'Destinos turísticos' },
  { to: '/admin/actividades', icon: '🏞️', label: 'Actividades', roles: [ADMIN], description: 'Experiencias ofrecidas' },
  { to: '/admin/guias', icon: '🧭', label: 'Guías', roles: [ADMIN], description: 'Guías habilitados' },
  { to: '/admin/vehiculos', icon: '🚐', label: 'Vehículos', roles: [ADMIN], description: 'Flota disponible' },
]

export const PASSENGER_MENU = [
  { to: '/mi-cuenta', icon: '🧳', label: 'Mis viajes', roles: [USUARIO], description: 'Tus reservas y tickets' },
  { to: '/mi-cuenta/cupos', icon: '🪑', label: 'Cupos', roles: [USUARIO], description: 'Viajes con lugares disponibles' },
  { to: '/mi-cuenta/ficha', icon: '🩺', label: 'Ficha de viaje', roles: [USUARIO], description: 'Salud y contacto de emergencia' },
  { to: '/mi-cuenta/configuracion', icon: '⚙️', label: 'Configuración', roles: [USUARIO], description: 'Perfil y contraseña' },
]

export function menuFor(role) {
  if (role === USUARIO) return { main: PASSENGER_MENU, extra: [] }
  return {
    main: STAFF_MENU.filter((item) => item.roles.includes(role)),
    extra: CATALOG_MENU.filter((item) => item.roles.includes(role)),
  }
}

export function roleLabel(role) {
  return { [ADMIN]: 'Administrador', [OPERADOR]: 'Operador', [USUARIO]: 'Pasajero' }[role] || role
}
