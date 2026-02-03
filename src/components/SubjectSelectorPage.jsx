import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { filtersApi } from '../services/api';
import { useSubject } from '../context/SubjectContext';

function SubjectSelectorPage() {
  const { selectSubject } = useSubject();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter selections
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Available options
  const [countries, setCountries] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load dependent data
  useEffect(() => {
    if (selectedCountry) {
      loadCurriculums(selectedCountry.id);
    } else {
      setCurriculums([]);
      setStages([]);
      setGrades([]);
      setSubjects([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCurriculum) {
      loadStages(selectedCurriculum.id);
    } else {
      setStages([]);
      setGrades([]);
      setSubjects([]);
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    if (selectedStage) {
      loadGrades(selectedStage.id);
    } else {
      setGrades([]);
      setSubjects([]);
    }
  }, [selectedStage]);

  useEffect(() => {
    if (selectedGrade) {
      loadSubjects(selectedGrade.id);
    } else {
      setSubjects([]);
    }
  }, [selectedGrade]);

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
  const handleCountryChange = (countryId) => {
    const country = countries.find(c => c.id === parseInt(countryId));
    setSelectedCountry(country);
    setSelectedCurriculum(null);
    setSelectedStage(null);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleCurriculumChange = (curriculumId) => {
    const curriculum = curriculums.find(c => c.id === parseInt(curriculumId));
    setSelectedCurriculum(curriculum);
    setSelectedStage(null);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleStageChange = (stageId) => {
    const stage = stages.find(s => s.id === parseInt(stageId));
    setSelectedStage(stage);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleGradeChange = (gradeId) => {
    const grade = grades.find(g => g.id === parseInt(gradeId));
    setSelectedGrade(grade);
    setSelectedSubject(null);
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find(s => s.id === parseInt(subjectId));
    setSelectedSubject(subject);
  };

  const handleStart = () => {
    if (!selectedSubject) {
      setError('Please select a subject before continuing');
      return;
    }

    // Store complete selection data
    selectSubject({
      country: selectedCountry,
      curriculum: selectedCurriculum,
      stage: selectedStage,
      grade: selectedGrade,
      subject: selectedSubject,
    });

    // Navigate to admin panel
    navigate('/admin');
  };

  const selectStyles = {
    width: '100%',
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    outline: 'none',
    cursor: 'pointer',
    background: 'white',
    color: '#374151',
    transition: 'all 0.2s',
  };

  const canProceed = selectedSubject !== null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <BookOpen size={48} style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Faheem Platform
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.95 }}>
            Bundle Management System
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>
            Select a subject to manage subscriptions
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

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
                1. Select Country
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
                <ChevronDown size={20} style={{
                  position: 'absolute',
                  right: '1rem',
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
                2. Select Curriculum
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
                <ChevronDown size={20} style={{
                  position: 'absolute',
                  right: '1rem',
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
                3. Select Stage
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
                <ChevronDown size={20} style={{
                  position: 'absolute',
                  right: '1rem',
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
                4. Select Grade
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
                <ChevronDown size={20} style={{
                  position: 'absolute',
                  right: '1rem',
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
                fontWeight: '600',
                color: selectedGrade ? '#374151' : '#9ca3af',
                marginBottom: '0.5rem'
              }}>
                5. Select Subject
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedSubject?.id || ''}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={!selectedGrade || subjects.length === 0}
                  style={{
                    ...selectStyles,
                    opacity: !selectedGrade ? 0.5 : 1,
                    borderColor: selectedSubject ? '#667eea' : '#e5e7eb',
                    cursor: !selectedGrade ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {!selectedGrade ? 'Select grade first' : 'Choose a subject'}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#9ca3af'
                }} />
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!canProceed || loading}
              className="drawer-apply-btn"
              style={{
                marginTop: '1rem',
                fontSize: '1.125rem',
                background: canProceed ? undefined : '#e5e7eb',
                color: canProceed ? undefined : '#9ca3af',
                cursor: canProceed ? undefined : 'not-allowed',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Loading...
                </>
              ) : (
                <>
                  Start Managing
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          {/* Selection Summary */}
          {selectedSubject && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
                Selected Configuration:
              </div>
              <div style={{ color: '#075985', lineHeight: '1.6' }}>
                <div>📍 {selectedCountry?.name}</div>
                <div>📚 {selectedCurriculum?.type}</div>
                <div>🎓 {selectedStage?.name}</div>
                <div>📖 {selectedGrade?.name}</div>
                <div style={{ fontWeight: '600', color: '#0c4a6e' }}>
                  ✨ {selectedSubject?.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default SubjectSelectorPage;
