import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getCompanies } from '../services/companyService';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Error al cargar las compañías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCompanies();
    }
  }, [currentUser]);

  return (
    <CompanyContext.Provider value={{ companies, loading, error, refreshCompanies: fetchCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanies = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanies must be used within a CompanyProvider');
  }
  return context;
};

export default CompanyContext;
