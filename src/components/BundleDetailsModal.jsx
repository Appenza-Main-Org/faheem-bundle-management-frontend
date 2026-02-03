import React, { useMemo, useState, useEffect } from 'react';
import { X, Package, Tag, Ticket, Layers, Calendar, Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

function BundleDetailsModal({ bundle: bundleData, onClose }) {
  // Extract bundle, subjectServices, and vouchers from the data structure
  const bundle = bundleData.bundle || bundleData;
  const subjectServices = bundleData.subjectServices || bundle.subjectServices || [];
  const vouchers = bundleData.vouchers || [];

  // State to track which subjects are expanded (default: all collapsed)
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  // Group services by subject
  const groupedBySubject = useMemo(() => {
    const groups = {};

    subjectServices.forEach((service) => {
      const subjectName = service.subject_name || 'Unknown Subject';
      const subjectId = service.subject_id;
      const gradeName = service.grade_name || 'N/A';

      if (!groups[subjectId]) {
        groups[subjectId] = {
          subjectName,
          subjectId,
          gradeName,
          services: []
        };
      }

      groups[subjectId].services.push(service);
    });

    return Object.values(groups);
  }, [subjectServices]);

  // Initialize all subjects as expanded when data loads
  useEffect(() => {
    if (groupedBySubject.length > 0) {
      const allSubjectIds = new Set(groupedBySubject.map(g => g.subjectId));
      setExpandedSubjects(allSubjectIds);
    }
  }, [groupedBySubject]);

  // Toggle subject expand/collapse
  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // Toggle expand/collapse all
  const toggleExpandAll = () => {
    const allExpanded = groupedBySubject.every(g => expandedSubjects.has(g.subjectId));
    if (allExpanded) {
      setExpandedSubjects(new Set());
    } else {
      setExpandedSubjects(new Set(groupedBySubject.map(g => g.subjectId)));
    }
  };

  const formatPrice = (price, discount) => {
    const finalPrice = price - (price * discount / 100);
    return finalPrice.toFixed(2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` and ${days} day${days > 1 ? 's' : ''}` : ''}`;
    } else if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const days = diffDays % 7;
      return `${weeks} week${weeks > 1 ? 's' : ''}${days > 0 ? ` and ${days} day${days > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Bundle Details</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              color: 'var(--gray-500)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Bundle Info */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <Package size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {bundle.name}
                </h3>
                <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
                  {bundle.description}
                </p>
              </div>
            </div>

            {bundle.image_url && (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={bundle.image_url}
                  alt={bundle.name}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--gray-200)'
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: '0.5rem',
                border: '1px solid var(--gray-200)'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                  Original Price
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                  {bundle.price}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: '0.5rem',
                border: '1px solid var(--gray-200)'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                  Discount
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                  {bundle.discount}%
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#d1fae5',
                borderRadius: '0.5rem',
                border: '1px solid #a7f3d0'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: '0.25rem' }}>
                  Final Price
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#065f46' }}>
                  {formatPrice(bundle.price, bundle.discount)}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: '0.5rem',
                border: '1px solid var(--gray-200)'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                  Type
                </p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  <span className="badge badge-info">{bundle.type}</span>
                </p>
              </div>
            </div>

            {/* Bundle Validity Period */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '0.5rem',
              border: '2px solid #bae6fd'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Calendar size={20} style={{ color: '#0284c7' }} />
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  margin: 0
                }}>
                  Access Validity Period
                </h4>
              </div>

              {bundle.type === 'Duration' && (
                <div>
                  <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      padding: '0.875rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#0369a1',
                        marginBottom: '0.25rem',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        Academic Period Start
                      </div>
                      <div style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        color: '#0c4a6e'
                      }}>
                        {formatDateOnly(bundle.startAt)}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.875rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#0369a1',
                        marginBottom: '0.25rem',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        Academic Period End
                      </div>
                      <div style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        color: '#0c4a6e'
                      }}>
                        {formatDateOnly(bundle.expireAt)}
                      </div>
                    </div>
                  </div>
                  {calculateDuration(bundle.startAt, bundle.expireAt) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      border: '1px solid #e0f2fe'
                    }}>
                      <Clock size={16} style={{ color: '#0369a1' }} />
                      <span style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
                        <strong>Total Duration:</strong> {calculateDuration(bundle.startAt, bundle.expireAt)}
                      </span>
                    </div>
                  )}
                  <p style={{
                    fontSize: '0.8125rem',
                    color: '#0369a1',
                    marginTop: '0.75rem',
                    marginBottom: 0,
                    fontStyle: 'italic'
                  }}>
                    This bundle provides access for a fixed academic period from the start date to the end date.
                  </p>
                </div>
              )}

              {bundle.type === 'ExpiryDays' && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e0f2fe',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#0369a1',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        Validity Period
                      </div>
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        color: '#0284c7',
                        lineHeight: '1'
                      }}>
                        {bundle.expiryDays || 'N/A'}
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#0c4a6e',
                        fontWeight: '500',
                        marginTop: '0.25rem'
                      }}>
                        Days
                      </div>
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: '#0369a1',
                    marginTop: '0.75rem',
                    marginBottom: 0,
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    Access begins upon activation and remains valid for {bundle.expiryDays} consecutive day{bundle.expiryDays > 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              <p>Created At: {formatDate(bundle.created_at)}</p>
              <p>Last Updated: {formatDate(bundle.updated_at)}</p>
            </div>
          </div>

          {/* Subject Services - Grouped by Subject */}
          {groupedBySubject.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--gray-200)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    Included Subjects & Services
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={toggleExpandAll}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--primary)',
                      background: 'var(--gray-100)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.375rem',
                      padding: '0.375rem 0.625rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {groupedBySubject.every(g => expandedSubjects.has(g.subjectId)) ? (
                      <>
                        <ChevronUp size={14} />
                        Collapse All
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        Expand All
                      </>
                    )}
                  </button>
                  <div style={{
                    padding: '0.375rem 0.875rem',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #93c5fd',
                    borderRadius: '1rem',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: '#1e40af'
                  }}>
                    {groupedBySubject.length} Subject{groupedBySubject.length !== 1 ? 's' : ''} • {subjectServices.length} Service{subjectServices.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupedBySubject.map((subjectGroup, index) => (
                  <div
                    key={subjectGroup.subjectId || index}
                    style={{
                      padding: '1.25rem',
                      background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
                      borderRadius: '0.5rem',
                      border: '2px solid #e5e7eb'
                    }}
                  >
                    {/* Subject Header - Clickable */}
                    <div
                      onClick={() => toggleSubject(subjectGroup.subjectId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: expandedSubjects.has(subjectGroup.subjectId) ? '1rem' : '0',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #d1d5db',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {expandedSubjects.has(subjectGroup.subjectId) ? (
                          <ChevronUp size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        ) : (
                          <ChevronDown size={20} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        )}
                        <div>
                          <h5 style={{
                            fontSize: '1.0625rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                            {subjectGroup.subjectName}
                          </h5>
                          <p style={{
                            fontSize: '0.8125rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            Grade: <strong>{subjectGroup.gradeName}</strong> • Subject ID: <strong>{subjectGroup.subjectId}</strong>
                          </p>
                        </div>
                      </div>
                      <div style={{
                        padding: '0.375rem 0.75rem',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#4b5563'
                      }}>
                        {subjectGroup.services.length} Service{subjectGroup.services.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Services for this subject - Collapsible */}
                    {expandedSubjects.has(subjectGroup.subjectId) && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem',
                        animation: 'fadeIn 0.2s ease-in'
                      }}>
                        {subjectGroup.services.map((service, serviceIndex) => (
                          <div
                            key={service.id || serviceIndex}
                            style={{
                              padding: '0.875rem',
                              background: 'white',
                              borderRadius: '0.375rem',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.375rem'
                                }}>
                                  <Layers size={14} style={{ color: '#6b7280' }} />
                                  <p style={{
                                    fontWeight: '600',
                                    color: '#374151',
                                    margin: 0,
                                    fontSize: '0.9375rem'
                                  }}>
                                    {service.service_name || 'Service Name'}
                                  </p>
                                </div>
                                {service.service_description && (
                                  <p style={{
                                    fontSize: '0.8125rem',
                                    color: '#6b7280',
                                    marginTop: '0.375rem',
                                    marginBottom: 0
                                  }}>
                                    {service.service_description}
                                  </p>
                                )}
                                <p style={{
                                  fontSize: '0.6875rem',
                                  color: '#9ca3af',
                                  marginTop: '0.5rem',
                                  fontFamily: 'monospace',
                                  marginBottom: 0
                                }}>
                                  Service ID: {service.subject_service_id || service.id}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vouchers */}
          {vouchers && vouchers.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--gray-200)'
              }}>
                <Ticket size={20} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>
                  Vouchers ({vouchers.length})
                </h4>
              </div>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {vouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    style={{
                      padding: '0.75rem',
                      background: voucher.used_at ? 'var(--gray-50)' : '#d1fae5',
                      borderRadius: '0.375rem',
                      border: `1px solid ${voucher.used_at ? 'var(--gray-200)' : '#a7f3d0'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <code style={{
                        padding: '0.25rem 0.5rem',
                        background: 'white',
                        borderRadius: '0.25rem',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: '#1e40af',
                        letterSpacing: '0.025em'
                      }}>
                        {voucher.code || 'N/A'}
                      </code>
                      {voucher.used_at && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                          Used: {formatDate(voucher.used_at)}
                        </div>
                      )}
                    </div>
                    <span className={voucher.used_at ? 'badge badge-danger' : 'badge badge-success'}>
                      {voucher.used_at ? 'Used' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BundleDetailsModal;
