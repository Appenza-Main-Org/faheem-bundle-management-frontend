import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, Loader2, Package, Tag, Ticket, Layers, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { bundlesApi, subjectServicesApi, filtersApi } from '../services/api';
import { useSubject } from '../context/SubjectContext';
import ConfirmDialog from './ConfirmDialog';

// Inline error message component
const FieldError = ({ error }) => {
  if (!error) return null;
  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.75rem',
      color: '#dc2626',
      marginTop: '0.25rem'
    }}>
      <AlertCircle size={12} />
      {error}
    </span>
  );
};

function EditBundleModal({ bundle, onClose, onSuccess }) {
  const { selectedSubject } = useSubject();

  const [formData, setFormData] = useState({
    name: '',           // Arabic name
    name_en: '',        // English name
    description: '',    // Arabic description
    description_en: '', // English description
    imageUrl: '',
    price: '',
    discount: '0',
    type: 'Duration',
    expiryDays: '',
    startAt: '',
    expireAt: '',
    isActive: true,
  });

  // Multi-subject selection state
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectServices, setSubjectServices] = useState({}); // { subjectId: [services] }
  const [selectedServiceIds, setSelectedServiceIds] = useState([]); // All selected service IDs

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingServices, setLoadingServices] = useState({});
  const [loadingBundleDetails, setLoadingBundleDetails] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Collapse/expand state for each subject's services
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const toggleSubjectExpand = (subjectId) => {
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = selectedSubjects.every(s => expandedSubjects[s.id]);
    const newState = {};
    selectedSubjects.forEach(s => {
      newState[s.id] = !allExpanded;
    });
    setExpandedSubjects(newState);
  };

  // Fetch bundle details with relations to get existing subject services
  useEffect(() => {
    const fetchBundleDetails = async () => {
      if (!bundle?.id) return;

      try {
        setLoadingBundleDetails(true);
        const response = await bundlesApi.getById(bundle.id);
        const bundleData = response.data.data;

        // Format dates for date input (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        // Set form data - bundleData is the BundleDto directly (not nested under .bundle)
        setFormData({
          name: bundleData.name || '',
          name_en: bundleData.name_en || '',
          description: bundleData.description || '',
          description_en: bundleData.description_en || '',
          imageUrl: bundleData.image_Url || bundleData.imageUrl || '',
          price: bundleData.price?.toString() || '',
          discount: bundleData.discount?.toString() || '0',
          type: bundleData.type || 'Duration',
          expiryDays: bundleData.expiryDays?.toString() || '',
          startAt: formatDateForInput(bundleData.startAt),
          expireAt: formatDateForInput(bundleData.expireAt),
        });

        // Extract existing subject service IDs from bundle_subjectservice table
        // These are the services currently assigned to this bundle
        const subjectServicesList = bundleData.subjectServices || [];
        const existingServiceIds = subjectServicesList.map(service => {
          // The subject_service_id is the ID in the subject_service table
          return service.subject_service_id || service.id;
        });
        setSelectedServiceIds(existingServiceIds);

        // Identify which subjects have services in this bundle
        const subjectGroups = {};
        const subjectIdsToFetch = new Set();

        subjectServicesList.forEach(service => {
          const subjectId = service.subject_id;
          subjectIdsToFetch.add(subjectId);

          if (!subjectGroups[subjectId]) {
            subjectGroups[subjectId] = {
              id: subjectId,
              name: service.subject_name
            };
          }
        });

        setSelectedSubjects(Object.values(subjectGroups));

        // Set all subjects as expanded by default
        const expandedState = {};
        subjectIdsToFetch.forEach(id => {
          expandedState[id] = true;
        });
        setExpandedSubjects(expandedState);

        // Fetch ALL available services for each subject (not just the selected ones)
        // This will populate the service checkboxes with all options
        for (const subjectId of subjectIdsToFetch) {
          fetchSubjectServices(subjectId);
        }
      } catch (err) {
        setError('Failed to load bundle details');
        console.error('Error fetching bundle details:', err);
      } finally {
        setLoadingBundleDetails(false);
      }
    };

    fetchBundleDetails();
  }, [bundle]);

  // Fetch available subjects for the selected grade
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedSubject?.grade?.id) {
        setError('No grade selected. Please select a grade first.');
        return;
      }

      try {
        setLoadingSubjects(true);
        const response = await filtersApi.getSubjects(selectedSubject.grade.id);
        setAvailableSubjects(response.data.data || []);
      } catch (err) {
        setError('Failed to load subjects');
        console.error('Error fetching subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selectedSubject]);

  // Fetch services when a subject is selected
  const fetchSubjectServices = async (subjectId, force = false) => {
    if (!force && subjectServices[subjectId]) {
      // Already loaded, skip
      return;
    }

    try {
      setLoadingServices(prev => ({ ...prev, [subjectId]: true }));
      const response = await subjectServicesApi.getBySubject(subjectId);
      // Ensure services have consistent ID format
      const services = (response.data.data || []).map(service => ({
        ...service,
        // Make sure id field is consistent - use the service's id field as primary
        id: service.id,
        subject_service_id: service.id, // For consistency with existing bundle services
      }));
      setSubjectServices(prev => ({
        ...prev,
        [subjectId]: services
      }));
    } catch (err) {
      console.error(`Error fetching services for subject ${subjectId}:`, err);
    } finally {
      setLoadingServices(prev => ({ ...prev, [subjectId]: false }));
    }
  };

  const handleSubjectToggle = (subject) => {
    const isSelected = selectedSubjects.find(s => s.id === subject.id);

    if (isSelected) {
      // Remove subject and its services
      setSelectedSubjects(prev => prev.filter(s => s.id !== subject.id));
      // Use id as the primary identifier for services
      const subjectServiceIds = (subjectServices[subject.id] || []).map(s => s.id);
      setSelectedServiceIds(prev => prev.filter(id => !subjectServiceIds.includes(id)));
      // Collapse when deselecting
      setExpandedSubjects(prev => ({ ...prev, [subject.id]: false }));
    } else {
      // Add subject and fetch its services
      setSelectedSubjects(prev => [...prev, subject]);
      fetchSubjectServices(subject.id);
      // Auto-expand when selecting
      setExpandedSubjects(prev => ({ ...prev, [subject.id]: true }));
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const toggleSelectAllForSubject = (subjectId) => {
    const services = subjectServices[subjectId] || [];
    // Use id as the primary identifier
    const serviceIds = services.map(s => s.id);
    const allSelected = serviceIds.every(id => selectedServiceIds.includes(id));

    if (allSelected) {
      // Deselect all services for this subject
      setSelectedServiceIds(prev => prev.filter(id => !serviceIds.includes(id)));
    } else {
      // Select all services for this subject
      setSelectedServiceIds(prev => [...new Set([...prev, ...serviceIds])]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name);
  };

  // Validate a single field
  const validateField = (fieldName) => {
    let error = null;

    switch (fieldName) {
      case 'name':
        if (!formData.name.trim()) error = 'Arabic name is required';
        break;
      case 'description':
        if (!formData.description.trim()) error = 'Arabic description is required';
        break;
      case 'price':
        if (!formData.price) error = 'Price is required';
        else if (parseFloat(formData.price) < 0) error = 'Price must be positive';
        break;
      case 'discount':
        const discountVal = parseInt(formData.discount || '0');
        if (discountVal < 0 || discountVal > 100) error = 'Discount must be between 0 and 100';
        break;
      case 'expiryDays':
        if (formData.type === 'ExpiryDays' && (!formData.expiryDays || parseInt(formData.expiryDays) < 1)) {
          error = 'Expiry days is required (minimum 1)';
        }
        break;
      case 'startAt':
        if (formData.type === 'Duration' && !formData.startAt) {
          error = 'Start date is required';
        }
        break;
      case 'expireAt':
        if (formData.type === 'Duration') {
          if (!formData.expireAt) {
            error = 'Expiration date is required';
          } else if (formData.startAt && new Date(formData.expireAt) <= new Date(formData.startAt)) {
            error = 'Expiration must be after start date';
          }
        }
        break;
      default:
        break;
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    return error;
  };

  // Validate all fields and return errors object
  const validateAllFields = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Arabic name is required';
    if (!formData.description.trim()) errors.description = 'Arabic description is required';
    if (!formData.price) errors.price = 'Price is required';
    else if (parseFloat(formData.price) < 0) errors.price = 'Price must be positive';

    const discountVal = parseInt(formData.discount || '0');
    if (discountVal < 0 || discountVal > 100) errors.discount = 'Discount must be between 0 and 100';

    if (selectedSubjects.length === 0) errors.subjects = 'At least one subject must be selected';
    if (selectedServiceIds.length === 0) errors.services = 'At least one service must be selected';

    if (formData.type === 'ExpiryDays') {
      if (!formData.expiryDays || parseInt(formData.expiryDays) < 1) {
        errors.expiryDays = 'Expiry days is required (minimum 1)';
      }
    } else if (formData.type === 'Duration') {
      if (!formData.startAt) errors.startAt = 'Start date is required';
      if (!formData.expireAt) errors.expireAt = 'Expiration date is required';
      else if (formData.startAt && new Date(formData.expireAt) <= new Date(formData.startAt)) {
        errors.expireAt = 'Expiration must be after start date';
      }
    }

    return errors;
  };

  // Form validation check
  const isFormValid = () => {
    // Check required fields
    if (!formData.name || !formData.description || !formData.price) return false;
    if (selectedSubjects.length === 0) return false;
    if (selectedServiceIds.length === 0) return false;

    // Type-specific validation
    if (formData.type === 'ExpiryDays') {
      if (!formData.expiryDays || parseInt(formData.expiryDays) < 1) return false;
    } else if (formData.type === 'Duration') {
      if (!formData.startAt || !formData.expireAt) return false;
      const startDate = new Date(formData.startAt);
      const expireDate = new Date(formData.expireAt);
      if (expireDate <= startDate) return false;
    }

    // Discount validation
    const discountValue = parseInt(formData.discount || '0');
    if (discountValue < 0 || discountValue > 100) return false;

    return true;
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate all fields and show inline errors
    const errors = validateAllFields();
    setFieldErrors(errors);

    // If there are any errors, don't submit
    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show errors
      setTouched({
        name: true, description: true, price: true, discount: true,
        expiryDays: true, startAt: true, expireAt: true, subjects: true, services: true
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        name_en: formData.name_en,
        description: formData.description,
        description_en: formData.description_en,
        image_Url: formData.imageUrl,
        price: parseFloat(formData.price),
        discount: parseInt(formData.discount),
        type: formData.type,
        subjectServiceIds: selectedServiceIds
      };

      // Add type-specific fields
      if (formData.type === 'ExpiryDays') {
        payload.expiryDays = parseInt(formData.expiryDays);
        payload.startAt = null;
        payload.expireAt = null;
      } else if (formData.type === 'Duration') {
        const startDate = new Date(formData.startAt);
        startDate.setHours(0, 0, 0, 0);

        const expireDate = new Date(formData.expireAt);
        expireDate.setHours(0, 0, 0, 0);

        payload.startAt = startDate.toISOString();
        payload.expireAt = expireDate.toISOString();
        payload.expiryDays = null;
      }

      await bundlesApi.update(bundle.id, payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update bundle');
      console.error('Error updating bundle:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingBundleDetails) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '800px',
            width: '95%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem'
          }}
        >
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Loading bundle details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1000px',
          width: '95%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="modal-header" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem 0.5rem 0 0',
          marginBottom: '0'
        }}>
          <h2 className="modal-title" style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0
          }}>
            Edit Bundle - {selectedSubject?.grade?.name || 'Grade'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1
          }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                <CheckCircle size={18} />
                Bundle updated successfully!
              </div>
            )}

            {/* Basic Information Section */}
            <div style={{
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--gray-200)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Package size={20} style={{ color: 'var(--primary)' }} />
                Basic Information
              </h3>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Bundle Name (English)</label>
                  <input
                    type="text"
                    name="name_en"
                    className="form-input"
                    value={formData.name_en}
                    onChange={handleChange}
                    placeholder="Bundle name in English"
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Bundle Name (Arabic)</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="اسم الباقة بالعربية"
                    required
                    dir="rtl"
                    style={{
                      textAlign: 'right',
                      borderColor: fieldErrors.name ? '#dc2626' : undefined
                    }}
                  />
                  <FieldError error={fieldErrors.name} />
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Description (English)</label>
                  <textarea
                    name="description_en"
                    className="form-textarea"
                    value={formData.description_en}
                    onChange={handleChange}
                    placeholder="Bundle description in English..."
                    rows="3"
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Description (Arabic)</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="وصف الباقة بالعربية..."
                    required
                    rows="3"
                    dir="rtl"
                    style={{
                      textAlign: 'right',
                      borderColor: fieldErrors.description ? '#dc2626' : undefined
                    }}
                  />
                  <FieldError error={fieldErrors.description} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  className="form-input"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div style={{
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--gray-200)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Tag size={20} style={{ color: 'var(--primary)' }} />
                Pricing
              </h3>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label form-label-required">Price</label>
                  <input
                    type="number"
                    name="price"
                    className="form-input"
                    value={formData.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="0"
                    step="0.01"
                    required
                    style={{
                      borderColor: fieldErrors.price ? '#dc2626' : undefined
                    }}
                  />
                  <FieldError error={fieldErrors.price} />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    className="form-input"
                    value={formData.discount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="0"
                    max="100"
                    style={{
                      borderColor: fieldErrors.discount ? '#dc2626' : undefined
                    }}
                  />
                  <FieldError error={fieldErrors.discount} />
                </div>
              </div>
            </div>

            {/* Bundle Type Configuration Section */}
            <div style={{
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--gray-200)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Ticket size={20} style={{ color: 'var(--primary)' }} />
                Bundle Type & Configuration
              </h3>

              <div className="form-group">
                <label className="form-label form-label-required">Bundle Type</label>
                <select
                  name="type"
                  className="form-select"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Duration">Duration (Time-based access)</option>
                  <option value="ExpiryDays">Expiry Days (Days-based access)</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  Duration: Uses start/end dates | Expiry Days: Uses number of days after activation
                </p>
              </div>

              {formData.type === 'Duration' && (
                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Start Date</label>
                    <input
                      type="date"
                      name="startAt"
                      className="form-input"
                      value={formData.startAt}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      style={{
                        borderColor: fieldErrors.startAt ? '#dc2626' : undefined
                      }}
                    />
                    <FieldError error={fieldErrors.startAt} />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">Expiration Date</label>
                    <input
                      type="date"
                      name="expireAt"
                      className="form-input"
                      value={formData.expireAt}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      style={{
                        borderColor: fieldErrors.expireAt ? '#dc2626' : undefined
                      }}
                    />
                    <FieldError error={fieldErrors.expireAt} />
                  </div>
                </div>
              )}

              {formData.type === 'ExpiryDays' && (
                <div className="form-group">
                  <label className="form-label form-label-required">Expiry Days</label>
                  <input
                    type="number"
                    name="expiryDays"
                    className="form-input"
                    value={formData.expiryDays}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter number of days"
                    min="1"
                    required
                    style={{
                      borderColor: fieldErrors.expiryDays ? '#dc2626' : undefined
                    }}
                  />
                  <FieldError error={fieldErrors.expiryDays} />
                </div>
              )}
            </div>

            {/* Subjects Selection Section */}
            <div style={{
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--gray-200)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                <span>Select Subjects <span style={{ color: 'var(--danger)' }}>*</span></span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                Select subjects for {selectedSubject?.grade?.name}. Services will be loaded for selected subjects.
              </p>

              {loadingSubjects ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  color: 'var(--gray-500)'
                }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
                  Loading subjects...
                </div>
              ) : availableSubjects.length === 0 ? (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--gray-50)',
                  borderRadius: '0.375rem',
                  color: 'var(--gray-500)',
                  border: '1px dashed var(--gray-300)'
                }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--gray-400)' }} />
                  <p style={{ fontSize: '0.875rem' }}>No subjects available for this grade</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {availableSubjects.map((subject) => {
                    const isSelected = selectedSubjects.find(s => s.id === subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleSubjectToggle(subject)}
                        style={{
                          padding: '1rem',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--gray-300)'}`,
                          borderRadius: '0.5rem',
                          background: isSelected ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? 'var(--primary)' : 'var(--gray-700)'
                        }}
                      >
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSubjects.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: 'var(--primary)',
                  fontWeight: '500',
                  border: '1px solid #c7d2fe'
                }}>
                  ✓ {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                </div>
              )}
              <FieldError error={fieldErrors.subjects} />
            </div>

            {/* Subject Services Selection Section */}
            {selectedSubjects.length > 0 && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0
                  }}>
                    <Layers size={20} style={{ color: 'var(--primary)' }} />
                    <span>Select Services <span style={{ color: 'var(--danger)' }}>*</span></span>
                  </h3>

                  {/* Expand/Collapse All button */}
                  <button
                    type="button"
                    onClick={toggleExpandAll}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--primary)',
                      background: 'var(--gray-100)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {selectedSubjects.every(s => expandedSubjects[s.id]) ? (
                      <>
                        <ChevronDown size={14} />
                        Collapse All
                      </>
                    ) : (
                      <>
                        <ChevronRight size={14} />
                        Expand All
                      </>
                    )}
                  </button>
                </div>

                {selectedSubjects.map((subject) => {
                  const services = subjectServices[subject.id] || [];
                  const isLoading = loadingServices[subject.id];
                  const isExpanded = expandedSubjects[subject.id];
                  // Use id as the primary identifier
                  const subjectServiceIds = services.map(s => s.id);
                  const allSelected = subjectServiceIds.length > 0 &&
                                     subjectServiceIds.every(id => selectedServiceIds.includes(id));
                  const selectedCount = subjectServiceIds.filter(id => selectedServiceIds.includes(id)).length;

                  return (
                    <div key={subject.id} style={{
                      marginBottom: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      {/* Collapsible Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'var(--gray-50)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => toggleSubjectExpand(subject.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isExpanded ? (
                            <ChevronDown size={18} style={{ color: 'var(--gray-500)' }} />
                          ) : (
                            <ChevronRight size={18} style={{ color: 'var(--gray-500)' }} />
                          )}
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--gray-800)',
                            margin: 0
                          }}>
                            {subject.name}
                          </h4>
                          {services.length > 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: selectedCount > 0 ? '#16a34a' : 'var(--gray-500)',
                              background: selectedCount > 0 ? '#dcfce7' : 'var(--gray-200)',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              fontWeight: '500'
                            }}>
                              {selectedCount}/{services.length}
                            </span>
                          )}
                        </div>
                        {services.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectAllForSubject(subject.id);
                            }}
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              background: 'white',
                              border: '1px solid var(--primary)',
                              borderRadius: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        )}
                      </div>

                      {/* Collapsible Content */}
                      {isExpanded && (
                        <>
                          {isLoading ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '1rem',
                              color: 'var(--gray-500)',
                              background: 'white'
                            }}>
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
                              Loading services...
                            </div>
                          ) : services.length === 0 ? (
                            <div style={{
                              padding: '1rem',
                              background: 'white',
                              color: 'var(--gray-500)',
                              fontSize: '0.875rem'
                            }}>
                              No services available for this subject
                            </div>
                          ) : (
                            <div style={{ background: 'white' }}>
                              {services.map((service, index) => {
                                // Always use service.id as the primary identifier
                                const serviceId = service.id;
                                return (
                                  <label
                                    key={serviceId}
                                    className={`service-list-item ${selectedServiceIds.includes(serviceId) ? 'selected' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedServiceIds.includes(serviceId)}
                                      onChange={() => handleServiceToggle(serviceId)}
                                      style={{
                                        marginRight: '0.75rem',
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer'
                                      }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: '500', fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                                        {service.service_name || service.name}
                                      </div>
                                      {(service.service_description || service.description) && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                          {service.service_description || service.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {selectedServiceIds.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#16a34a',
                    fontWeight: '500',
                    border: '1px solid #86efac'
                  }}>
                    ✓ {selectedServiceIds.length} service{selectedServiceIds.length !== 1 ? 's' : ''} selected across {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
                  </div>
                )}
                <FieldError error={fieldErrors.services} />
              </div>
            )}
          </div>

          <div className="modal-footer" style={{
            background: 'var(--gray-50)',
            padding: '1.25rem 2rem',
            borderTop: '1px solid var(--gray-200)',
            borderRadius: '0 0 0.5rem 0.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
              style={{
                padding: '0.625rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || success || !isFormValid()}
              style={{
                padding: '0.625rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                background: loading || success || !isFormValid() ? undefined : 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                border: 'none',
                opacity: !isFormValid() && !loading && !success ? 0.6 : 1,
                cursor: !isFormValid() && !loading && !success ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Updating...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} />
                  Updated!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={onClose}
        title="Discard Changes"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        confirmText="Yes, Discard"
        cancelText="Continue Editing"
        type="warning"
      />
    </div>
  );
}

export default EditBundleModal;
