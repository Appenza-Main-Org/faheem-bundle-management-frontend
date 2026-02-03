import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Ticket, Plus, AlertCircle, Loader2, Package, Filter,
  Copy, Check, Download, RefreshCw,
  BarChart3, CheckCircle2, XCircle, Clock, X
} from 'lucide-react';
import { vouchersApi, bundlesApi } from '../services/api';
import { useSubject } from '../context/SubjectContext';
import { useToast } from '../context/ToastContext';
import ActivateToggleButton from './ActivateToggleButton';
import StatusBadge from './StatusBadge';
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
      className="vm-status-filter"
    >
      <option value="">All Status</option>
      <option value="Available">Available</option>
      <option value="Used">Used</option>
      <option value="Inactive">Inactive</option>
    </select>
  );
});

function VouchersManager() {
  const { selectedSubject } = useSubject();
  const { showSuccess, showError } = useToast();
  const gridRef = useRef(null);

  // Bundle selection state
  const [bundles, setBundles] = useState([]);
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [loadingBundles, setLoadingBundles] = useState(false);

  // Vouchers state
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 0
  });

  // Stats state (from server)
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    used: 0,
    inactive: 0
  });

  // Generate vouchers state
  const [voucherCount, setVoucherCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generateBundleId, setGenerateBundleId] = useState('');
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [showCancelGenerateConfirm, setShowCancelGenerateConfirm] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Status filter state (null = all statuses, no filter)
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Selection state
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkOperating, setBulkOperating] = useState(false);

  // Server-side filtering state
  const [serverFilters, setServerFilters] = useState({});
  const filterTimeoutRef = useRef(null);
  const filterModelRef = useRef(null);

  // Copy state - use ref to avoid columnDefs recreation
  const [copiedCode, setCopiedCode] = useState(null);
  const copiedCodeRef = useRef(null);

  // Fetch bundles when subject changes
  useEffect(() => {
    if (selectedSubject?.grade?.id) {
      fetchBundles();
    } else {
      setBundles([]);
      setSelectedBundleId('');
    }
  }, [selectedSubject?.grade?.id]);

  // Fetch vouchers and stats when bundles are loaded, bundle selection, status filter, or server filters change
  useEffect(() => {
    if (selectedSubject?.grade?.id && bundles.length > 0) {
      fetchAllVouchers(1, pagination.pageSize, selectedStatus);
      fetchStats();
    } else if (!selectedSubject?.grade?.id) {
      setVouchers([]);
      setPagination({ currentPage: 1, pageSize: 20, totalRecords: 0, totalPages: 0 });
      setStats({ total: 0, available: 0, used: 0, inactive: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject?.grade?.id, selectedBundleId, selectedStatus, bundles.length, serverFilters]);

  const fetchBundles = async () => {
    try {
      setLoadingBundles(true);
      const response = await bundlesApi.getAll(1, 1000, selectedSubject.grade.id);
      const bundleData = response.data?.data?.bundles || response.data?.data || [];
      setBundles(bundleData);
    } catch (err) {
      console.error('Failed to fetch bundles:', err);
      showError('Failed to load bundles');
    } finally {
      setLoadingBundles(false);
    }
  };

  const fetchAllVouchers = useCallback(async (page = 1, pageSize = 20, status = undefined) => {
    if (!selectedSubject?.grade?.id) return;

    try {
      setLoading(true);
      setError(null);

      const getBundleDisplayName = (bundle) => {
        if (!bundle) return 'Unknown Bundle';
        return bundle.name_en || bundle.name || 'Unknown Bundle';
      };

      const statusToUse = status !== undefined ? status : selectedStatus;

      const response = await vouchersApi.getByGrade(
        selectedSubject.grade.id,
        selectedBundleId || null,
        statusToUse,
        page,
        pageSize,
        serverFilters
      );

      const responseData = response.data?.data || {};
      const voucherData = responseData.vouchers || [];
      const paginationData = responseData.pagination || {};

      // Create a map of bundles for quick lookup (use current bundles state)
      const bundleMap = new Map(bundles.map(b => [b.id, b]));

      const processedVouchers = voucherData.map(v => {
        const bundle = bundleMap.get(v.bundle_id);
        return {
          ...v,
          bundleName: getBundleDisplayName(bundle),
          bundleNameAr: bundle?.name || '',
          bundleNameEn: bundle?.name_en || ''
        };
      });

      setVouchers(processedVouchers);
      setPagination({
        currentPage: paginationData.currentPage || page,
        pageSize: paginationData.pageSize || pageSize,
        totalRecords: paginationData.totalRecords || 0,
        totalPages: paginationData.totalPages || 0
      });
    } catch (err) {
      setError('Failed to load vouchers. Please try again.');
      console.error('Failed to fetch vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject?.grade?.id, selectedBundleId, selectedStatus, bundles, serverFilters]);

  // Fetch stats from server
  const fetchStats = useCallback(async () => {
    if (!selectedSubject?.grade?.id) {
      setStats({ total: 0, available: 0, used: 0, inactive: 0 });
      return;
    }

    try {
      if (selectedBundleId) {
        // Fetch stats for specific bundle
        const response = await vouchersApi.getBundleStats(selectedBundleId);
        const data = response.data?.data;
        if (data) {
          setStats({
            total: data.total_vouchers || 0,
            available: data.available_vouchers || 0,
            used: data.used_vouchers || 0,
            inactive: data.inactive_vouchers || 0
          });
        }
      } else {
        // Fetch stats for all bundles in grade
        const response = await vouchersApi.getGradeStats(selectedSubject.grade.id);
        const data = response.data?.data;
        if (data) {
          setStats({
            total: data.total_vouchers || 0,
            available: data.available_vouchers || 0,
            used: data.used_vouchers || 0,
            inactive: data.inactive_vouchers || 0
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [selectedSubject?.grade?.id, selectedBundleId]);

  // Copy to clipboard
  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      copiedCodeRef.current = code;
      setCopiedCode(code);
      showSuccess('Code copied to clipboard');
      setTimeout(() => {
        copiedCodeRef.current = null;
        setCopiedCode(null);
      }, 2000);
    } catch (err) {
      showError('Failed to copy');
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate vouchers
  const handleGenerate = async () => {
    if (!generateBundleId || voucherCount < 1) {
      showError('Please select a bundle first');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      await bundlesApi.generateVouchers(generateBundleId, voucherCount);
      showSuccess(`Successfully generated ${voucherCount} vouchers`);
      setShowGeneratePanel(false);
      setGenerateBundleId('');
      setVoucherCount(10);
      fetchAllVouchers(1, pagination.pageSize, selectedStatus);
      fetchStats();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to generate vouchers');
    } finally {
      setGenerating(false);
    }
  };

  // Cancel generate panel
  const handleCancelGenerate = () => {
    if (generateBundleId || voucherCount !== 10) {
      setShowCancelGenerateConfirm(true);
    } else {
      setShowGeneratePanel(false);
    }
  };

  const handleConfirmCancelGenerate = () => {
    setShowGeneratePanel(false);
    setGenerateBundleId('');
    setVoucherCount(10);
    setShowCancelGenerateConfirm(false);
  };

  // Export all filtered vouchers to Excel (server-side)
  const handleExportAll = async () => {
    if (!selectedSubject?.grade?.id) return;

    try {
      setExporting(true);
      // Use selectedBundleId for filtering - null means all bundles
      const bundleGuids = selectedBundleId ? [selectedBundleId] : null;
      const response = await vouchersApi.exportToExcel(
        selectedSubject.grade.id,
        bundleGuids,
        null,
        null,
        null
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const bundleSuffix = selectedBundleId ? `bundle_${selectedBundleId.substring(0, 8)}` : 'all_bundles';
      link.download = `vouchers_${bundleSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const exportType = selectedBundleId ? 'bundle' : 'all';
      showSuccess(`Exported ${exportType} vouchers successfully`);
    } catch (err) {
      showError('Failed to export vouchers');
    } finally {
      setExporting(false);
    }
  };

  // Export current page data to CSV (client-side)
  const handleExportCurrentPage = () => {
    if (vouchers.length === 0) {
      showError('No vouchers to export');
      return;
    }

    // Build CSV content
    const headers = ['Bundle Name (EN)', 'Bundle Name (AR)', 'Voucher Code', 'Status', 'Created At', 'Used At'];
    const rows = vouchers.map(v => {
      const status = v.used_at ? 'Used' : (v.is_active === false ? 'Inactive' : 'Available');
      return [
        v.bundleNameEn || v.bundleName || '',
        v.bundleNameAr || '',
        v.code || '',
        status,
        v.created_at ? new Date(v.created_at).toLocaleString() : '',
        v.used_at ? new Date(v.used_at).toLocaleString() : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vouchers_page${pagination.currentPage}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(`Exported ${vouchers.length} vouchers from current page`);
  };

  // Toggle voucher active status
  const handleToggleActive = async (voucher) => {
    try {
      const newStatus = voucher.is_active === false;
      await vouchersApi.setVoucherActive(voucher.id, newStatus);
      showSuccess(`Voucher ${newStatus ? 'activated' : 'deactivated'}`);
      fetchAllVouchers(pagination.currentPage, pagination.pageSize, selectedStatus);
      fetchStats();
    } catch (err) {
      showError('Failed to update voucher status');
    }
  };

  // Bulk operations
  const handleBulkActivate = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Are you sure you want to activate ${selectedRows.length} voucher(s)?`)) return;

    try {
      setBulkOperating(true);
      const ids = selectedRows.map(r => r.id);
      await vouchersApi.bulkActivate(ids);
      showSuccess(`Successfully activated ${selectedRows.length} vouchers`);
      gridRef.current?.api?.deselectAll();
      fetchAllVouchers(pagination.currentPage, pagination.pageSize, selectedStatus);
      fetchStats();
    } catch (err) {
      showError('Failed to activate vouchers');
    } finally {
      setBulkOperating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Are you sure you want to deactivate ${selectedRows.length} voucher(s)?`)) return;

    try {
      setBulkOperating(true);
      const ids = selectedRows.map(r => r.id);
      await vouchersApi.bulkDeactivate(ids);
      showSuccess(`Successfully deactivated ${selectedRows.length} vouchers`);
      gridRef.current?.api?.deselectAll();
      fetchAllVouchers(pagination.currentPage, pagination.pageSize, selectedStatus);
      fetchStats();
    } catch (err) {
      showError('Failed to deactivate vouchers');
    } finally {
      setBulkOperating(false);
    }
  };

  const handleClearSelection = () => {
    gridRef.current?.api?.deselectAll();
    setSelectedRows([]);
  };

  // Status getter for filtering
  // Matches backend logic: IsActive == true means Available, otherwise Inactive
  const getStatus = (voucher) => {
    if (!voucher) return 'Available';
    if (voucher.used_at) return 'Used';
    if (voucher.is_active === true) return 'Available';
    return 'Inactive';
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Bundle',
      field: 'bundleName',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      minWidth: 180,
      maxWidth: 350,
      flex: 2,
      filterValueGetter: (params) => {
        const data = params.data;
        if (!data) return '';
        // Combine both names for filtering to work with Arabic and English
        return `${data.bundleNameEn || ''} ${data.bundleNameAr || ''} ${data.bundleName || ''}`.trim();
      },
      cellRenderer: (params) => {
        const data = params.data;
        if (!data) return null;
        const nameEn = data.bundleNameEn || data.bundleName;
        const nameAr = data.bundleNameAr;
        return (
          <div style={{ lineHeight: '1.3' }}>
            <div style={{ fontWeight: '500', color: '#1e293b' }}>{nameEn}</div>
            {nameAr && nameAr !== nameEn && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{nameAr}</div>
            )}
          </div>
        );
      },
      // Use bundleName (English) for sorting consistency
      comparator: (valueA, valueB) => {
        if (!valueA) return -1;
        if (!valueB) return 1;
        return valueA.localeCompare(valueB, 'en');
      }
    },
    {
      headerName: 'Voucher Code',
      field: 'code',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      minWidth: 200,
      maxWidth: 280,
      flex: 1,
      cellRenderer: 'voucherCodeRenderer'
    },
    {
      headerName: 'Status',
      field: 'status',
      valueGetter: (params) => getStatus(params.data),
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: StatusFloatingFilter,
      suppressFloatingFilterButton: true,
      width: 110,
      minWidth: 95,
      maxWidth: 125,
      cellRenderer: (params) => (
        <StatusBadge status={params.value} />
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
      headerName: 'Used At',
      field: 'used_at',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: DateFloatingFilter,
      suppressFloatingFilterButton: true,
      minWidth: 130,
      flex: 1,
      valueFormatter: (params) => formatDate(params.value),
      filterValueGetter: (params) => getLocalDateString(params.data?.used_at)
    },
    {
      headerName: 'Action',
      width: 80,
      minWidth: 70,
      maxWidth: 100,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const voucher = params.data;
        if (!voucher || voucher.used_at) return null;
        const isActive = voucher.is_active !== false;
        return (
          <ActivateToggleButton
            isActive={isActive}
            onToggle={() => handleToggleActive(voucher)}
            entityName="voucher"
            stopPropagation={true}
          />
        );
      }
    }
  ], [selectedStatus]);

  // Voucher Code Cell Renderer Component
  const VoucherCodeRenderer = useCallback((params) => {
    const voucher = params.data;
    if (!voucher) return null;

    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(voucher.code);
        setIsCopied(true);
        showSuccess('Code copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        showError('Failed to copy');
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <code style={{
          padding: '0.375rem 0.625rem',
          background: voucher.is_active === false ? '#fef2f2' : '#f0f9ff',
          borderRadius: '0.375rem',
          fontWeight: '600',
          fontSize: '0.8125rem',
          color: voucher.is_active === false ? '#9ca3af' : '#0369a1',
          textDecoration: voucher.is_active === false ? 'line-through' : 'none',
          letterSpacing: '0.025em',
          border: voucher.is_active === false ? '1px solid #fecaca' : '1px solid #bae6fd'
        }}>
          {voucher.code}
        </code>
        <button
          onClick={handleCopy}
          style={{
            padding: '0.375rem',
            background: isCopied ? '#dcfce7' : '#f8fafc',
            border: isCopied ? '1px solid #86efac' : '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            display: 'flex',
            transition: 'all 0.15s ease'
          }}
          title="Copy to clipboard"
        >
          {isCopied ? (
            <Check size={14} style={{ color: '#16a34a' }} />
          ) : (
            <Copy size={14} style={{ color: '#64748b' }} />
          )}
        </button>
      </div>
    );
  }, [showSuccess, showError]);

  // AG Grid components
  const components = useMemo(() => ({
    voucherCodeRenderer: VoucherCodeRenderer
  }), [VoucherCodeRenderer]);

  // AG Grid default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);

  // Selection changed callback
  const onSelectionChanged = useCallback(() => {
    const selected = gridRef.current?.api?.getSelectedRows() || [];
    setSelectedRows(selected);
  }, []);

  // Filter changed callback - send filters to server
  const onFilterChanged = useCallback((params) => {
    const filterModel = params.api.getFilterModel();
    // Store filter model to restore after data reload
    filterModelRef.current = filterModel;

    const newFilters = {};

    // Extract code filter from AG Grid filter model
    if (filterModel.code?.filter) {
      newFilters.code = filterModel.code.filter;
    }

    // Extract bundle name filter from AG Grid filter model
    if (filterModel.bundleName?.filter) {
      newFilters.bundleName = filterModel.bundleName.filter;
    }

    // Extract status filter from AG Grid filter model
    if (filterModel.status?.filter) {
      newFilters.status = filterModel.status.filter;
    }

    // Extract created_at date filter from AG Grid filter model
    if (filterModel.created_at?.filter) {
      newFilters.createdAt = filterModel.created_at.filter;
    }

    // Extract used_at date filter from AG Grid filter model
    if (filterModel.used_at?.filter) {
      newFilters.usedAt = filterModel.used_at.filter;
    }

    // Debounce the server request to avoid too many API calls
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
  }, [vouchers]);

  // Server-side pagination handlers
  const handlePageChange = useCallback((newPage) => {
    fetchAllVouchers(newPage, pagination.pageSize, selectedStatus);
  }, [pagination.pageSize, selectedStatus, fetchAllVouchers]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    fetchAllVouchers(1, newPageSize, selectedStatus);
  }, [selectedStatus, fetchAllVouchers]);

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
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="vouchers-manager">
      {/* Header */}
      <div className="vm-header">
        <div className="vm-header-left">
          <div className="vm-header-icon">
            <Ticket size={24} />
          </div>
          <div>
            <h1 className="vm-title">Voucher Management</h1>
            <p className="vm-subtitle">
              {selectedSubject?.grade?.name
                ? `Managing vouchers for ${selectedSubject.grade.name}`
                : 'Select a grade to manage vouchers'}
            </p>
          </div>
        </div>
        {selectedSubject?.grade?.id && bundles.length > 0 && (
          <div className="vm-header-actions">
            <button
              className="vm-btn vm-btn-secondary"
              onClick={() => { fetchAllVouchers(pagination.currentPage, pagination.pageSize, selectedStatus); fetchStats(); }}
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            <button
              className="vm-btn vm-btn-primary"
              onClick={() => setShowGeneratePanel(!showGeneratePanel)}
            >
              <Plus size={16} />
              Generate Vouchers
            </button>
          </div>
        )}
      </div>

      {!selectedSubject?.grade?.id ? (
        <div className="vm-empty-state">
          <AlertCircle size={48} style={{ color: '#f59e0b' }} />
          <h3>No Grade Selected</h3>
          <p>Please select a grade from the sidebar to manage vouchers</p>
        </div>
      ) : loadingBundles ? (
        <div className="vm-loading-state">
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
          <p>Loading bundles...</p>
        </div>
      ) : bundles.length === 0 ? (
        <div className="vm-empty-state">
          <Package size={48} style={{ color: '#94a3b8' }} />
          <h3>No Bundles Found</h3>
          <p>Create bundles first to generate vouchers</p>
        </div>
      ) : (
        <>
          {/* Generate Vouchers Panel */}
          {showGeneratePanel && (
            <div className="vm-generate-panel">
              <div className="vm-generate-header">
                <h3><Plus size={18} /> Generate New Vouchers</h3>
                <button className="vm-close-btn" onClick={handleCancelGenerate}>
                  <X size={18} />
                </button>
              </div>
              <div className="vm-generate-body">
                <div className="vm-form-group">
                  <label>Select Bundle</label>
                  <select
                    className="vm-select"
                    value={generateBundleId}
                    onChange={(e) => setGenerateBundleId(e.target.value)}
                  >
                    <option value="">-- Choose a bundle --</option>
                    {bundles.filter(b => b.is_active !== false).map((bundle) => (
                      <option key={bundle.id} value={bundle.id}>
                        {bundle.name || bundle.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vm-form-group">
                  <label>Number of Vouchers</label>
                  <input
                    type="number"
                    className="vm-input"
                    value={voucherCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setVoucherCount('');
                      } else {
                        const num = parseInt(val);
                        if (!isNaN(num)) {
                          setVoucherCount(Math.min(1000, num));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const num = parseInt(e.target.value);
                      if (isNaN(num) || num < 1) {
                        setVoucherCount(1);
                      }
                    }}
                    min="1"
                    max="1000"
                  />
                  <span className="vm-hint">Generate between 1 and 1000 vouchers</span>
                </div>
                <button
                  className="vm-btn vm-btn-success vm-generate-btn"
                  onClick={handleGenerate}
                  disabled={generating || !generateBundleId || !voucherCount || voucherCount < 1}
                  style={{
                    opacity: (!generateBundleId || !voucherCount || voucherCount < 1) && !generating ? 0.6 : 1,
                    cursor: (!generateBundleId || !voucherCount || voucherCount < 1) && !generating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Generate {voucherCount} Voucher{voucherCount > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="vm-stats">
            <StatCard
              icon={BarChart3}
              label="Total Vouchers"
              value={stats.total}
              color="#6366f1"
              bgColor="#eef2ff"
              borderColor="#c7d2fe"
            />
            <StatCard
              icon={CheckCircle2}
              label="Available"
              value={stats.available}
              color="#16a34a"
              bgColor="#f0fdf4"
              borderColor="#bbf7d0"
            />
            <StatCard
              icon={XCircle}
              label="Used"
              value={stats.used}
              color="#dc2626"
              bgColor="#fef2f2"
              borderColor="#fecaca"
            />
            <StatCard
              icon={Clock}
              label="Inactive"
              value={stats.inactive}
              color="#64748b"
              bgColor="#f8fafc"
              borderColor="#e2e8f0"
            />
          </div>

          {/* Toolbar */}
          <div className="vm-toolbar">
            <div className="vm-toolbar-left">
              <div className="vm-filter-group">
                <Filter size={16} style={{ color: '#64748b' }} />
                <select
                  className="vm-select"
                  value={selectedBundleId}
                  onChange={(e) => setSelectedBundleId(e.target.value)}
                  disabled={loadingBundles}
                >
                  <option value="">All Bundles ({bundles.length})</option>
                  {bundles.map((bundle) => (
                    <option key={bundle.id} value={bundle.id}>
                      {bundle.name || bundle.name_en} {bundle.is_active === false ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vm-toolbar-right">
              {/* Selection Actions */}
              {selectedRows.length > 0 && (
                <div className="vm-selection-bar">
                  <span className="vm-selection-count">
                    {selectedRows.length} selected
                  </span>
                  <button
                    className="vm-btn vm-btn-success vm-btn-sm"
                    onClick={handleBulkActivate}
                    disabled={bulkOperating}
                  >
                    <Power size={14} />
                    Activate
                  </button>
                  <button
                    className="vm-btn vm-btn-danger vm-btn-sm"
                    onClick={handleBulkDeactivate}
                    disabled={bulkOperating}
                  >
                    <PowerOff size={14} />
                    Deactivate
                  </button>
                  <button
                    className="vm-btn vm-btn-ghost vm-btn-sm"
                    onClick={handleClearSelection}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <button
                className="vm-btn vm-btn-secondary"
                onClick={handleExportAll}
                disabled={exporting || pagination.totalRecords === 0}
                title={selectedBundleId ? 'Export selected bundle vouchers' : 'Export all bundles vouchers'}
              >
                {exporting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Download size={16} />
                )}
                {selectedBundleId ? 'Export Bundle' : 'Export All'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="vm-error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}

          {/* AG Grid Data Table */}
          <div className="vm-grid-container">
            <div className="ag-theme-quartz vm-grid">
              <AgGridReact
                ref={gridRef}
                rowData={vouchers}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                components={components}
                rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true, enableClickSelection: false }}
                onSelectionChanged={onSelectionChanged}
                onGridReady={onGridReady}
                onFilterChanged={onFilterChanged}
                pagination={false}
                animateRows={false}
                enableCellTextSelection={true}
                getRowId={(params) => params.data?.id}
                maintainColumnOrder={true}
                loading={loading}
                suppressNoRowsOverlay={false}
                overlayLoadingTemplate={`
                  <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 16px; font-weight: 500; color: #64748b;">Loading vouchers...</div>
                  </div>
                `}
                overlayNoRowsTemplate={`
                  <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎟️</div>
                    <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">No vouchers found</div>
                    <div style="font-size: 14px; color: #64748b;">Try adjusting your filters or generate new vouchers</div>
                  </div>
                `}
              />
            </div>
            {/* Server-side Pagination Controls */}
            {pagination.totalRecords > 0 && (
                  <div className="vm-pagination">
                    <div className="vm-pagination-left">
                      <div className="vm-pagination-info">
                        Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords.toLocaleString()} vouchers
                      </div>
                      <button
                        className="vm-btn vm-btn-sm vm-btn-outline"
                        onClick={handleExportCurrentPage}
                        disabled={vouchers.length === 0}
                        title="Export current page to CSV"
                      >
                        <Download size={14} />
                        Export Page
                      </button>
                    </div>
                    <div className="vm-pagination-controls">
                      <select
                        className="vm-pagination-select"
                        value={pagination.pageSize}
                        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                      >
                        <option value="10">10 / page</option>
                        <option value="20">20 / page</option>
                        <option value="50">50 / page</option>
                        <option value="100">100 / page</option>
                      </select>
                      <button
                        className="vm-pagination-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1 || loading}
                        title="First page"
                      >
                        ««
                      </button>
                      <button
                        className="vm-pagination-btn"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1 || loading}
                        title="Previous page"
                      >
                        «
                      </button>
                      <span className="vm-pagination-pages">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        className="vm-pagination-btn"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPages || loading}
                        title="Next page"
                      >
                        »
                      </button>
                      <button
                        className="vm-pagination-btn"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage >= pagination.totalPages || loading}
                        title="Last page"
                      >
                        »»
                      </button>
                    </div>
                  </div>
                )}
          </div>
        </>
      )}

      {/* Cancel Generate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelGenerateConfirm}
        onClose={() => setShowCancelGenerateConfirm(false)}
        onConfirm={handleConfirmCancelGenerate}
        title="Cancel Generation"
        message="Are you sure you want to cancel? Your selection will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue"
        type="warning"
      />

      <style>{`
        .vouchers-manager {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .vm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(to right, #f8fafc, #ffffff);
        }

        .vm-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .vm-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .vm-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .vm-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .vm-header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .vm-btn {
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

        .vm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vm-btn-primary {
          background: linear-gradient(135deg, var(--primary), #6366f1);
          color: white;
        }

        .vm-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .vm-btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .vm-btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .vm-btn-success {
          background: #16a34a;
          color: white;
        }

        .vm-btn-success:hover:not(:disabled) {
          background: #15803d;
        }

        .vm-btn-danger {
          background: #dc2626;
          color: white;
        }

        .vm-btn-danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        .vm-btn-ghost {
          background: transparent;
          color: #64748b;
        }

        .vm-btn-ghost:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .vm-btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
        }

        .vm-btn-lg {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }

        .vm-empty-state, .vm-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .vm-empty-state h3, .vm-loading-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 1rem 0 0.5rem;
        }

        .vm-empty-state p, .vm-loading-state p {
          color: #64748b;
          margin: 0;
        }

        .vm-generate-panel {
          margin: 1.5rem;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border-radius: 0.75rem;
          border: 1px solid #86efac;
        }

        .vm-generate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #bbf7d0;
        }

        .vm-generate-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #166534;
          margin: 0;
        }

        .vm-close-btn {
          background: none;
          border: none;
          padding: 0.375rem;
          cursor: pointer;
          color: #64748b;
          border-radius: 0.375rem;
        }

        .vm-close-btn:hover {
          background: #dcfce7;
          color: #166534;
        }

        .vm-generate-body {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .vm-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          min-width: 180px;
        }

        .vm-form-group label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #166534;
        }

        .vm-select, .vm-input {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #bbf7d0;
          border-radius: 0.5rem;
          background: white;
          width: 100%;
          height: 38px;
        }

        .vm-select:focus, .vm-input:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .vm-hint {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: -0.25rem;
        }

        .vm-generate-btn {
          height: 38px;
          margin-top: 1.375rem;
          white-space: nowrap;
          padding: 0 1.25rem;
          flex-shrink: 0;
        }

        .vm-stats {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          flex-wrap: wrap;
        }

        .vm-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem 1rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .vm-toolbar-left, .vm-toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .vm-filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .vm-selection-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #dbeafe;
          border-radius: 0.5rem;
          border: 1px solid #93c5fd;
        }

        .vm-selection-count {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e40af;
          padding-right: 0.5rem;
          border-right: 1px solid #93c5fd;
        }

        .vm-error {
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

        .vm-error button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          padding: 0.25rem;
        }

        .vm-grid-container {
          padding: 0 1.5rem 1.5rem;
        }

        .vm-grid {
          height: 550px;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        /* Status filter dropdown styling */
        .vm-status-filter {
          width: 100%;
          height: 28px;
          padding: 0 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          background-color: white;
          cursor: pointer;
          color: #334155;
          transition: all 0.15s ease;
        }

        .vm-status-filter:hover {
          border-color: #94a3b8;
        }

        .vm-status-filter:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        /* AG Grid floating filter styling improvements */
        .vm-grid .ag-floating-filter-input {
          border: 1px solid #cbd5e1 !important;
          border-radius: 0.375rem !important;
          padding: 0 0.5rem !important;
          font-size: 0.8125rem !important;
          height: 28px !important;
          transition: all 0.15s ease !important;
        }

        .vm-grid .ag-floating-filter-input:hover {
          border-color: #94a3b8 !important;
        }

        .vm-grid .ag-floating-filter-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          outline: none !important;
        }

        .vm-grid .ag-floating-filter {
          padding: 0.375rem 0.5rem !important;
        }

        .vm-grid .ag-header-cell {
          background: #f8fafc;
        }

        .vm-grid .ag-header-cell-label {
          font-weight: 600;
          color: #475569;
        }

        .vm-grid .ag-row:hover {
          background-color: #f1f5f9 !important;
        }

        .vm-grid .ag-row-selected {
          background-color: #dbeafe !important;
        }

        .vm-grid .ag-row-selected:hover {
          background-color: #bfdbfe !important;
        }

        .vm-grid-loading {
          height: 550px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .vm-grid-loading p {
          margin-top: 1rem;
          color: #64748b;
        }

        .vm-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 0.75rem 0.75rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .vm-pagination-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .vm-pagination-info {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .vm-btn-outline {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .vm-btn-outline:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .vm-pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .vm-pagination-select {
          padding: 0.375rem 0.5rem;
          font-size: 0.8125rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          background: white;
          cursor: pointer;
        }

        .vm-pagination-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .vm-pagination-btn {
          padding: 0.375rem 0.625rem;
          font-size: 0.875rem;
          font-weight: 500;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          cursor: pointer;
          color: #475569;
          transition: all 0.15s ease;
        }

        .vm-pagination-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .vm-pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .vm-pagination-pages {
          font-size: 0.8125rem;
          color: #475569;
          padding: 0 0.5rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .vm-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .vm-generate-body {
            flex-direction: column;
            align-items: stretch;
          }

          .vm-form-group {
            min-width: 100%;
          }

          .vm-generate-btn {
            margin-top: 0.5rem;
            width: 100%;
            justify-content: center;
          }

          .vm-stats {
            flex-direction: column;
          }

          .vm-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .vm-toolbar-left, .vm-toolbar-right {
            width: 100%;
            flex-wrap: wrap;
          }

          .vm-grid {
            height: calc(100vh - 450px);
            min-height: 300px;
          }

          .vm-grid-loading {
            height: calc(100vh - 450px);
            min-height: 300px;
          }

          .vm-grid-container {
            padding: 0 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default VouchersManager;
