// Este archivo ya no es necesario ya que el envío de correos ahora se maneja desde el backend
// Se mantiene por compatibilidad, pero las funciones están vacías o devuelven promesas resueltas

/**
 * Función de compatibilidad que no hace nada ya que el envío de correos
 * ahora se maneja desde el backend.
 * @deprecated El envío de correos ahora se maneja desde el backend
 */
export const sendPasswordResetEmail = async () => {
  console.warn('El envío de correos ahora se maneja desde el backend');
  return Promise.resolve();
};

const emailService = {
  sendPasswordResetEmail,
};

export default emailService;
