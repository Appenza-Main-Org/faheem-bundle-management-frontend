import React, { createContext, useContext, useState } from 'react';

const SubjectContext = createContext();

export const useSubject = () => {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error('useSubject must be used within SubjectProvider');
  }
  return context;
};

export const SubjectProvider = ({ children }) => {
  const [selectedSubject, setSelectedSubject] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('selectedSubject');
    return saved ? JSON.parse(saved) : null;
  });

  const selectSubject = (subjectData) => {
    setSelectedSubject(subjectData);
    localStorage.setItem('selectedSubject', JSON.stringify(subjectData));
  };

  const clearSubject = () => {
    setSelectedSubject(null);
    localStorage.removeItem('selectedSubject');
  };

  const value = {
    selectedSubject,
    selectSubject,
    clearSubject,
    isSubjectSelected: !!selectedSubject,
  };

  return (
    <SubjectContext.Provider value={value}>
      {children}
    </SubjectContext.Provider>
  );
};

export default SubjectContext;
