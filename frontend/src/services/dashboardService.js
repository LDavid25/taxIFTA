import api from './api';

class DashboardService {
  // Obtener estadísticas del dashboard
  getDashboardStats() {
    return api.get('/v1/dashboard/stats');
  }
}

export default new DashboardService();
