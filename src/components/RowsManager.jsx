import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Grid, Plus, RefreshCw, AlertCircle, CheckCircle, Loader2, Edit2, Trash2,
  Package, ArrowUp, ArrowDown, X, BarChart3, CheckCircle2, XCircle
} from 'lucide-react';
import { rowsApi, bundlesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSubject } from '../context/SubjectContext';
import ConfirmDialog from './ConfirmDialog';
import ActivateToggleButton from './ActivateToggleButton';
import StatusBadge from './StatusBadge';

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

// Status Filter Dropdown for AG Grid floating filter
const StatusFloatingFilter = forwardRef((props, ref) => {
  const [status, setStatus] = useState('');

  useImperativeHandle(ref, () => ({
    onParentModelChanged(parentModel) {
      setStatus(parentModel?.filter || '');
    }
  }));

  const onChange = (e) => {
    const value = e.target.value;
    setStatus(value);
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

  return (
    <select
      value={status}
      onChange={onChange}
      style={{
        width: '100%',
        height: '26px',
        padding: '4px 6px',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#334155',
        background: '#f8fafc',
        cursor: 'pointer',
        outline: 'none'
      }}
    >
      <option value="">All</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  );
});

function RowsManager() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const { selectedSubject } = useSubject();
  const gridRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create row state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newRowNameEn, setNewRowNameEn] = useState('');
  const [newRowDescription, setNewRowDescription] = useState('');
  const [newRowDescriptionEn, setNewRowDescriptionEn] = useState('');

  // Edit row state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editRowName, setEditRowName] = useState('');
  const [editRowNameEn, setEditRowNameEn] = useState('');
  const [editRowDescription, setEditRowDescription] = useState('');
  const [editRowDescriptionEn, setEditRowDescriptionEn] = useState('');
  const [updating, setUpdating] = useState(false);

  // Assign bundles state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [availableBundles, setAvailableBundles] = useState([]);
  const [assignedBundles, setAssignedBundles] = useState([]);
  const [bundlesToAssign, setBundlesToAssign] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Delete',
    type: 'danger',
  });

  // Cancel confirmation states
  const [showCancelCreateConfirm, setShowCancelCreateConfirm] = useState(false);
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false);

  // Server-side filtering
  const [serverFilters, setServerFilters] = useState({});
  const filterTimeoutRef = useRef(null);
  const filterModelRef = useRef(null);

  useEffect(() => {
    fetchRows();
  }, [selectedSubject?.grade?.id, serverFilters]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError(null);
      const gradeId = selectedSubject?.grade?.id || null;
      // Fetch rows with server-side filters
      const response = await rowsApi.getAll(1, 1000, gradeId, serverFilters);
      setRows(response.data.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load rows';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes from AG Grid and apply to server
  const onFilterChanged = useCallback((params) => {
    const filterModel = params.api.getFilterModel();
    // Store filter model to restore after data reload
    filterModelRef.current = filterModel;

    const newFilters = {};

    // Extract filter values
    // Number filter (id) - AG Grid agNumberColumnFilter uses 'filter' for value and 'type' for operator
    if (filterModel.id?.filter !== undefined && filterModel.id?.filter !== null) {
      newFilters.id = filterModel.id.filter;
      newFilters.idFilterType = filterModel.id.type; // equals, lessThan, greaterThan, etc.
    }
    if (filterModel.name?.filter) {
      newFilters.name = filterModel.name.filter;
    }
    if (filterModel.description?.filter) {
      newFilters.description = filterModel.description.filter;
    }
    if (filterModel.is_active?.filter) {
      newFilters.status = filterModel.is_active.filter;
    }
    // Date filter (created_at)
    if (filterModel.created_at?.filter) {
      newFilters.createdAt = filterModel.created_at.filter;
    }

    // Debounce the server call
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      setServerFilters(newFilters);
    }, 500);
  }, []);

  // Restore filter model when grid is ready
  const onGridReady = useCallback((params) => {
    if (filterModelRef.current && Object.keys(filterModelRef.current).length > 0) {
      setTimeout(() => {
        params.api.setFilterModel(filterModelRef.current);
      }, 0);
    }
  }, []);

  // Restore filter model after data changes
  useEffect(() => {
    if (gridRef.current?.api && filterModelRef.current && Object.keys(filterModelRef.current).length > 0) {
      // Use setTimeout to ensure this runs after the grid has processed the new data
      setTimeout(() => {
        gridRef.current.api.setFilterModel(filterModelRef.current);
      }, 0);
    }
  }, [rows]);

  // Cancel handlers
  const handleCancelCreate = () => {
    if (newRowName.trim() || newRowNameEn.trim() || newRowDescription.trim() || newRowDescriptionEn.trim()) {
      setShowCancelCreateConfirm(true);
    } else {
      setShowCreateForm(false);
    }
  };

  const handleConfirmCancelCreate = () => {
    setNewRowName('');
    setNewRowNameEn('');
    setNewRowDescription('');
    setNewRowDescriptionEn('');
    setShowCreateForm(false);
    setShowCancelCreateConfirm(false);
  };

  const handleCancelEdit = () => {
    setShowCancelEditConfirm(true);
  };

  const handleConfirmCancelEdit = () => {
    setShowEditModal(false);
    setShowCancelEditConfirm(false);
  };

  const handleCreateRow = async (e) => {
    e.preventDefault();

    if (!newRowName.trim()) {
      showWarning('Row name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await rowsApi.create({
        name: newRowName,
        name_en: newRowNameEn,
        description: newRowDescription,
        description_en: newRowDescriptionEn,
        gradeId: selectedSubject?.grade?.id || null,
      });

      showSuccess('Row created successfully!');
      setNewRowName('');
      setNewRowNameEn('');
      setNewRowDescription('');
      setNewRowDescriptionEn('');
      setShowCreateForm(false);
      fetchRows();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create row';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (row) => {
    setEditingRow(row);
    setEditRowName(row.name || '');
    setEditRowNameEn(row.name_en || '');
    setEditRowDescription(row.description || '');
    setEditRowDescriptionEn(row.description_en || '');
    setShowEditModal(true);
  };

  const handleUpdateRow = async (e) => {
    e.preventDefault();

    if (!editRowName.trim()) {
      showWarning('Row name is required');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await rowsApi.update(editingRow.id, {
        name: editRowName,
        name_en: editRowNameEn,
        description: editRowDescription,
        description_en: editRowDescriptionEn,
      });

      showSuccess('Row updated successfully!');
      setShowEditModal(false);
      setEditingRow(null);
      fetchRows();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update row';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRow = (rowId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Row',
      message: 'Are you sure you want to delete this row? All bundle assignments will be removed. This action cannot be undone.',
      confirmText: 'Delete Row',
      type: 'danger',
      onConfirm: async () => {
        try {
          setError(null);
          await rowsApi.delete(rowId);
          showSuccess('Row deleted successfully!');
          fetchRows();
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Failed to delete row';
          setError(errorMsg);
          showError(errorMsg);
        }
      },
    });
  };

  const handleToggleActivation = async (rowId, currentStatus) => {
    try {
      await rowsApi.setActive(rowId, !currentStatus);
      showSuccess(`Row ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchRows();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to toggle row activation';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleOpenAssignForm = async (row) => {
    setSelectedRow(row);
    setShowAssignForm(true);
    setLoadingBundles(true);
    setBundlesToAssign([]);
    setOrderChanged(false);

    try {
      const gradeId = selectedSubject?.grade?.id || null;
      const bundlesResponse = await bundlesApi.getAll(1, 100, gradeId);
      const allBundles = bundlesResponse.data.data || [];

      const assignedResponse = await rowsApi.getBundles(row.id);
      const assigned = assignedResponse.data.data || [];

      setAssignedBundles(assigned);
      setAvailableBundles(allBundles);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load bundles';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoadingBundles(false);
    }
  };

  const handleToggleBundleSelection = (bundleId) => {
    setBundlesToAssign(prev => {
      if (prev.includes(bundleId)) {
        return prev.filter(id => id !== bundleId);
      } else {
        return [...prev, bundleId];
      }
    });
  };

  const handleAssignBundles = async () => {
    if (bundlesToAssign.length === 0) {
      showWarning('Please select at least one bundle to assign');
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      const nextOrder = assignedBundles.length > 0
        ? Math.max(...assignedBundles.map(b => b.bundle_order)) + 1
        : 1;

      const bundleAssignments = bundlesToAssign.map((bundleId, index) => ({
        bundleId,
        bundleOrder: nextOrder + index,
      }));

      await rowsApi.assignBundles(selectedRow.id, bundleAssignments);

      showSuccess('Bundles assigned successfully!');
      setBundlesToAssign([]);

      const assignedResponse = await rowsApi.getBundles(selectedRow.id);
      setAssignedBundles(assignedResponse.data.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to assign bundles';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveBundle = (rowBundleId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Bundle',
      message: 'Are you sure you want to remove this bundle from the row?',
      confirmText: 'Remove Bundle',
      type: 'danger',
      onConfirm: async () => {
        try {
          setError(null);
          await rowsApi.removeBundle(selectedRow.id, rowBundleId);
          showSuccess('Bundle removed successfully!');

          const assignedResponse = await rowsApi.getBundles(selectedRow.id);
          setAssignedBundles(assignedResponse.data.data || []);
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Failed to remove bundle';
          setError(errorMsg);
          showError(errorMsg);
        }
      },
    });
  };

  const handleMoveBundle = (bundle, direction) => {
    const currentIndex = assignedBundles.findIndex(b => b.id === bundle.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === assignedBundles.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newBundles = [...assignedBundles];
    [newBundles[currentIndex], newBundles[newIndex]] = [newBundles[newIndex], newBundles[currentIndex]];

    const updatedBundles = newBundles.map((bundle, index) => ({
      ...bundle,
      bundle_order: index + 1,
    }));

    setAssignedBundles(updatedBundles);
    setOrderChanged(true);
  };

  const handleSaveOrder = async () => {
    if (!orderChanged) return;

    setSavingOrder(true);
    try {
      const bundleOrders = assignedBundles.map((bundle) => ({
        id: bundle.id,
        bundleOrder: bundle.bundle_order,
      }));

      await rowsApi.reorderBundles(selectedRow.id, bundleOrders);

      setOrderChanged(false);
      showSuccess('Bundle order saved successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save bundle order';
      setError(errorMsg);
      showError(errorMsg);
      const assignedResponse = await rowsApi.getBundles(selectedRow.id);
      setAssignedBundles(assignedResponse.data.data || []);
      setOrderChanged(false);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelOrderChanges = async () => {
    try {
      const assignedResponse = await rowsApi.getBundles(selectedRow.id);
      setAssignedBundles(assignedResponse.data.data || []);
      setOrderChanged(false);
      showInfo('Order changes cancelled');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to refresh bundles';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const isAlreadyAssigned = (bundleId) => {
    return assignedBundles.some(ab => ab.bundle_id === bundleId);
  };

  // Stats
  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => r.is_active).length,
    inactive: rows.filter(r => !r.is_active).length
  }), [rows]);

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'ID',
      field: 'id',
      width: 70,
      minWidth: 60,
      maxWidth: 90,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
    },
    {
      headerName: 'Row Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      minWidth: 180,
      maxWidth: 350,
      flex: 2,
      filterValueGetter: (params) => {
        const row = params.data;
        if (!row) return '';
        // Combine both names for filtering to work with Arabic and English
        return `${row.name_en || ''} ${row.name || ''}`.trim();
      },
      cellRenderer: (params) => {
        const row = params.data;
        if (!row) return null;
        const nameEn = row.name_en || row.name;
        const nameAr = row.name;
        return (
          <div style={{ lineHeight: '1.3' }}>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{nameEn}</div>
            {nameAr && nameAr !== nameEn && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{nameAr}</div>
            )}
          </div>
        );
      }
    },
    {
      headerName: 'Description',
      field: 'description',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      minWidth: 150,
      maxWidth: 300,
      flex: 1,
      cellRenderer: (params) => {
        const desc = params.value;
        if (!desc) return <span style={{ color: '#94a3b8' }}>—</span>;
        return (
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#64748b'
          }}>
            {desc}
          </div>
        );
      }
    },
    {
      headerName: 'Status',
      field: 'is_active',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: StatusFloatingFilter,
      suppressFloatingFilterButton: true,
      width: 100,
      minWidth: 85,
      maxWidth: 115,
      valueGetter: (params) => params.data?.is_active ? 'Active' : 'Inactive',
      cellRenderer: (params) => (
        <StatusBadge isActive={params.data?.is_active} />
      )
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
      filterValueGetter: (params) => getLocalDateString(params.data?.created_at)
    },
    {
      headerName: 'Actions',
      width: 170,
      minWidth: 150,
      maxWidth: 190,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const row = params.data;
        if (!row) return null;
        return (
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={() => handleOpenAssignForm(row)}
              style={{
                padding: '0.375rem',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Manage Bundles"
            >
              <Package size={14} style={{ color: '#0369a1' }} />
            </button>
            <button
              onClick={() => handleOpenEditModal(row)}
              style={{
                padding: '0.375rem',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Edit Row"
            >
              <Edit2 size={14} style={{ color: '#64748b' }} />
            </button>
            <ActivateToggleButton
              isActive={row.is_active}
              onToggle={() => handleToggleActivation(row.id, row.is_active)}
              entityName="row"
            />
            <button
              onClick={() => handleDeleteRow(row.id)}
              style={{
                padding: '0.375rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Delete Row"
            >
              <Trash2 size={14} style={{ color: '#dc2626' }} />
            </button>
          </div>
        );
      }
    }
  ], []);

  // AG Grid default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);

  // Stats Card Component
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

  return (
    <div className="rows-manager">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
      />

      {/* Cancel Create Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelCreateConfirm}
        onClose={() => setShowCancelCreateConfirm(false)}
        onConfirm={handleConfirmCancelCreate}
        title="Cancel Creation"
        message="Are you sure you want to cancel? All entered data will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        type="warning"
      />

      {/* Cancel Edit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelEditConfirm}
        onClose={() => setShowCancelEditConfirm(false)}
        onConfirm={handleConfirmCancelEdit}
        title="Discard Changes"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        confirmText="Yes, Discard"
        cancelText="Continue Editing"
        type="warning"
      />

      {/* Header */}
      <div className="rm-header">
        <div className="rm-header-left">
          <div className="rm-header-icon">
            <Grid size={24} />
          </div>
          <div>
            <h1 className="rm-title">Rows Management</h1>
            <p className="rm-subtitle">
              {selectedSubject?.grade?.name
                ? `Organizing bundles for ${selectedSubject.grade.name}`
                : 'Select a grade to manage rows'}
            </p>
          </div>
        </div>
        <div className="rm-header-actions">
          <button
            className="rm-btn rm-btn-secondary"
            onClick={fetchRows}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            className="rm-btn rm-btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={16} />
            {showCreateForm ? 'Cancel' : 'Create Row'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="rm-create-panel">
          <h3><Plus size={18} /> Create New Row</h3>
          <form onSubmit={handleCreateRow}>
            <div className="rm-form-grid">
              <div className="rm-form-group">
                <label>Row Name (English)</label>
                <input
                  type="text"
                  value={newRowNameEn}
                  onChange={(e) => setNewRowNameEn(e.target.value)}
                  placeholder="e.g., Featured Bundles"
                />
              </div>
              <div className="rm-form-group">
                <label className="required">Row Name (Arabic)</label>
                <input
                  type="text"
                  value={newRowName}
                  onChange={(e) => setNewRowName(e.target.value)}
                  placeholder="اسم الصف بالعربية"
                  required
                  dir="rtl"
                />
              </div>
              <div className="rm-form-group">
                <label>Description (English)</label>
                <textarea
                  value={newRowDescriptionEn}
                  onChange={(e) => setNewRowDescriptionEn(e.target.value)}
                  placeholder="Optional description"
                  rows="2"
                />
              </div>
              <div className="rm-form-group">
                <label>Description (Arabic)</label>
                <textarea
                  value={newRowDescription}
                  onChange={(e) => setNewRowDescription(e.target.value)}
                  placeholder="وصف الصف بالعربية..."
                  rows="2"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="rm-form-actions">
              <button type="button" className="rm-btn rm-btn-secondary" onClick={handleCancelCreate}>
                Cancel
              </button>
              <button
                type="submit"
                className="rm-btn rm-btn-success"
                disabled={creating || !newRowName.trim()}
                style={{
                  opacity: !newRowName.trim() && !creating ? 0.6 : 1,
                  cursor: !newRowName.trim() && !creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                {creating ? 'Creating...' : 'Create Row'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="rm-stats">
        <StatCard
          icon={BarChart3}
          label="Total Rows"
          value={stats.total}
          color="#6366f1"
          bgColor="#eef2ff"
          borderColor="#c7d2fe"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          color="#16a34a"
          bgColor="#f0fdf4"
          borderColor="#bbf7d0"
        />
        <StatCard
          icon={XCircle}
          label="Inactive"
          value={stats.inactive}
          color="#dc2626"
          bgColor="#fef2f2"
          borderColor="#fecaca"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rm-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* AG Grid Data Table */}
      <div className="rm-grid-container">
        <div className="ag-theme-quartz rm-grid">
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            animateRows={false}
            enableCellTextSelection={true}
            getRowId={(params) => params.data?.id?.toString()}
            onGridReady={onGridReady}
            onFilterChanged={onFilterChanged}
            loading={loading}
            suppressNoRowsOverlay={false}
            overlayLoadingTemplate={`
              <div style="padding: 40px; text-align: center;">
                <div style="font-size: 16px; font-weight: 500; color: #64748b;">Loading rows...</div>
              </div>
            `}
            overlayNoRowsTemplate={`
              <div style="padding: 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">No rows found</div>
                <div style="font-size: 14px; color: #64748b;">Try adjusting your filters or create a new row</div>
              </div>
            `}
          />
        </div>
      </div>

      {/* Edit Row Modal */}
      {showEditModal && editingRow && (
        <div className="rm-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <h2><Edit2 size={20} /> Edit Row</h2>
              <button className="rm-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateRow}>
              <div className="rm-modal-body">
                <div className="rm-form-grid">
                  <div className="rm-form-group">
                    <label>Row Name (English)</label>
                    <input
                      type="text"
                      value={editRowNameEn}
                      onChange={(e) => setEditRowNameEn(e.target.value)}
                      placeholder="e.g., Featured Bundles"
                      disabled={updating}
                    />
                  </div>
                  <div className="rm-form-group">
                    <label className="required">Row Name (Arabic)</label>
                    <input
                      type="text"
                      value={editRowName}
                      onChange={(e) => setEditRowName(e.target.value)}
                      placeholder="اسم الصف بالعربية"
                      required
                      disabled={updating}
                      dir="rtl"
                    />
                  </div>
                  <div className="rm-form-group">
                    <label>Description (English)</label>
                    <textarea
                      value={editRowDescriptionEn}
                      onChange={(e) => setEditRowDescriptionEn(e.target.value)}
                      placeholder="Optional description"
                      rows="3"
                      disabled={updating}
                    />
                  </div>
                  <div className="rm-form-group">
                    <label>Description (Arabic)</label>
                    <textarea
                      value={editRowDescription}
                      onChange={(e) => setEditRowDescription(e.target.value)}
                      placeholder="وصف الصف بالعربية..."
                      rows="3"
                      disabled={updating}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
              <div className="rm-modal-footer">
                <button type="button" className="rm-btn rm-btn-secondary" onClick={handleCancelEdit} disabled={updating}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rm-btn rm-btn-primary"
                  disabled={updating || !editRowName.trim()}
                  style={{
                    opacity: !editRowName.trim() && !updating ? 0.6 : 1,
                    cursor: !editRowName.trim() && !updating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {updating ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                  {updating ? 'Updating...' : 'Update Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Bundles Modal */}
      {showAssignForm && selectedRow && (
        <div className="rm-modal-overlay" onClick={() => setShowAssignForm(false)}>
          <div className="rm-modal rm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <div>
                <h2><Package size={20} /> Manage Bundles</h2>
                <p>Row: {selectedRow.name_en || selectedRow.name}</p>
              </div>
              <button className="rm-close-btn" onClick={() => setShowAssignForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="rm-modal-body">
              {/* Assigned Bundles Section */}
              <div className="rm-section">
                <h3>Currently Assigned ({assignedBundles.length})</h3>
                {assignedBundles.length > 0 ? (
                  <>
                    <div className="rm-assigned-list">
                      {assignedBundles.map((bundle, index) => (
                        <div key={bundle.id} className={`rm-assigned-item ${orderChanged ? 'changed' : ''}`}>
                          <span className="rm-order-badge">{bundle.bundle_order}</span>
                          <div className="rm-bundle-info">
                            <strong>{bundle.name}</strong>
                            <span>{bundle.price} • {bundle.type}</span>
                          </div>
                          <div className="rm-bundle-actions">
                            <button onClick={() => handleMoveBundle(bundle, 'up')} disabled={index === 0 || savingOrder}>
                              <ArrowUp size={14} />
                            </button>
                            <button onClick={() => handleMoveBundle(bundle, 'down')} disabled={index === assignedBundles.length - 1 || savingOrder}>
                              <ArrowDown size={14} />
                            </button>
                            <button onClick={() => handleRemoveBundle(bundle.row_bundle_id)} disabled={savingOrder} className="danger">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {orderChanged && (
                      <div className="rm-order-warning">
                        <AlertCircle size={18} />
                        <span>You have unsaved order changes</span>
                        <div>
                          <button className="rm-btn rm-btn-secondary rm-btn-sm" onClick={handleCancelOrderChanges} disabled={savingOrder}>
                            Cancel
                          </button>
                          <button className="rm-btn rm-btn-primary rm-btn-sm" onClick={handleSaveOrder} disabled={savingOrder}>
                            {savingOrder ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                            Save Order
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rm-empty-assigned">
                    <Package size={32} />
                    <p>No bundles assigned</p>
                  </div>
                )}
              </div>

              {/* Available Bundles Section */}
              <div className="rm-section">
                <h3>Assign New Bundles</h3>
                {loadingBundles ? (
                  <div className="rm-loading-inline">
                    <Loader2 size={24} className="spin" />
                    <p>Loading bundles...</p>
                  </div>
                ) : (
                  <>
                    <div className="rm-available-list">
                      {availableBundles.map((bundle) => {
                        const isAssigned = isAlreadyAssigned(bundle.id);
                        const isSelected = bundlesToAssign.includes(bundle.id);
                        return (
                          <label
                            key={bundle.id}
                            className={`rm-available-item ${isAssigned ? 'assigned' : ''} ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleBundleSelection(bundle.id)}
                              disabled={isAssigned}
                            />
                            <div className="rm-bundle-info">
                              <strong>{bundle.name}</strong>
                              <span>
                                {bundle.price} • {bundle.type}
                                {isAssigned && <em> (Assigned)</em>}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      className="rm-btn rm-btn-primary"
                      onClick={handleAssignBundles}
                      disabled={assigning || bundlesToAssign.length === 0}
                      style={{
                        opacity: bundlesToAssign.length === 0 && !assigning ? 0.6 : 1,
                        cursor: bundlesToAssign.length === 0 && !assigning ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {assigning ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                      Assign {bundlesToAssign.length} Bundle{bundlesToAssign.length !== 1 ? 's' : ''}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rows-manager {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .rm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(to right, #f8fafc, #ffffff);
        }

        .rm-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rm-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .rm-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .rm-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .rm-header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .rm-btn {
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

        .rm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rm-btn-primary {
          background: linear-gradient(135deg, var(--primary), #6366f1);
          color: white;
        }

        .rm-btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .rm-btn-success {
          background: #16a34a;
          color: white;
        }

        .rm-btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
        }

        .rm-create-panel {
          margin: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border-radius: 0.75rem;
          border: 1px solid #86efac;
        }

        .rm-create-panel h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #166534;
          margin: 0 0 1rem 0;
        }

        .rm-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .rm-form-group label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.375rem;
        }

        .rm-form-group label.required::after {
          content: ' *';
          color: #dc2626;
        }

        .rm-form-group input,
        .rm-form-group textarea {
          width: 100%;
          padding: 0.625rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
        }

        .rm-form-group input:focus,
        .rm-form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .rm-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .rm-stats {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          flex-wrap: wrap;
        }

        .rm-error {
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

        .rm-error button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          padding: 0.25rem;
        }

        .rm-grid-container {
          padding: 0 1.5rem 1.5rem;
        }

        .rm-grid {
          height: 450px;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .rm-grid-loading, .rm-empty-state {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .rm-grid-loading p, .rm-empty-state p {
          margin-top: 1rem;
          color: #64748b;
        }

        .rm-empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 1rem 0 0.5rem;
        }

        /* Modal Styles */
        .rm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .rm-modal {
          background: white;
          border-radius: 1rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .rm-modal-lg {
          max-width: 900px;
        }

        .rm-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .rm-modal-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .rm-modal-header p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .rm-close-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: #64748b;
          border-radius: 0.375rem;
        }

        .rm-close-btn:hover {
          background: #e2e8f0;
        }

        .rm-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          max-height: calc(90vh - 180px);
        }

        .rm-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .rm-section {
          margin-bottom: 1.5rem;
        }

        .rm-section:last-child {
          margin-bottom: 0;
        }

        .rm-section h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.75rem 0;
        }

        .rm-assigned-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .rm-assigned-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
        }

        .rm-assigned-item.changed {
          background: #fffbeb;
          border-color: #f59e0b;
        }

        .rm-order-badge {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary);
          color: white;
          border-radius: 0.375rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .rm-bundle-info {
          flex: 1;
        }

        .rm-bundle-info strong {
          display: block;
          font-size: 0.875rem;
          color: #1e293b;
        }

        .rm-bundle-info span {
          font-size: 0.75rem;
          color: #64748b;
        }

        .rm-bundle-actions {
          display: flex;
          gap: 0.25rem;
        }

        .rm-bundle-actions button {
          padding: 0.375rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          cursor: pointer;
          display: flex;
        }

        .rm-bundle-actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .rm-bundle-actions button.danger {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .rm-order-warning {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #fffbeb;
          border: 1px solid #f59e0b;
          border-radius: 0.5rem;
          color: #92400e;
          font-size: 0.875rem;
        }

        .rm-order-warning > div {
          margin-left: auto;
          display: flex;
          gap: 0.5rem;
        }

        .rm-empty-assigned {
          padding: 2rem;
          text-align: center;
          color: #94a3b8;
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 0.5rem;
        }

        .rm-empty-assigned p {
          margin: 0.5rem 0 0;
        }

        .rm-loading-inline {
          padding: 2rem;
          text-align: center;
          color: #64748b;
        }

        .rm-available-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
        }

        .rm-available-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .rm-available-item:hover:not(.assigned) {
          border-color: var(--primary);
        }

        .rm-available-item.selected {
          background: #eff6ff;
          border-color: var(--primary);
        }

        .rm-available-item.assigned {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rm-available-item input {
          width: 18px;
          height: 18px;
        }

        .rm-available-item em {
          color: #f59e0b;
          font-style: normal;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .rm-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .rm-form-grid {
            grid-template-columns: 1fr;
          }

          .rm-stats {
            flex-direction: column;
          }

          .rm-modal {
            margin: 1rem;
          }

          .rm-grid {
            height: calc(100vh - 400px);
            min-height: 300px;
          }

          .rm-grid-loading, .rm-empty-state {
            height: calc(100vh - 400px);
            min-height: 300px;
          }

          .rm-grid-container {
            padding: 0 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default RowsManager;
