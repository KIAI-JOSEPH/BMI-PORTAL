// Campus Selector Component
import React, { useEffect, useState } from 'react';
import { getAllCampuses, Campus } from '../services/campusService';

interface CampusSelectorProps {
  value: string;
  onChange: (campusId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showAllOption?: boolean;
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({
  value,
  onChange,
  label = 'Campus',
  placeholder = 'Select campus',
  required = false,
  disabled = false,
  className = '',
  showAllOption = false,
}) => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampuses();
  }, []);

  const loadCampuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCampuses();
      setCampuses(data);
    } catch (err: any) {
      console.error('Failed to load campuses:', err);
      setError('Failed to load campuses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">
          {loading ? 'Loading campuses...' : placeholder}
        </option>
        
        {showAllOption && (
          <option value="all">All Campuses</option>
        )}
        
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name} ({campus.code})
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default CampusSelector;
