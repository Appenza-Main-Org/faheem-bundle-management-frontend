import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Plus, Eye, Package, AlertCircle, Loader2, Pencil, Trash2,
  RefreshCw, BarChart3, DollarSign, X, CheckCircle2, XCircle
} from 'lucide-react';
import { bundlesApi } from '../services/api';
import CreateBundleModal from './CreateBundleModal';
import EditBundleModal from './EditBundleModal';
import BundleDetailsModal from './BundleDetailsModal';
import ConfirmDialog from './ConfirmDialog';
import ActivateToggleButton from './ActivateToggleButton';
import StatusBadge from './StatusBadge';
import { useSubject } from '../context/SubjectContext';
import { useToast } from '../context/ToastContext';

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

// Type Filter Dropdown for AG Grid floating filter
const TypeFloatingFilter = forwardRef((props, ref) => {
  const [type, setType] = useState('');

  useImperativeHandle(ref, () => ({
    onParentModelChanged(parentModel) {
      setType(parentModel?.filter || '');
    }
  }));

  const onChange = (e) => {
    const value = e.target.value;
    setType(value);
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
      value={type}
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
      <option value="Duration">Duration</option>
      <option value="ExpiryDays">ExpiryDays</option>
    </select>
  );
});

function BundlesList() {
  const { selectedSubject } = useSubject();
  const { showError, showSuccess } = useToast();
  const gridRef = useRef(null);

  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState(null);
  const [serverFilters, setServerFilters] = useState({});
  const filterTimeoutRef = useRef(null);
  const filterModelRef = useRef(null);

  useEffect(() => {
    fetchBundles();
  }, [selectedSubject, serverFilters]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      setError(null);
      const gradeId = selectedSubject?.grade?.id || null;
      // Fetch bundles with server-side filters
      const response = await bundlesApi.getAll(1, 1000, gradeId, serverFilters);
      setBundles(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bundles');
      console.error('Error fetching bundles:', err);
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

    // Extract filter values - check both 'filter' (text) and direct value
    // For text column filters with custom floating filter components
    if (filterModel.name?.filter) {
      newFilters.name = filterModel.name.filter;
    }
    if (filterModel.description?.filter) {
      newFilters.description = filterModel.description.filter;
    }
    if (filterModel.type?.filter) {
      newFilters.type = filterModel.type.filter;
    }
    if (filterModel.is_active?.filter) {
      newFilters.status = filterModel.is_active.filter;
    }
    // Number filters (price, discount) - AG Grid agNumberColumnFilter uses 'filter' for value and 'type' for operator
    if (filterModel.price?.filter !== undefined && filterModel.price?.filter !== null) {
      newFilters.price = filterModel.price.filter;
      newFilters.priceFilterType = filterModel.price.type; // equals, lessThan, greaterThan, etc.
    }
    if (filterModel.discount?.filter !== undefined && filterModel.discount?.filter !== null) {
      newFilters.discount = filterModel.discount.filter;
      newFilters.discountFilterType = filterModel.discount.type;
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
      // Restore filter model after a small delay to ensure grid is fully initialized
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
  }, [bundles]);

  const handleBundleCreated = () => {
    setShowCreateModal(false);
    fetchBundles();
  };

  const handleViewDetails = async (bundleId) => {
    try {
      const response = await bundlesApi.getById(bundleId);
      setSelectedBundle(response.data.data);
      setShowDetailsModal(true);
    } catch (err) {
      showError('Failed to load bundle details');
      console.error('Error fetching bundle details:', err);
    }
  };

  const formatPrice = (price, discount) => {
    const finalPrice = price - (price * discount / 100);
    return finalPrice.toFixed(2);
  };

  const handleToggleActivation = async (bundleId, currentStatus) => {
    try {
      await bundlesApi.setActive(bundleId, !currentStatus);
      showSuccess(`Bundle ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchBundles();
    } catch (err) {
      showError('Failed to toggle bundle activation');
      console.error('Error toggling activation:', err);
    }
  };

  const handleEditBundle = (bundle) => {
    setSelectedBundle(bundle);
    setShowEditModal(true);
  };

  const handleBundleUpdated = () => {
    setShowEditModal(false);
    setSelectedBundle(null);
    fetchBundles();
  };

  const handleDeleteClick = (bundle) => {
    setBundleToDelete(bundle);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bundleToDelete) return;

    try {
      await bundlesApi.delete(bundleToDelete.id);
      setShowDeleteDialog(false);
      setBundleToDelete(null);
      fetchBundles();
    } catch (err) {
      showError('Failed to delete bundle');
      console.error('Error deleting bundle:', err);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setBundleToDelete(null);
  };

  // Stats
  const stats = useMemo(() => ({
    total: bundles.length,
    active: bundles.filter(b => b.is_active).length,
    inactive: bundles.filter(b => !b.is_active).length,
    totalValue: bundles.reduce((sum, b) => sum + (b.price - (b.price * b.discount / 100)), 0).toFixed(2)
  }), [bundles]);

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
      headerName: 'Bundle Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      minWidth: 180,
      maxWidth: 350,
      flex: 2,
      filterValueGetter: (params) => {
        const bundle = params.data;
        if (!bundle) return '';
        // Combine both names for filtering to work with Arabic and English
        return `${bundle.name_en || ''} ${bundle.name || ''}`.trim();
      },
      cellRenderer: (params) => {
        const bundle = params.data;
        if (!bundle) return null;
        const nameEn = bundle.name_en || bundle.name;
        const nameAr = bundle.name;
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
      headerName: 'Type',
      field: 'type',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: TypeFloatingFilter,
      suppressFloatingFilterButton: true,
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      cellRenderer: (params) => (
        <span style={{
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: '#dbeafe',
          color: '#1e40af'
        }}>
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Price',
      field: 'price',
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 90,
      minWidth: 70,
      maxWidth: 110,
      cellRenderer: (params) => {
        const bundle = params.data;
        if (!bundle) return null;
        return (
          <span style={{
            fontWeight: '500',
            color: bundle.discount > 0 ? '#94a3b8' : '#1e293b',
            textDecoration: bundle.discount > 0 ? 'line-through' : 'none'
          }}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Discount',
      field: 'discount',
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 90,
      minWidth: 70,
      maxWidth: 110,
      cellRenderer: (params) => {
        if (!params.value || params.value === 0) {
          return <span style={{ color: '#94a3b8' }}>—</span>;
        }
        return (
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            background: '#fef3c7',
            color: '#92400e'
          }}>
            {params.value}%
          </span>
        );
      }
    },
    {
      headerName: 'Final Price',
      field: 'finalPrice',
      valueGetter: (params) => {
        const bundle = params.data;
        if (!bundle) return 0;
        return formatPrice(bundle.price, bundle.discount);
      },
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      cellRenderer: (params) => {
        const bundle = params.data;
        if (!bundle) return null;
        return (
          <span style={{
            fontWeight: '700',
            color: bundle.discount > 0 ? '#16a34a' : '#1e293b'
          }}>
            {params.value}
          </span>
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
      width: 150,
      minWidth: 140,
      maxWidth: 170,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const bundle = params.data;
        if (!bundle) return null;
        return (
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={() => handleViewDetails(bundle.id)}
              style={{
                padding: '0.375rem',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="View Details"
            >
              <Eye size={14} style={{ color: '#64748b' }} />
            </button>
            <button
              onClick={() => handleEditBundle(bundle)}
              disabled={bundle.is_active}
              style={{
                padding: '0.375rem',
                background: bundle.is_active ? '#f8fafc' : '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                cursor: bundle.is_active ? 'not-allowed' : 'pointer',
                display: 'flex',
                opacity: bundle.is_active ? 0.5 : 1
              }}
              title={bundle.is_active ? "Deactivate to edit" : "Edit"}
            >
              <Pencil size={14} style={{ color: '#64748b' }} />
            </button>
            <ActivateToggleButton
              isActive={bundle.is_active}
              onToggle={() => handleToggleActivation(bundle.id, bundle.is_active)}
              entityName="bundle"
            />
            <button
              onClick={() => handleDeleteClick(bundle)}
              disabled={bundle.is_active}
              style={{
                padding: '0.375rem',
                background: bundle.is_active ? '#f8fafc' : '#fef2f2',
                border: `1px solid ${bundle.is_active ? '#e2e8f0' : '#fecaca'}`,
                borderRadius: '0.375rem',
                cursor: bundle.is_active ? 'not-allowed' : 'pointer',
                display: 'flex',
                opacity: bundle.is_active ? 0.5 : 1
              }}
              title={bundle.is_active ? "Deactivate to delete" : "Delete"}
            >
              <Trash2 size={14} style={{ color: bundle.is_active ? '#94a3b8' : '#dc2626' }} />
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
    <div className="bundles-list">
      {/* Header */}
      <div className="bl-header">
        <div className="bl-header-left">
          <div className="bl-header-icon">
            <Package size={24} />
          </div>
          <div>
            <h1 className="bl-title">Bundles Management</h1>
            <p className="bl-subtitle">
              {selectedSubject?.grade?.name
                ? `Managing bundles for ${selectedSubject.grade.name}`
                : 'Select a grade to manage bundles'}
            </p>
          </div>
        </div>
        <div className="bl-header-actions">
          <button
            className="bl-btn bl-btn-secondary"
            onClick={fetchBundles}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            className="bl-btn bl-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Add Bundle
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bl-stats">
        <StatCard
          icon={BarChart3}
          label="Total Bundles"
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
        <StatCard
          icon={DollarSign}
          label="Total Value"
          value={stats.totalValue}
          color="#0891b2"
          bgColor="#ecfeff"
          borderColor="#a5f3fc"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bl-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* AG Grid Data Table */}
      <div className="bl-grid-container">
        <div className="ag-theme-quartz bl-grid">
          <AgGridReact
            ref={gridRef}
            rowData={bundles}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            animateRows={false}
            enableCellTextSelection={true}
            getRowId={(params) => params.data?.id}
            onGridReady={onGridReady}
            onFilterChanged={onFilterChanged}
            loading={loading}
            suppressNoRowsOverlay={false}
            overlayLoadingTemplate={`
              <div style="padding: 40px; text-align: center;">
                <div style="font-size: 16px; font-weight: 500; color: #64748b;">Loading bundles...</div>
              </div>
            `}
            overlayNoRowsTemplate={`
              <div style="padding: 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">No bundles found</div>
                <div style="font-size: 14px; color: #64748b;">Try adjusting your filters or create a new bundle</div>
              </div>
            `}
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateBundleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBundleCreated}
        />
      )}

      {showEditModal && selectedBundle && (
        <EditBundleModal
          bundle={selectedBundle}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBundle(null);
          }}
          onSuccess={handleBundleUpdated}
        />
      )}

      {showDetailsModal && selectedBundle && (
        <BundleDetailsModal
          bundle={selectedBundle}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBundle(null);
          }}
        />
      )}

      {showDeleteDialog && bundleToDelete && (
        <ConfirmDialog
          title="Delete Bundle"
          message={`Are you sure you want to delete "${bundleToDelete.name}"? This will deactivate the bundle (soft delete).`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      <style>{`
        .bundles-list {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .bl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(to right, #f8fafc, #ffffff);
        }

        .bl-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bl-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .bl-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .bl-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .bl-header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .bl-btn {
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

        .bl-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bl-btn-primary {
          background: linear-gradient(135deg, var(--primary), #6366f1);
          color: white;
        }

        .bl-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .bl-btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .bl-btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .bl-stats {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          flex-wrap: wrap;
        }

        .bl-error {
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

        .bl-error button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          padding: 0.25rem;
        }

        .bl-grid-container {
          padding: 0 1.5rem 1.5rem;
        }

        .bl-grid {
          height: 550px;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .bl-grid-loading {
          height: 550px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .bl-grid-loading p {
          margin-top: 1rem;
          color: #64748b;
        }

        .bl-empty-state {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .bl-empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 1rem 0 0.5rem;
        }

        .bl-empty-state p {
          color: #64748b;
          margin: 0 0 1.5rem;
        }

        @media (max-width: 768px) {
          .bl-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .bl-stats {
            flex-direction: column;
          }

          .bl-grid {
            height: calc(100vh - 350px);
            min-height: 300px;
          }

          .bl-grid-loading {
            height: calc(100vh - 350px);
            min-height: 300px;
          }

          .bl-grid-container {
            padding: 0 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default BundlesList;
