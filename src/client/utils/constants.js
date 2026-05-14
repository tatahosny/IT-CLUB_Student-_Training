// Role badge color mapping
export const ROLE_COLORS = {
  super_admin: 'badge-red',
  instructor: 'badge-purple',
  mentor_manager: 'badge-cyan',
  mentor: 'badge-amber',
  student: 'badge-green',
  oc: 'badge-gray',
  hr: 'badge-gray',
}

// Security log action color mapping
export const ACTION_COLORS = {
  login: 'badge-cyan',
  logout: 'badge-gray',
  fraud: 'badge-red',
  block: 'badge-amber',
  unblock: 'badge-green',
  scan: 'badge-purple',
}

// Role-to-home-path mapping
export const ROLE_HOME_PATHS = {
  super_admin: '/admin',
  instructor: '/instructor',
  mentor: '/mentor',
  mentor_manager: '/mentor',
  oc: '/hr',
  hr: '/hr',
  student: '/student',
}
