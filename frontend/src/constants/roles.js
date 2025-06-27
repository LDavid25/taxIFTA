export const ROLES = {
  ADMIN: 'admin',
  CLIENTE: 'cliente'
};

export const isAdmin = (user) => {
  return user?.role?.toLowerCase() === ROLES.ADMIN;
};

export const isCliente = (user) => {
  return user?.role?.toLowerCase() === ROLES.CLIENTE;
};
