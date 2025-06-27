import api from './api';

const IftaReportStatesService = {
  async getStatesByReportId(reportId) {
    try {
      console.log(`[IftaReportStatesService] Fetching states for report ID: ${reportId}`);
      const response = await api.get(`/v1/ifta-report-states/${reportId}`);
      console.log('[IftaReportStatesService] Response:', response.data);
      return response.data.states || [];
    } catch (error) {
      console.error('[IftaReportStatesService] Error fetching report states:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },
};

export default IftaReportStatesService;
