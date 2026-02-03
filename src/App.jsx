import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Package, Ticket, Layers, LogOut, Grid, Filter, BookOpen, ShoppingBag, Menu, X } from 'lucide-react';
import BundlesList from './components/BundlesList';
import VouchersManager from './components/VouchersManager';
import SubjectServicesManager from './components/SubjectServicesManager';
import RowsManager from './components/RowsManager';
import FilterDrawer from './components/FilterDrawer';
import Login from './components/Login';
import ConfirmDialog from './components/ConfirmDialog';
import ErrorBoundary from './components/ErrorBoundary';
import { SubjectProvider, useSubject } from './context/SubjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('subscriptions'); // 'subjects' or 'subscriptions'
  const [activeTab, setActiveTab] = useState('rows');
  const [filters, setFilters] = useState({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Sidebar collapse state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile sidebar state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Mobile detection
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    type: 'warning'
  });
  const { selectedSubject, isSubjectSelected } = useSubject();
  const { user, logout } = useAuth();

  // Sidebar width constants
  const SIDEBAR_WIDTH_EXPANDED = 260;
  const SIDEBAR_WIDTH_COLLAPSED = 70;

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-open filter drawer if no subject is selected
  useEffect(() => {
    if (!isSubjectSelected) {
      setIsFilterDrawerOpen(true);
    }
  }, [isSubjectSelected]);

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Set default tab for each section
    if (section === 'subjects') {
      setActiveTab('services');
    } else {
      setActiveTab('rows');
    }
    // Expand sidebar if collapsed (desktop only)
    if (isSidebarCollapsed && !isMobile) {
      setIsSidebarCollapsed(false);
    }
    // Close mobile sidebar after selection
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Expand sidebar if collapsed (desktop only)
    if (isSidebarCollapsed && !isMobile) {
      setIsSidebarCollapsed(false);
    }
    // Close mobile sidebar after selection
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      type: 'danger',
      onConfirm: () => {
        logout();
      }
    });
  };

  // Navigation structure with formal, eye-comfortable colors
  const navigation = {
    subjects: {
      id: 'subjects',
      label: 'Subjects & Services',
      icon: BookOpen,
      color: '#1e40af', // Deep professional blue
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      tabs: [
        { id: 'services', label: 'Subject Services', icon: Layers },
      ]
    },
    subscriptions: {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: ShoppingBag,
      color: '#0891b2', // Teal for distinction
      gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      tabs: [
        { id: 'rows', label: 'Rows', icon: Grid },
        { id: 'bundles', label: 'Bundles', icon: Package },
        { id: 'vouchers', label: 'Vouchers', icon: Ticket },
      ]
    }
  };

  const currentSection = navigation[activeSection];

  // Get effective sidebar width for layout calculations
  const getEffectiveSidebarWidth = () => {
    if (isMobile) return 0;
    return isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex' }}>
      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      />

      {/* Mobile Sidebar Backdrop */}
      {isMobile && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 45,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? `${SIDEBAR_WIDTH_EXPANDED}px` : (isSidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`),
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        height: '100vh',
        position: 'fixed',
        left: isMobile ? (isMobileSidebarOpen ? 0 : `-${SIDEBAR_WIDTH_EXPANDED}px`) : 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isMobile && isMobileSidebarOpen ? '4px 0 16px rgba(0, 0, 0, 0.15)' : '2px 0 8px rgba(0, 0, 0, 0.06)',
        zIndex: 50,
        transition: 'left 0.3s ease, width 0.3s ease',
        overflow: 'hidden'
      }}>
        {/* Logo/Brand & Toggle */}
        <div style={{
          padding: (isSidebarCollapsed && !isMobile) ? '1.5rem 0.75rem' : '1.75rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: (isSidebarCollapsed && !isMobile) ? 'center' : 'space-between',
          gap: '0.75rem',
          transition: 'padding 0.3s ease'
        }}>
          {isSidebarCollapsed && !isMobile ? (
            /* Collapsed Logo - Icon Only (Desktop only) */
            <div style={{
              background: '#1e40af',
              padding: '0.625rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(30, 64, 175, 0.2)',
              cursor: 'pointer'
            }}
            onClick={() => setIsSidebarCollapsed(false)}
            title="Expand Sidebar"
            >
              <BookOpen size={22} style={{ color: 'white' }} />
            </div>
          ) : (
            /* Expanded Logo */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1 }}>
                <div style={{
                  background: '#1e40af',
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(30, 64, 175, 0.15)'
                }}>
                  <BookOpen size={22} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Faheem Education
                  </h2>
                  <p style={{
                    fontSize: '0.6875rem',
                    color: '#6b7280',
                    margin: 0,
                    fontWeight: '500',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap'
                  }}>
                    ADMINISTRATIVE SYSTEM
                  </p>
                </div>
              </div>
              {/* Close Button (Mobile) / Collapse Button (Desktop) */}
              <button
                onClick={() => isMobile ? setIsMobileSidebarOpen(false) : setIsSidebarCollapsed(true)}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
                title={isMobile ? "Close Menu" : "Collapse Sidebar"}
              >
                {isMobile ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          )}
        </div>

        {/* Navigation Sections */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: isSidebarCollapsed ? '1rem 0.5rem' : '1.25rem 1rem',
          transition: 'padding 0.3s ease'
        }}>
          {Object.values(navigation).map((section) => {
            const SectionIcon = section.icon;
            const isActiveSection = activeSection === section.id;

            return (
              <div key={section.id} style={{ marginBottom: isSidebarCollapsed ? '0.5rem' : '0.75rem' }}>
                {/* Section Header */}
                <button
                  onClick={() => handleSectionChange(section.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    padding: isSidebarCollapsed ? '0.75rem' : '0.875rem 1rem',
                    border: 'none',
                    background: isActiveSection ? `${section.color}08` : 'transparent',
                    color: isActiveSection ? section.color : '#64748b',
                    fontWeight: isActiveSection ? '600' : '500',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: isSidebarCollapsed ? 'none' : (isActiveSection ? `3px solid ${section.color}` : '3px solid transparent'),
                    textAlign: 'left',
                    letterSpacing: '0.01em',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveSection) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#334155';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveSection) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                  title={isSidebarCollapsed ? section.label : ''}
                >
                  <SectionIcon size={isSidebarCollapsed ? 22 : 19} />
                  {!isSidebarCollapsed && <span>{section.label}</span>}
                  {isSidebarCollapsed && isActiveSection && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '24px',
                      background: section.color,
                      borderRadius: '3px 0 0 3px'
                    }} />
                  )}
                </button>

                {/* Section Tabs */}
                {isActiveSection && !isSidebarCollapsed && (
                  <div style={{
                    marginTop: '0.5rem',
                    marginLeft: '0.75rem',
                    paddingLeft: '0.75rem',
                    borderLeft: `2px solid ${section.color}15`,
                    opacity: 1,
                    transition: 'opacity 0.3s ease'
                  }}>
                    {section.tabs.map((tab) => {
                      const TabIcon = tab.icon;
                      const isActiveTab = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            padding: '0.625rem 0.875rem',
                            border: 'none',
                            background: isActiveTab ? `${section.color}10` : 'transparent',
                            color: isActiveTab ? section.color : '#64748b',
                            fontWeight: isActiveTab ? '600' : '500',
                            fontSize: '0.8125rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            marginBottom: '0.25rem'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActiveTab) {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#334155';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActiveTab) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }
                          }}
                        >
                          <TabIcon size={17} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed state - show tabs as icons */}
                {isActiveSection && isSidebarCollapsed && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    alignItems: 'center'
                  }}>
                    {section.tabs.map((tab) => {
                      const TabIcon = tab.icon;
                      const isActiveTab = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.625rem',
                            border: 'none',
                            background: isActiveTab ? '#dbeafe' : 'transparent',
                            color: isActiveTab ? '#1e40af' : '#6b7280',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActiveTab) {
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.color = '#374151';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActiveTab) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#6b7280';
                            }
                          }}
                          title={tab.label}
                        >
                          <TabIcon size={18} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{
        marginLeft: isMobile ? 0 : (isSidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`),
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header */}
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '0.75rem' : '2rem',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                style={{
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151',
                  flexShrink: 0
                }}
              >
                <Menu size={20} />
              </button>
            )}

            {/* Left: Section & Tab Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap'
                }}>
                  {isMobile ? currentSection.tabs.find(t => t.id === activeTab)?.label : currentSection.label}
                </h1>
                {!isMobile && (
                  <div style={{
                    padding: '0.375rem 0.875rem',
                    background: `${currentSection.color}10`,
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: currentSection.color,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}>
                    {currentSection.tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                  </div>
                )}
              </div>
              {selectedSubject && !isMobile && (
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.375rem 0 0 0', fontWeight: '500' }}>
                  Current Context: <strong style={{ color: '#374151' }}>{selectedSubject.grade?.name}</strong>
                  {selectedSubject.stage && (
                    <>
                      {' • '}
                      <span>{selectedSubject.stage?.name}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Right: User Info & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', flexShrink: 0 }}>
              {/* User Info - hide on mobile */}
              {!isMobile && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {user?.username || 'Administrator'}
                  </div>
                </div>
              )}

              {/* Filters Button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                style={{
                  padding: isMobile ? '0.5rem' : '0.625rem 1.125rem',
                  background: '#1e40af',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(30, 64, 175, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e3a8a';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(30, 64, 175, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1e40af';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(30, 64, 175, 0.3)';
                }}
              >
                <Filter size={isMobile ? 18 : 15} />
                {!isMobile && 'Filters'}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  padding: isMobile ? '0.5rem' : '0.625rem 1.125rem',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(220, 38, 38, 0.3)';
                }}
              >
                <LogOut size={isMobile ? 18 : 15} />
                {!isMobile && 'Logout'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: isMobile ? '1rem' : '2rem',
          background: '#f5f7fa',
          minHeight: 'calc(100vh - 200px)'
        }}>
          {!isSubjectSelected ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '500px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '0.5rem',
              padding: '4rem 3rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Filter size={40} style={{ color: '#1e40af' }} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '0.625rem', color: '#111827', letterSpacing: '-0.01em' }}>
                Filter Selection Required
              </h2>
              <p style={{ fontSize: '0.9375rem', marginBottom: '2rem', color: '#6b7280', maxWidth: '420px', lineHeight: '1.6' }}>
                Please configure your filter criteria to begin managing educational content and subscriptions in the system
              </p>
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="btn btn-primary"
                style={{
                  padding: '0.875rem 2rem',
                  fontSize: '0.9375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  fontWeight: '600'
                }}
              >
                <Filter size={18} />
                Configure Filters
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'bundles' && <BundlesList filters={filters} />}
              {activeTab === 'vouchers' && <VouchersManager filters={filters} />}
              {activeTab === 'services' && <SubjectServicesManager filters={filters} />}
              {activeTab === 'rows' && <RowsManager filters={filters} />}
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          padding: '1.5rem 2rem',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.8125rem',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          fontWeight: '500'
        }}>
          <p style={{ margin: 0 }}>
            © 2024 Faheem Educational Platform • Administrative Management System • All Rights Reserved
          </p>
        </footer>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
      />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SubjectProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </SubjectProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
