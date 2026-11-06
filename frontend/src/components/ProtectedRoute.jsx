import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ allowedRoles = [], loginPath = '/login' }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p>Cargando sesión...</p>
  }

  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location }}
      />
    )
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    // Usuario autenticado con otro rol: lo enviamos a su propio panel.
    return <Navigate to={user.role === 'USUARIO' ? '/mi-cuenta' : '/admin'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute