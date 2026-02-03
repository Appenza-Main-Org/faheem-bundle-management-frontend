import React, { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Layers, Plus, RefreshCw, AlertCircle, CheckCircle, Loader2,
  BookOpen, GraduationCap, ChevronDown, X, BarChart3, Copy, Check,
  Trash2
} from 'lucide-react';
import { subjectServicesApi, servicesApi, filtersApi } from '../services/api';
import { useSubject } from '../context/SubjectContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './ConfirmDialog';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom Date Floating Filter Component
const DateFloatingFilter = forwardRef((props, ref) => {
  const [filterDate, setFilterDate] = useState('');

  useImperativeHandle(ref, () => ({
    onParentModelChanged(parentModel) {
      setFilterDate(parentModel?.filter || '');
    }
  }));

  const onChange = (e) => {
    const value = e.target.value;
    setFilterDate(value);
    if (value) {
      props.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged('equals', value);
      });
    } else {
      props.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
    }
  };

  const clearFilter = () => {
    setFilterDate('');
    props.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged(null, null);
    });
  };

  return (
    <div className="date-filter-container">
      <input
        type="date"
        value={filterDate}
        onChange={onChange}
        className="date-filter-input"
      />
      {filterDate && (
        <button
          onClick={clearFilter}
          className="date-filter-clear"
          title="Clear filter"
        >
          ×
        </button>
      )}
      <style>{`
        .date-filter-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          padding: 2px 0;
        }
        .date-filter-input {
          width: 100%;
          padding: 4px 24px 4px 6px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 11px;
          color: #334155;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s ease;
          cursor: pointer;
          height: 26px;
          box-sizing: border-box;
        }
        .date-filter-input:hover {
          border-color: #cbd5e1;
          background: #fff;
        }
        .date-filter-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        .date-filter-clear {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: all 0.2s ease;
          padding: 0;
        }
        .date-filter-clear:hover {
          background: #dc2626;
          transform: translateY(-50%) scale(1.1);
        }
      `}</style>
    </div>
  );
});

// Helper function to get local date string
const getLocalDateString = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function SubjectServicesManager() {
  const { selectedSubject } = useSubject();
  const { showSuccess, showError } = useToast();
  const gridRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Selection state
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCancelCreateConfirm, setShowCancelCreateConfirm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdServices, setCreatedServices] = useState([]);

  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [existingServiceIds, setExistingServiceIds] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedSubject?.grade?.id) {
        setAvailableSubjects([]);
        setSelectedSubjectId(null);
        return;
      }

      try {
        setLoadingSubjects(true);
        const response = await filtersApi.getSubjects(selectedSubject.grade.id);
        const subjects = response.data.data || [];
        setAvailableSubjects(subjects);

        if (subjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subjects[0].id);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
        setAvailableSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selectedSubject?.grade?.id]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchServices();
      checkExistingServices();
    } else {
      setServices([]);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  useEffect(() => {
    if (showCreateForm && selectedSubjectId) {
      checkExistingServices();
    }
  }, [showCreateForm]);

  const fetchAvailableServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesApi.getAll();
      setAvailableServices(response.data.data || []);
    } catch (err) {
      console.error('Error fetching available services:', err);
      setError('Failed to load available services');
    } finally {
      setLoadingServices(false);
    }
  };

  const checkExistingServices = async () => {
    if (!selectedSubjectId) return;

    try {
      const response = await subjectServicesApi.getBySubject(selectedSubjectId);
      const existingServices = response.data.data || [];

      const existingIds = existingServices
        .filter(ss => ss.grade_id === selectedSubject?.grade?.id)
        .map(ss => ss.service_id);

      setExistingServiceIds(existingIds);
    } catch (err) {
      console.error('Error checking existing services:', err);
      setExistingServiceIds([]);
    }
  };

  const fetchServices = async () => {
    if (!selectedSubjectId) {
      setError('No subject selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await subjectServicesApi.getBySubject(selectedSubjectId);
      setServices(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subject services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    const currentSubject = availableSubjects.find(s => s.id === selectedSubjectId);
    if (existingServiceIds.includes(serviceId)) {
      setError(`This service already exists for ${currentSubject?.name || 'this subject'} in Grade ${selectedSubject?.grade?.name}`);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(null), 3000);
      return;
    }

    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSelectAll = () => {
    const newServices = availableServices
      .filter(service => !existingServiceIds.includes(service.id))
      .map(service => service.id);
    setSelectedServices(newServices);
  };

  const handleDeselectAll = () => {
    setSelectedServices([]);
  };

  // Cancel handlers
  const handleCancelCreate = () => {
    if (selectedServices.length > 0) {
      setShowCancelCreateConfirm(true);
    } else {
      setShowCreateForm(false);
      setSelectedServices([]);
    }
  };

  const handleConfirmCancelCreate = () => {
    setShowCreateForm(false);
    setSelectedServices([]);
    setShowCancelCreateConfirm(false);
  };

  const handleCreateServices = async (e) => {
    e.preventDefault();

    const currentSubject = availableSubjects.find(s => s.id === selectedSubjectId);

    if (!selectedSubjectId || !selectedSubject?.grade?.id) {
      setError('Subject or grade information is missing');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }

    await checkExistingServices();

    const servicesToCreate = selectedServices.filter(
      serviceId => !existingServiceIds.includes(serviceId)
    );

    const duplicateServices = selectedServices.filter(
      serviceId => existingServiceIds.includes(serviceId)
    );

    if (duplicateServices.length > 0) {
      const duplicateNames = availableServices
        .filter(service => duplicateServices.includes(service.id))
        .map(service => service.name)
        .join(', ');

      setError(
        `Cannot create: ${duplicateNames} already exist${duplicateServices.length === 1 ? 's' : ''} for ${currentSubject?.name || 'this subject'} in Grade ${selectedSubject?.grade?.name}`
      );
      return;
    }

    if (servicesToCreate.length === 0) {
      setError('All selected services already exist for this subject and grade');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await subjectServicesApi.create({
        subjectId: selectedSubjectId,
        gradeId: selectedSubject.grade.id,
        serviceIds: servicesToCreate
      });

      const createdData = response.data.data;
      if (createdData && createdData.subjectServices) {
        setCreatedServices(createdData.subjectServices || []);
      }

      setCreateSuccess(true);
      setSelectedServices([]);

      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        fetchServices();
        checkExistingServices();
        setCreateSuccess(false);
        setShowCreateForm(false);
        setCreatedServices([]);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject services');
    } finally {
      setCreating(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Selection changed callback
  const onSelectionChanged = useCallback(() => {
    const selected = gridRef.current?.api?.getSelectedRows() || [];
    setSelectedRows(selected);
  }, []);

  const handleClearSelection = () => {
    gridRef.current?.api?.deselectAll();
    setSelectedRows([]);
  };

  // ID Cell Renderer with Copy button
  const IdCellRenderer = useCallback((params) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(params.value);
        setIsCopied(true);
        showSuccess('ID copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        showError('Failed to copy');
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
        <code style={{
          padding: '0.25rem 0.5rem',
          background: '#f0f9ff',
          borderRadius: '0.25rem',
          fontWeight: '500',
          fontSize: '0.7rem',
          color: '#0369a1',
          letterSpacing: '-0.01em',
          border: '1px solid #bae6fd',
          fontFamily: "'Monaco', 'Menlo', 'Consolas', monospace",
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value}
        </code>
        <button
          onClick={handleCopy}
          style={{
            padding: '0.25rem',
            background: isCopied ? '#dcfce7' : '#f8fafc',
            border: isCopied ? '1px solid #86efac' : '1px solid #e2e8f0',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Copy to clipboard"
        >
          {isCopied ? (
            <Check size={12} style={{ color: '#16a34a' }} />
          ) : (
            <Copy size={12} style={{ color: '#64748b' }} />
          )}
        </button>
      </div>
    );
  }, [showSuccess, showError]);

  // Service Name Cell Renderer
  const ServiceNameRenderer = useCallback((params) => {
    const data = params.data;
    if (!data) return null;
    const name = data.service_name || 'Unspecified';
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '500',
        color: '#1e293b'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: name !== 'Unspecified' ? '#10b981' : '#94a3b8',
          flexShrink: 0
        }} />
        <span>{name}</span>
      </div>
    );
  }, []);

  // Grade Badge Cell Renderer
  const GradeBadgeRenderer = useCallback((params) => {
    return (
      <span style={{
        padding: '0.25rem 0.625rem',
        background: '#dcfce7',
        color: '#166534',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <GraduationCap size={12} />
        {params.value}
      </span>
    );
  }, []);

  // AG Grid Column Definitions
  // Exact widths: Selection 50, ID 280, Service Name 172, Service ID 329, Subject ID 95, Grade 85, Created At 115
  const columnDefs = useMemo(() => [
    {
      headerName: 'ID (GUID)',
      field: 'id',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 280,
      minWidth: 280,
      maxWidth: 280,
      cellRenderer: 'idCellRenderer'
    },
    {
      headerName: 'Service Name',
      field: 'service_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 172,
      minWidth: 172,
      maxWidth: 172,
      cellRenderer: 'serviceNameRenderer'
    },
    {
      headerName: 'Service ID',
      field: 'service_id',
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 329,
      minWidth: 329,
      maxWidth: 329,
      cellStyle: { fontWeight: '600', color: '#475569', textAlign: 'center' },
      headerClass: 'ag-header-center'
    },
    {
      headerName: 'Subject ID',
      field: 'subject_id',
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 95,
      minWidth: 95,
      maxWidth: 95,
      cellStyle: { fontWeight: '600', color: '#475569', textAlign: 'center' },
      headerClass: 'ag-header-center'
    },
    {
      headerName: 'Grade',
      field: 'grade_id',
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 85,
      minWidth: 85,
      maxWidth: 85,
      cellRenderer: 'gradeBadgeRenderer'
    },
    {
      headerName: 'Created',
      field: 'created_at',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: DateFloatingFilter,
      suppressFloatingFilterButton: true,
      minWidth: 130,
      flex: 1,
      valueFormatter: (params) => formatDate(params.value),
      filterValueGetter: (params) => getLocalDateString(params.data?.created_at),
      cellStyle: { color: '#64748b' }
    }
  ], []);

  // AG Grid components
  const components = useMemo(() => ({
    idCellRenderer: IdCellRenderer,
    serviceNameRenderer: ServiceNameRenderer,
    gradeBadgeRenderer: GradeBadgeRenderer
  }), [IdCellRenderer, ServiceNameRenderer, GradeBadgeRenderer]);

  // AG Grid default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);

  const StatCard = ({ icon: Icon, label, value, color, bgColor, borderColor }) => (
    <div style={{
      flex: '1',
      minWidth: '140px',
      padding: '1rem',
      background: bgColor,
      borderRadius: '0.75rem',
      border: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '0.5rem',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} style={{ color: 'white' }} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginBottom: '0.125rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
          {value}
        </div>
      </div>
    </div>
  );

  const stats = {
    total: services.length,
    available: Math.max(0, availableServices.length - existingServiceIds.length),
    existing: existingServiceIds.length
  };

  const currentSubject = availableSubjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="ssm-container">
      {/* Header */}
      <div className="ssm-header">
        <div className="ssm-header-left">
          <div className="ssm-header-icon">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="ssm-title">Subject Services</h1>
            <p className="ssm-subtitle">
              {selectedSubject?.grade?.name
                ? `Managing services for ${selectedSubject.grade.name}`
                : 'Select a grade to manage services'}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Selector */}
      {selectedSubject?.grade && (
        <div className="ssm-subject-selector">
          <label className="ssm-label">
            <BookOpen size={16} />
            Select Subject for Grade {selectedSubject.grade.name}
          </label>
          <div className="ssm-selector-row">
            <div className="ssm-select-wrapper">
              <select
                className="ssm-select"
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(parseInt(e.target.value))}
                disabled={loadingSubjects || availableSubjects.length === 0}
              >
                <option value="">-- Select a Subject --</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="ssm-select-icon" />
            </div>
            <div className="ssm-selector-actions">
              <button
                className="ssm-btn ssm-btn-secondary"
                onClick={fetchServices}
                disabled={loading || !selectedSubjectId}
              >
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
                Refresh
              </button>
              <button
                className="ssm-btn ssm-btn-primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={!selectedSubjectId}
              >
                <Plus size={16} />
                {showCreateForm ? 'Cancel' : 'Create'}
              </button>
            </div>
          </div>
          {currentSubject && (
            <div className="ssm-subject-info">
              <span><GraduationCap size={14} /> Grade: <strong>{selectedSubject.grade?.name}</strong></span>
              <span>Subject ID: <strong>{selectedSubjectId}</strong></span>
              <span>Grade ID: <strong>{selectedSubject.grade?.id}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="ssm-stats">
        <StatCard icon={BarChart3} label="Total Services" value={stats.total} color="#6366f1" bgColor="#eef2ff" borderColor="#c7d2fe" />
        <StatCard icon={CheckCircle} label="Available" value={stats.available} color="#16a34a" bgColor="#f0fdf4" borderColor="#bbf7d0" />
        <StatCard icon={Layers} label="Already Exists" value={stats.existing} color="#dc2626" bgColor="#fef2f2" borderColor="#fecaca" />
      </div>

      {/* Error */}
      {error && (
        <div className="ssm-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="ssm-create-section">
          <div className="ssm-section-header">
            <Plus size={18} />
            <span>Create Services for {currentSubject?.name || 'Subject'}</span>
          </div>
          <form onSubmit={handleCreateServices} className="ssm-form">
            <div className="ssm-info-box">
              <BookOpen size={16} />
              <span>Subject: <strong>{currentSubject?.name}</strong> (ID: {selectedSubjectId}) • Grade: <strong>{selectedSubject?.grade?.name}</strong> (ID: {selectedSubject?.grade?.id})</span>
            </div>

            {existingServiceIds.length > 0 && (
              <div className="ssm-warning">
                <AlertCircle size={16} />
                <span>{existingServiceIds.length} service(s) already exist and cannot be selected.</span>
              </div>
            )}

            <div className="ssm-selection-box">
              <div className="ssm-selection-header">
                <div className="ssm-selection-title">
                  <Layers size={16} />
                  <span>Select Services</span>
                </div>
                <span className="ssm-selection-meta">{selectedServices.length} selected • {availableServices.length - existingServiceIds.length} available</span>
                <div className="ssm-selection-btns">
                  <button type="button" className="ssm-btn ssm-btn-sm" onClick={handleSelectAll}>Select All</button>
                  <button type="button" className="ssm-btn ssm-btn-sm" onClick={handleDeselectAll}>Deselect</button>
                </div>
              </div>
              <div className="ssm-services-grid">
                {loadingServices ? (
                  <div className="ssm-inline-msg"><Loader2 size={20} className="spin" /> Loading...</div>
                ) : availableServices.length === 0 ? (
                  <div className="ssm-inline-msg"><AlertCircle size={20} /> No services available</div>
                ) : (
                  availableServices.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    const alreadyExists = existingServiceIds.includes(service.id);
                    return (
                      <label key={service.id} className={`ssm-service-item ${isSelected ? 'selected' : ''} ${alreadyExists ? 'disabled' : ''}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleServiceToggle(service.id)} disabled={alreadyExists} />
                        <span className="ssm-service-name">{service.name}</span>
                        {alreadyExists && <span className="ssm-exists-badge">Exists</span>}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {createSuccess && (
              <div className="ssm-success">
                <CheckCircle size={16} />
                <span>Services created successfully! ({createdServices.length} created)</span>
              </div>
            )}

            <div className="ssm-form-actions">
              <button type="button" className="ssm-btn ssm-btn-secondary" onClick={handleCancelCreate} disabled={creating}>
                Cancel
              </button>
              <button
                type="submit"
                className="ssm-btn ssm-btn-success"
                disabled={creating || createSuccess || selectedServices.length === 0}
                style={{
                  opacity: selectedServices.length === 0 && !creating && !createSuccess ? 0.6 : 1,
                  cursor: selectedServices.length === 0 && !creating && !createSuccess ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? <><Loader2 size={16} className="spin" /> Creating...</> : <><Plus size={16} /> Create {selectedServices.length} Service{selectedServices.length !== 1 ? 's' : ''}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selection Toolbar */}
      {selectedRows.length > 0 && (
        <div className="ssm-selection-toolbar">
          <span className="ssm-selection-count">
            {selectedRows.length} service{selectedRows.length !== 1 ? 's' : ''} selected
          </span>
          <button
            className="ssm-btn ssm-btn-ghost ssm-btn-sm"
            onClick={handleClearSelection}
            title="Clear selection"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}

      {/* AG Grid Data Table */}
      <div className="ssm-grid-container">
        {loading ? (
          <div className="ssm-grid-loading">
            <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
            <p>Loading services...</p>
          </div>
        ) : (
          <div className="ag-theme-quartz ssm-grid">
            <AgGridReact
              ref={gridRef}
              rowData={services}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              components={components}
              rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true, enableClickSelection: false }}
              onSelectionChanged={onSelectionChanged}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              animateRows={false}
              enableCellTextSelection={true}
              getRowId={(params) => params.data?.id}
              maintainColumnOrder={true}
              overlayNoRowsTemplate={`
                <div style="padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 16px;">🔧</div>
                  <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">No services found</div>
                  <div style="font-size: 14px; color: #64748b;">Try adjusting your filters or create new services</div>
                </div>
              `}
            />
          </div>
        )}
      </div>

      {/* Cancel Create Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelCreateConfirm}
        onClose={() => setShowCancelCreateConfirm(false)}
        onConfirm={handleConfirmCancelCreate}
        title="Cancel Creation"
        message="Are you sure you want to cancel? Your service selection will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue"
        type="warning"
      />

      <style>{`
        .ssm-container {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .ssm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(to right, #f8fafc, #ffffff);
        }

        .ssm-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ssm-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .ssm-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .ssm-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .ssm-header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .ssm-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ssm-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ssm-btn-primary {
          background: linear-gradient(135deg, var(--primary), #6366f1);
          color: white;
        }

        .ssm-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .ssm-btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .ssm-btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .ssm-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .ssm-btn-ghost {
          background: transparent;
          color: #64748b;
        }

        .ssm-btn-ghost:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .ssm-btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
        }

        .ssm-subject-selector {
          padding: 1.25rem 1.5rem;
          background: linear-gradient(to right, #eff6ff, #dbeafe);
          border-bottom: 1px solid #93c5fd;
        }

        .ssm-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .ssm-selector-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ssm-select-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .ssm-selector-actions {
          display: flex;
          gap: 0.5rem;
          margin-left: auto;
        }

        .ssm-select {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 1px solid #93c5fd;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          background: white;
          cursor: pointer;
          appearance: none;
        }

        .ssm-select-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #6b7280;
        }

        .ssm-subject-info {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: #374151;
        }

        .ssm-subject-info span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .ssm-subject-info strong { color: #1e40af; }

        .ssm-stats {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          flex-wrap: wrap;
        }

        .ssm-error {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0 1.5rem 1rem;
          padding: 0.875rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.5rem;
          color: #dc2626;
          font-size: 0.875rem;
        }

        .ssm-error button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          padding: 0.25rem;
        }

        .ssm-create-section {
          border-top: 1px solid #e2e8f0;
        }

        .ssm-section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
          color: #1e293b;
        }

        .ssm-form {
          padding: 1.5rem;
        }

        .ssm-info-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1e40af;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .ssm-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fffbeb;
          border: 1px solid #fbbf24;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #92400e;
          margin-bottom: 1rem;
        }

        .ssm-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #166534;
          margin-bottom: 1rem;
        }

        .ssm-selection-box {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .ssm-selection-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .ssm-selection-title {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .ssm-selection-meta {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .ssm-selection-btns {
          margin-left: auto;
          display: flex;
          gap: 0.5rem;
        }

        .ssm-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.5rem;
          padding: 1rem;
          max-height: 280px;
          overflow-y: auto;
        }

        .ssm-service-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s;
        }

        .ssm-service-item:hover:not(.disabled) { border-color: #93c5fd; background: #f8fafc; }
        .ssm-service-item.selected { border-color: var(--primary); background: #eef2ff; }
        .ssm-service-item.disabled { opacity: 0.6; cursor: not-allowed; background: #fef2f2; border-color: #fecaca; }
        .ssm-service-item input { accent-color: var(--primary); }
        .ssm-service-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .ssm-exists-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: #fecaca;
          color: #991b1b;
          border-radius: 0.25rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .ssm-inline-msg {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #64748b;
        }

        .ssm-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .ssm-selection-toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1.5rem;
          background: #dbeafe;
          border-top: 1px solid #93c5fd;
          border-bottom: 1px solid #93c5fd;
        }

        .ssm-selection-count {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e40af;
        }

        .ssm-grid-container {
          padding: 0 1.5rem 1.5rem;
        }

        .ssm-grid {
          height: 550px;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        /* AG Grid styling customizations */
        .ssm-grid .ag-floating-filter-input {
          border: 1px solid #cbd5e1 !important;
          border-radius: 0.375rem !important;
          padding: 0 0.5rem !important;
          font-size: 0.8125rem !important;
          height: 28px !important;
          transition: all 0.15s ease !important;
        }

        .ssm-grid .ag-floating-filter-input:hover {
          border-color: #94a3b8 !important;
        }

        .ssm-grid .ag-floating-filter-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          outline: none !important;
        }

        .ssm-grid .ag-floating-filter {
          padding: 0.375rem 0.5rem !important;
        }

        .ssm-grid .ag-header-cell {
          background: #f8fafc;
        }

        .ssm-grid .ag-header-cell-label {
          font-weight: 600;
          color: #475569;
        }

        .ssm-grid .ag-row:hover {
          background-color: #f1f5f9 !important;
        }

        .ssm-grid .ag-row-selected {
          background-color: #dbeafe !important;
        }

        .ssm-grid .ag-row-selected:hover {
          background-color: #bfdbfe !important;
        }

        .ssm-grid .ag-paging-panel {
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.5rem 1rem;
        }

        .ssm-grid .ag-header-center .ag-header-cell-label {
          justify-content: center;
        }

        .ssm-grid .ag-cell {
          display: flex;
          align-items: center;
        }

        .ssm-grid-loading {
          height: 550px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .ssm-grid-loading p {
          margin-top: 1rem;
          color: #64748b;
        }

        .ssm-empty-state {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .ssm-empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 1rem 0 0.5rem;
        }

        .ssm-empty-state p {
          color: #64748b;
          margin: 0 0 1.5rem;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .ssm-subject-selector {
            padding: 1rem;
          }

          .ssm-selector-row {
            flex-direction: column;
            align-items: stretch;
          }

          .ssm-select-wrapper {
            max-width: 100%;
          }

          .ssm-selector-actions {
            width: 100%;
            margin-left: 0;
          }

          .ssm-selector-actions .ssm-btn {
            flex: 1;
            justify-content: center;
          }

          .ssm-subject-info {
            flex-direction: column;
            gap: 0.5rem;
          }

          .ssm-stats {
            flex-direction: column;
            padding: 1rem;
          }

          .ssm-error {
            margin: 0 1rem 1rem;
          }

          .ssm-section-header {
            padding: 0.75rem 1rem;
          }

          .ssm-form {
            padding: 1rem;
          }

          .ssm-info-box {
            flex-direction: column;
            align-items: flex-start;
          }

          .ssm-selection-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .ssm-selection-btns {
            margin-left: 0;
            width: 100%;
          }

          .ssm-selection-btns .ssm-btn {
            flex: 1;
            justify-content: center;
          }

          .ssm-services-grid {
            grid-template-columns: 1fr;
            max-height: 200px;
          }

          .ssm-form-actions {
            flex-direction: column;
          }

          .ssm-form-actions .ssm-btn {
            width: 100%;
            justify-content: center;
          }

          .ssm-selection-toolbar {
            padding: 0.625rem 1rem;
          }

          .ssm-grid-container {
            padding: 0 1rem 1rem;
          }

          .ssm-grid {
            height: calc(100vh - 450px);
            min-height: 300px;
          }

          .ssm-grid-loading {
            height: calc(100vh - 450px);
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}

export default SubjectServicesManager;
