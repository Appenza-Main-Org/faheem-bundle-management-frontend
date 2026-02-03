import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2, Filter, Check } from 'lucide-react';
import { filtersApi } from '../services/api';
import { useSubject } from '../context/SubjectContext';
import { useToast } from '../context/ToastContext';

function FilterDrawer({ isOpen, onClose }) {
  const { selectedSubject, selectSubject } = useSubject();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter selections - Initialize from context if available
  const [selectedCountry, setSelectedCountry] = useState(selectedSubject?.country || null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(selectedSubject?.curriculum || null);
  const [selectedStage, setSelectedStage] = useState(selectedSubject?.stage || null);
  const [selectedGrade, setSelectedGrade] = useState(selectedSubject?.grade || null);

  // Available options
  const [countries, setCountries] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);

  // Load countries on mount
  useEffect(() => {
    if (isOpen) {
      loadCountries();
    }
  }, [isOpen]);

  // Sync with context when it changes
  useEffect(() => {
    if (selectedSubject) {
      setSelectedCountry(selectedSubject.country || null);
      setSelectedCurriculum(selectedSubject.curriculum || null);
      setSelectedStage(selectedSubject.stage || null);
      setSelectedGrade(selectedSubject.grade || null);
    }
  }, [selectedSubject]);

  // Load dependent data
  useEffect(() => {
    if (selectedCountry) {
      loadCurriculums(selectedCountry.id);
    } else {
      setCurriculums([]);
      setStages([]);
      setGrades([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCurriculum) {
      loadStages(selectedCurriculum.id);
    } else {
      setStages([]);
      setGrades([]);
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    if (selectedStage) {
      loadGrades(selectedStage.id);
    } else {
      setGrades([]);
    }
  }, [selectedStage]);

  // API calls
  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await filtersApi.getCountries();
      setCountries(response.data.data || []);
    } catch (err) {
      showError('Failed to load countries');
      console.error('Error loading countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculums = async (countryId) => {
    try {
      const response = await filtersApi.getCurriculums(countryId);
      setCurriculums(response.data.data || []);
    } catch (err) {
      showError('Failed to load curriculums');
      console.error('Error loading curriculums:', err);
    }
  };

  const loadStages = async (curriculumId) => {
    try {
      const response = await filtersApi.getStages(curriculumId);
      setStages(response.data.data || []);
    } catch (err) {
      showError('Failed to load stages');
      console.error('Error loading stages:', err);
    }
  };

  const loadGrades = async (stageId) => {
    try {
      const response = await filtersApi.getGrades(stageId);
      setGrades(response.data.data || []);
    } catch (err) {
      showError('Failed to load grades');
      console.error('Error loading grades:', err);
    }
  };

  // Handlers
  const handleCountryChange = (countryId) => {
    const country = countries.find(c => c.id === parseInt(countryId));
    setSelectedCountry(country);
    setSelectedCurriculum(null);
    setSelectedStage(null);
    setSelectedGrade(null);
  };

  const handleCurriculumChange = (curriculumId) => {
    const curriculum = curriculums.find(c => c.id === parseInt(curriculumId));
    setSelectedCurriculum(curriculum);
    setSelectedStage(null);
    setSelectedGrade(null);
  };

  const handleStageChange = (stageId) => {
    const stage = stages.find(s => s.id === parseInt(stageId));
    setSelectedStage(stage);
    setSelectedGrade(null);
  };

  const handleGradeChange = (gradeId) => {
    const grade = grades.find(g => g.id === parseInt(gradeId));
    setSelectedGrade(grade);
  };

  const handleApplyFilters = () => {
    if (!selectedGrade) {
      showWarning('Please select a grade before applying filters');
      return;
    }

    // Store complete selection data (up to grade level)
    selectSubject({
      country: selectedCountry,
      curriculum: selectedCurriculum,
      stage: selectedStage,
      grade: selectedGrade,
    });

    showSuccess('Filters applied successfully!');
    onClose();
  };

  if (!isOpen) return null;

  const selectStyles = {
    width: '100%',
    padding: '0.75rem',
    paddingRight: '2.5rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.9375rem',
    outline: 'none',
    cursor: 'pointer',
    background: 'white',
    color: '#374151',
    transition: 'all 0.2s',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
  };

  const canApply = selectedGrade !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isMobile ? '100%' : '420px',
          maxWidth: isMobile ? '100%' : '90vw',
          background: 'white',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInFromLeft 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
              Filter Options
            </h2>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close filter drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Country */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Country
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedCountry?.id || ''}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  disabled={loading}
                  style={{
                    ...selectStyles,
                    opacity: loading ? 0.5 : 1,
                    borderColor: selectedCountry ? '#667eea' : '#e5e7eb'
                  }}
                >
                  <option value="">Choose a country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} style={{
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
                fontWeight: '600',
                color: selectedCountry ? '#374151' : '#9ca3af',
                marginBottom: '0.5rem'
              }}>
                Curriculum
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedCurriculum?.id || ''}
                  onChange={(e) => handleCurriculumChange(e.target.value)}
                  disabled={!selectedCountry || curriculums.length === 0}
                  style={{
                    ...selectStyles,
                    opacity: !selectedCountry ? 0.5 : 1,
                    borderColor: selectedCurriculum ? '#667eea' : '#e5e7eb',
                    cursor: !selectedCountry ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {!selectedCountry ? 'Select country first' : 'Choose a curriculum'}
                  </option>
                  {curriculums.map((curriculum) => (
                    <option key={curriculum.id} value={curriculum.id}>
                      {curriculum.type}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} style={{
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
                fontWeight: '600',
                color: selectedCurriculum ? '#374151' : '#9ca3af',
                marginBottom: '0.5rem'
              }}>
                Stage
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedStage?.id || ''}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={!selectedCurriculum || stages.length === 0}
                  style={{
                    ...selectStyles,
                    opacity: !selectedCurriculum ? 0.5 : 1,
                    borderColor: selectedStage ? '#667eea' : '#e5e7eb',
                    cursor: !selectedCurriculum ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {!selectedCurriculum ? 'Select curriculum first' : 'Choose a stage'}
                  </option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} style={{
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
                fontWeight: '600',
                color: selectedStage ? '#374151' : '#9ca3af',
                marginBottom: '0.5rem'
              }}>
                Grade
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedGrade?.id || ''}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  disabled={!selectedStage || grades.length === 0}
                  style={{
                    ...selectStyles,
                    opacity: !selectedStage ? 0.5 : 1,
                    borderColor: selectedGrade ? '#667eea' : '#e5e7eb',
                    cursor: !selectedStage ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {!selectedStage ? 'Select stage first' : 'Choose a grade'}
                  </option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#9ca3af'
                }} />
              </div>
            </div>

            {/* Current Selection Summary */}
            {selectedGrade && (
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
                  Current Selection:
                </div>
                <div style={{ color: '#075985', lineHeight: '1.6' }}>
                  <div>📍 {selectedCountry?.name}</div>
                  <div>📚 {selectedCurriculum?.type}</div>
                  <div>🎓 {selectedStage?.name}</div>
                  <div style={{ fontWeight: '600', color: '#0c4a6e' }}>
                    📖 {selectedGrade?.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '2px solid #e5e7eb',
          background: '#f9fafb',
        }}>
          <button
            onClick={handleApplyFilters}
            disabled={!canApply || loading}
            className="drawer-apply-btn"
            style={{
              background: canApply ? undefined : '#e5e7eb',
              color: canApply ? undefined : '#9ca3af',
              cursor: canApply ? undefined : 'not-allowed',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Loading...
              </>
            ) : (
              <>
                <Check size={18} />
                Apply Filters
              </>
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideInFromLeft {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}
      </style>
    </>
  );
}

export default FilterDrawer;
