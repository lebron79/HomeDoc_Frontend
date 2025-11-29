import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LogOut, User, Home, Stethoscope, UserCheck, Pill, ChevronDown, Settings, ShoppingCart, Package, Bell, Shield } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Avatar options - same as ProfilePage
const AVATAR_OPTIONS = [
  { id: 'avatar-1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', name: 'Avatar 1' },
  { id: 'avatar-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', name: 'Avatar 2' },
  { id: 'avatar-3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', name: 'Avatar 3' },
  { id: 'avatar-4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', name: 'Avatar 4' },
  { id: 'avatar-5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver', name: 'Avatar 5' },
  { id: 'avatar-6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', name: 'Avatar 6' },
  { id: 'avatar-7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', name: 'Avatar 7' },
  { id: 'avatar-8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', name: 'Avatar 8' },
  { id: 'avatar-9', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo', name: 'Avatar 9' },
  { id: 'avatar-10', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', name: 'Avatar 10' },
  { id: 'avatar-11', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah', name: 'Avatar 11' },
  { id: 'avatar-12', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe', name: 'Avatar 12' },
  { id: 'avatar-13', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam', name: 'Avatar 13' },
  { id: 'avatar-14', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia', name: 'Avatar 14' },
  { id: 'avatar-15', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan', name: 'Avatar 15' },
  { id: 'avatar-16', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava', name: 'Avatar 16' },
  { id: 'avatar-17', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason', name: 'Avatar 17' },
  { id: 'avatar-18', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella', name: 'Avatar 18' },
  { id: 'avatar-19', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', name: 'Avatar 19' },
  { id: 'avatar-20', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte', name: 'Avatar 20' },
  { id: 'avatar-21', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin', name: 'Avatar 21' },
  { id: 'avatar-22', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia', name: 'Avatar 22' },
  { id: 'avatar-23', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', name: 'Avatar 23' },
  { id: 'avatar-24', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper', name: 'Avatar 24' },
  { id: 'avatar-25', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry', name: 'Avatar 25' },
  { id: 'avatar-26', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn', name: 'Avatar 26' },
  { id: 'avatar-27', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander', name: 'Avatar 27' },
  { id: 'avatar-28', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abigail', name: 'Avatar 28' },
  { id: 'avatar-29', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', name: 'Avatar 29' },
  { id: 'avatar-30', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', name: 'Avatar 30' },
  { id: 'avatar-31', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel', name: 'Avatar 31' },
  { id: 'avatar-32', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth', name: 'Avatar 32' },
  { id: 'avatar-33', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jackson', name: 'Avatar 33' },
  { id: 'avatar-34', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia', name: 'Avatar 34' },
  { id: 'avatar-35', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian', name: 'Avatar 35' },
  { id: 'avatar-36', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery', name: 'Avatar 36' },
  { id: 'avatar-37', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', name: 'Avatar 37' },
  { id: 'avatar-38', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ella', name: 'Avatar 38' },
  { id: 'avatar-39', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joseph', name: 'Avatar 39' },
  { id: 'avatar-40', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scarlett', name: 'Avatar 40' },
  { id: 'avatar-41', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carter', name: 'Avatar 41' },
  { id: 'avatar-42', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace', name: 'Avatar 42' },
  { id: 'avatar-43', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Owen', name: 'Avatar 43' },
  { id: 'avatar-44', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe', name: 'Avatar 44' },
  { id: 'avatar-45', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wyatt', name: 'Avatar 45' },
  { id: 'avatar-46', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victoria', name: 'Avatar 46' },
  { id: 'avatar-47', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matthew', name: 'Avatar 47' },
  { id: 'avatar-48', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily', name: 'Avatar 48' },
];

export function Navbar() {
  const { profile, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCasesCount, setPendingCasesCount] = useState(0);
  const [pendingCases, setPendingCases] = useState<any[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get current avatar
  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === (profile?.avatar || 'avatar-1')) || AVATAR_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuRef, notificationRef]);

  // Load pending cases count for doctors
  useEffect(() => {
    async function loadPendingCases() {
      if (!profile || profile.role !== 'doctor') return;

      try {
        // Get all pending cases
        const { data: allCases, error } = await supabase
          .from('medical_cases')
          .select('*, user_profiles!medical_cases_patient_id_fkey(full_name, email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter to show only: unassigned cases OR cases assigned to this doctor
        const filteredCases = (allCases || []).filter(caseItem => 
          !caseItem.doctor_id || caseItem.doctor_id === profile.id
        );

        setPendingCasesCount(filteredCases.length);
        setPendingCases(filteredCases.slice(0, 5)); // Show only first 5
      } catch (error) {
        console.error('Error loading pending cases:', error);
      }
    }

    loadPendingCases();
    
    // Refresh pending cases count every 30 seconds
    const interval = setInterval(loadPendingCases, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient':
        return 'bg-red-100 text-red-800';
      case 'doctor':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="HomeDoc Logo" className="w-20 h-20" />
            <span className="text-2xl font-bold text-gray-900">HomeDoc</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Home</span>
              </Link>
              
              <button
                onClick={() => {
                  const dashboardPath = profile?.role === 'patient' 
                    ? '/patient-dashboard' 
                    : profile?.role === 'doctor' 
                    ? '/doctor-dashboard' 
                    : profile?.role === 'admin'
                    ? '/admin'
                    : '/';
                  
                  // Force reload by navigating to home first if already on dashboard
                  if (window.location.pathname === dashboardPath) {
                    navigate('/');
                    setTimeout(() => navigate(dashboardPath), 0);
                  } else {
                    navigate(dashboardPath);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <UserCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              
              <Link
                to="/health-assessment"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-sm font-medium">Health Assessment</span>
              </Link>
              
              {profile?.role === 'doctor' && (
                <>
                  <Link
                    to="/medications"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                  >
                    <Pill className="w-4 h-4" />
                    <span className="text-sm font-medium">Medications</span>
                  </Link>
                  <Link
                    to="/medication-store"
                    className="flex items-center gap-2 px-3 py-2 text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all rounded-lg shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-sm font-medium">Store</span>
                  </Link>
                </>
              )}
              
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all rounded-lg shadow-md hover:shadow-lg"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Notification Bell for Doctors */}
            {profile?.role === 'doctor' && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {pendingCasesCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold">
                        {pendingCasesCount > 9 ? '9+' : pendingCasesCount}
                      </span>
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Pending Cases</h3>
                        <p className="text-xs text-gray-500 mt-1">{pendingCasesCount} case{pendingCasesCount !== 1 ? 's' : ''} waiting for review</p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {pendingCases.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            No pending cases
                          </div>
                        ) : (
                          pendingCases.map((caseItem) => (
                            <button
                              key={caseItem.id}
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/doctor-dashboard?tab=cases');
                              }}
                              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {caseItem.user_profiles?.full_name || 'Patient'}
                                </p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  caseItem.emergency_level === 'critical' ? 'bg-red-100 text-red-800' :
                                  caseItem.emergency_level === 'high' ? 'bg-orange-100 text-orange-800' :
                                  caseItem.emergency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {caseItem.emergency_level}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{caseItem.case_reason}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{caseItem.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(caseItem.created_at).toLocaleString()}
                              </p>
                            </button>
                          ))
                        )}
                      </div>

                      {pendingCasesCount > 5 && (
                        <div className="px-4 py-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              navigate('/doctor-dashboard?tab=cases');
                            }}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all {pendingCasesCount} cases
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell - Only for patients */}
            {profile && profile.role === 'patient' && (() => {
              const { unreadCount } = useNotifications();
              return (
                <div className="relative">
                  <button
                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-6 h-6 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}

            {/* User Profile Dropdown */}
            {profile && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img 
                    src={currentAvatar.url} 
                    alt={profile.full_name}
                    className={`w-10 h-10 rounded-full border-2 ${
                      profile.role === 'doctor' ? 'border-green-200' : 'border-red-200'
                    }`}
                  />
                  <div className="hidden sm:flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${getRoleColor(
                        profile.role
                      )}`}
                    >
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                      </div>
                      <div className="py-1">
                        <Link 
                          to="/profile" 
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Your Profile
                          </div>
                        </Link>
                        <Link 
                          to="/settings" 
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Settings
                          </div>
                        </Link>
                        <Link 
                          to="/order-history" 
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Previous Orders
                          </div>
                        </Link>
                      </div>
                      <div className="py-1 border-t border-gray-100">
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Home</span>
              </Link>
              
              <Link
                to="/health-assessment"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-sm font-medium">Health Assessment</span>
              </Link>
              
              {profile?.role === 'doctor' && (
                <>
                  <Link
                    to="/medications"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                  >
                    <Pill className="w-4 h-4" />
                    <span className="text-sm font-medium">Medications</span>
                  </Link>
                  <Link
                    to="/medication-store"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all rounded-lg shadow-md"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-sm font-medium">Medication Store</span>
                  </Link>
                </>
              )}

              {profile && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-3 px-3">
                    <img 
                      src={currentAvatar.url} 
                      alt={profile.full_name}
                      className={`w-10 h-10 rounded-full border-2 ${
                        profile.role === 'doctor' ? 'border-green-200' : 'border-blue-200'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                      <p className="text-xs text-gray-500">{profile.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Your Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                    <Link
                      to="/order-history"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <Package className="w-4 h-4" />
                      <span className="text-sm font-medium">Previous Orders</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
