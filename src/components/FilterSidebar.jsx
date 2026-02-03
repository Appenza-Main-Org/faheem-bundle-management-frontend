import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import { filtersApi } from '../services/api';

/**
 * FilterSidebar Component
 * Hierarchical filtering: Country → Curriculum → Stage → Grade → Subject
 */
const FilterSidebar = ({ onFilterChange, initialFilters = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter selections
  const [selectedCountry, setSelectedCountry] = useState(initialFilters.countryId || null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(initialFilters.curriculumId || null);
  const [selectedStage, setSelectedStage] = useState(initialFilters.stageId || null);
  const [selectedGrade, setSelectedGrade] = useState(initialFilters.gradeId || null);
  const [selectedSubject, setSelectedSubject] = useState(initialFilters.subjectId || null);

  // Available options for each level
  const [countries, setCountries] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load dependent data when selections change
  useEffect(() => {
    if (selectedCountry) {
      loadCurriculums(selectedCountry);
    } else {
      setCurriculums([]);
      setStages([]);
      setGrades([]);
      setSubjects([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCurriculum) {
      loadStages(selectedCurriculum);
    } else {
      setStages([]);
      setGrades([]);
      setSubjects([]);
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    if (selectedStage) {
      loadGrades(selectedStage);
    } else {
      setGrades([]);
      setSubjects([]);
    }
  }, [selectedStage]);

  useEffect(() => {
    if (selectedGrade) {
      loadSubjects(selectedGrade);
    } else {
      setSubjects([]);
    }
  }, [selectedGrade]);

  // Notify parent component of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        countryId: selectedCountry,
        curriculumId: selectedCurriculum,
        stageId: selectedStage,
        gradeId: selectedGrade,
        subjectId: selectedSubject,
      });
    }
  }, [selectedCountry, selectedCurriculum, selectedStage, selectedGrade, selectedSubject]);

  // API calls
  const loadCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await filtersApi.getCountries();
      setCountries(response.data.data || []);
    } catch (err) {
      setError('Failed to load countries');
      console.error('Error loading countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculums = async (countryId) => {
    try {
      setError(null);
      const response = await filtersApi.getCurriculums(countryId);
      setCurriculums(response.data.data || []);
    } catch (err) {
      setError('Failed to load curriculums');
      console.error('Error loading curriculums:', err);
    }
  };

  const loadStages = async (curriculumId) => {
    try {
      setError(null);
      const response = await filtersApi.getStages(curriculumId);
      setStages(response.data.data || []);
    } catch (err) {
      setError('Failed to load stages');
      console.error('Error loading stages:', err);
    }
  };

  const loadGrades = async (stageId) => {
    try {
      setError(null);
      const response = await filtersApi.getGrades(stageId);
      setGrades(response.data.data || []);
    } catch (err) {
      setError('Failed to load grades');
      console.error('Error loading grades:', err);
    }
  };

  const loadSubjects = async (gradeId) => {
    try {
      setError(null);
      const response = await filtersApi.getSubjects(gradeId);
      setSubjects(response.data.data || []);
    } catch (err) {
      setError('Failed to load subjects');
      console.error('Error loading subjects:', err);
    }
  };

  // Handlers
  const handleCountryChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedCountry(value);
    setSelectedCurriculum(null);
    setSelectedStage(null);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleCurriculumChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedCurriculum(value);
    setSelectedStage(null);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleStageChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedStage(value);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleGradeChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedGrade(value);
    setSelectedSubject(null);
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedSubject(value);
  };

  const handleClearFilters = () => {
    setSelectedCountry(null);
    setSelectedCurriculum(null);
    setSelectedStage(null);
    setSelectedGrade(null);
    setSelectedSubject(null);
    setCurriculums([]);
    setStages([]);
    setGrades([]);
    setSubjects([]);
  };

  const selectStyles = {
    width: '100%',
    padding: '0.625rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
    background: 'white',
    color: '#374151',
  };

  const hasActiveFilters = selectedCountry || selectedCurriculum || selectedStage || selectedGrade || selectedSubject;

  return (
    <div style={{
      width: '280px',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Sidebar Brand */}
      <div style={{
        padding: '1.5rem 1rem',
        borderBottom: '2px solid #e5e7eb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          marginBottom: '0.25rem'
        }}>
          Faheem Platform
        </div>
        <div style={{
          fontSize: '0.75rem',
          opacity: 0.9
        }}>
          Bundle Management
        </div>
      </div>

      {/* Filter Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f9fafb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="clear-filter-btn"
            aria-label="Clear all filters"
          >
            <X size={14} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#991b1b',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Country */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Country
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCountry || ''}
              onChange={handleCountryChange}
              disabled={loading}
              style={{
                ...selectStyles,
                opacity: loading ? 0.5 : 1
              }}
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#9ca3af'
            }} />
          </div>
        </div>

        {/* Curriculum */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: selectedCountry ? '#374151' : '#9ca3af',
            marginBottom: '0.5rem'
          }}>
            Curriculum
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCurriculum || ''}
              onChange={handleCurriculumChange}
              disabled={!selectedCountry || curriculums.length === 0}
              style={{
                ...selectStyles,
                opacity: !selectedCountry ? 0.5 : 1,
                cursor: !selectedCountry ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">
                {!selectedCountry ? 'Select country first' : 'Select Curriculum'}
              </option>
              {curriculums.map((curriculum) => (
                <option key={curriculum.id} value={curriculum.id}>
                  {curriculum.type}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#9ca3af'
            }} />
          </div>
        </div>

        {/* Stage */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: selectedCurriculum ? '#374151' : '#9ca3af',
            marginBottom: '0.5rem'
          }}>
            Stage
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedStage || ''}
              onChange={handleStageChange}
              disabled={!selectedCurriculum || stages.length === 0}
              style={{
                ...selectStyles,
                opacity: !selectedCurriculum ? 0.5 : 1,
                cursor: !selectedCurriculum ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">
                {!selectedCurriculum ? 'Select curriculum first' : 'Select Stage'}
              </option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#9ca3af'
            }} />
          </div>
        </div>

        {/* Grade */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: selectedStage ? '#374151' : '#9ca3af',
            marginBottom: '0.5rem'
          }}>
            Grade
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedGrade || ''}
              onChange={handleGradeChange}
              disabled={!selectedStage || grades.length === 0}
              style={{
                ...selectStyles,
                opacity: !selectedStage ? 0.5 : 1,
                cursor: !selectedStage ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">
                {!selectedStage ? 'Select stage first' : 'Select Grade'}
              </option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#9ca3af'
            }} />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: selectedGrade ? '#374151' : '#9ca3af',
            marginBottom: '0.5rem'
          }}>
            Subject
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSubject || ''}
              onChange={handleSubjectChange}
              disabled={!selectedGrade || subjects.length === 0}
              style={{
                ...selectStyles,
                opacity: !selectedGrade ? 0.5 : 1,
                cursor: !selectedGrade ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">
                {!selectedGrade ? 'Select grade first' : 'Select Subject'}
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#9ca3af'
            }} />
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Loading...
          </div>
        )}

        {/* Selected Filters Summary */}
        {hasActiveFilters && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '0.375rem',
            fontSize: '0.75rem'
          }}>
            <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
              Active Filters:
            </div>
            <div style={{ color: '#075985', lineHeight: '1.5' }}>
              {selectedCountry && <div>✓ Country selected</div>}
              {selectedCurriculum && <div>✓ Curriculum selected</div>}
              {selectedStage && <div>✓ Stage selected</div>}
              {selectedGrade && <div>✓ Grade selected</div>}
              {selectedSubject && <div>✓ Subject selected</div>}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Custom scrollbar for sidebar */
          div[style*="position: fixed"] {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }

          div[style*="position: fixed"]::-webkit-scrollbar {
            width: 8px;
          }

          div[style*="position: fixed"]::-webkit-scrollbar-track {
            background: #f1f5f9;
          }

          div[style*="position: fixed"]::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          div[style*="position: fixed"]::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </div>
  );
};

export default FilterSidebar;
