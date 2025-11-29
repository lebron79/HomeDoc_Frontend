import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DoctorMessaging } from './DoctorMessaging';
import { DoctorCasesList } from './DoctorCasesList';
import { Footer } from '../Layout/Footer';
import { ParticlesBackground } from '../Layout/ParticlesBackground';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  Stethoscope, 
  Loader2,
  Users,
  TrendingUp,
  Activity,
  Heart,
  Brain,
  Calendar,
  BarChart3,
  UserCheck,
  MessageSquare,
  Award,
  ShoppingCart,
  Pill,
  Package,
  FileText
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number | string;
  condition: string;
  lastVisit: string;
  status: string;
}

export function DoctorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'analytics' | 'messages' | 'cases'>('overview');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const caseIdParam = searchParams.get('caseId');
    const patientIdParam = searchParams.get('patientId');
    
    if (tabParam && ['overview', 'patients', 'analytics', 'messages', 'cases'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'patients' | 'analytics' | 'messages' | 'cases');
    }
    
    if (caseIdParam && patientIdParam) {
      setSelectedCaseId(caseIdParam);
      setSelectedPatientId(patientIdParam);
    }
  }, [searchParams]);

  const handleOpenChat = (caseId: string, patientId: string) => {
    setSelectedCaseId(caseId);
    setSelectedPatientId(patientId);
    setActiveTab('messages');
  };

  // Dynamic stats
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCases: 0,
    completedCases: 0,
    avgResponseTime: '—',
    accuracy: 94.2,
    patientSatisfaction: 4.8,
  });

  const loadStats = async () => {
    if (!profile) return;
    try {
      const { count: patientsCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');

      const { count: activeCount } = await supabase
        .from('medical_cases')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', profile.id)
        .in('status', ['accepted', 'in_progress']);

      const { count: completedCount } = await supabase
        .from('medical_cases')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', profile.id)
        .eq('status', 'completed');

      setStats(prev => ({
        ...prev,
        totalPatients: patientsCount || 0,
        activeCases: activeCount || 0,
        completedCases: completedCount || 0,
      }));
    } catch (e) {
      console.error('Error loading stats', e);
    }
  };

  const trendingDiseases = [
    { name: 'Common Cold', cases: 45, trend: '+12%', color: 'blue' },
    { name: 'Seasonal Flu', cases: 32, trend: '+8%', color: 'red' },
    { name: 'Allergies', cases: 28, trend: '+15%', color: 'green' },
    { name: 'Migraine', cases: 19, trend: '+5%', color: 'purple' },
    { name: 'Anxiety', cases: 16, trend: '+22%', color: 'orange' }
  ];

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const loadUnreadMessageCount = async () => {
    if (!profile) return;

    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('is_read', false);

      setUnreadMessageCount(count || 0);
    } catch (error) {
      console.error('Error loading unread message count:', error);
    }
  };

  const loadPatients = async () => {
    try {
      // First, get all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('user_profiles')
        .select('id, full_name, age, created_at')
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (patientsError) {
        console.error('Error loading patients:', patientsError);
        throw patientsError;
      }

      // Then, for each patient, try to get their latest conversation or diagnosis
      const formattedPatients = await Promise.all(
        (patientsData || []).map(async (patient) => {
          // Try to get the latest message from this patient
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('created_at')
            .eq('sender_id', patient.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Try to get latest AI conversation
          const { data: lastConversation } = await supabase
            .from('ai_conversations')
            .select('created_at, final_diagnosis')
            .eq('user_id', patient.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastActivity = lastMessage?.created_at || lastConversation?.created_at || patient.created_at;
          const condition = lastConversation?.final_diagnosis?.diagnosis || 'No recent activity';

          return {
            id: patient.id,
            name: patient.full_name,
            age: patient.age || 'N/A',
            condition: condition,
            lastVisit: new Date(lastActivity).toLocaleDateString(),
            status: 'stable'
          };
        })
      );

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const upcomingAppointments = [
    { time: '09:00', patient: 'John Smith', condition: 'Follow-up', type: 'Video Call' },
    { time: '10:30', patient: 'Maria Garcia', condition: 'Initial Consultation', type: 'In-Person' },
    { time: '14:00', patient: 'Robert Brown', condition: 'Prescription Review', type: 'Phone Call' },
    { time: '15:30', patient: 'Jennifer Davis', condition: 'Emergency Consult', type: 'Video Call' }
  ];

  useEffect(() => {
    loadUnreadMessageCount();
    loadStats();
    
    // Set up real-time subscription for unread messages
    const channel = supabase
      .channel('doctor-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile?.id}`,
        },
        () => {
          loadUnreadMessageCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'patients') {
      loadPatients();
    }
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return 'text-green-600 bg-green-50';
      case 'improving':
        return 'text-blue-600 bg-blue-50';
      case 'monitoring':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white border-l-4 border-red-500 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Dr. {profile?.full_name}</h2>
            <p className="text-gray-600">Healthcare Provider Dashboard</p>
          </div>
          <Stethoscope className="w-8 h-8 text-red-500" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-t-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-red-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patients</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.totalPatients}</p>
          <p className="text-sm text-gray-600 mt-1">Total registered</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-t-4 border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.activeCases}</p>
          <p className="text-sm text-gray-600 mt-1">Cases in progress</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-t-4 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.completedCases}</p>
          <p className="text-sm text-gray-600 mt-1">Cases completed</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-t-4 border-rose-500">
          <div className="flex items-center justify-between mb-2">
            <Brain className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Model</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{staticStats.accuracy}%</p>
          <p className="text-sm text-gray-600 mt-1">Accuracy rate</p>
        </div>
      </div>

      {/* Medication Store Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-l-4 border-teal-500 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate('/medication-store')}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Medication Store</h3>
              <p className="text-sm text-gray-600">Order medical supplies for your practice</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-300">
              500+ Products
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
              Free Shipping
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-300">
              Quick Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Order History Button */}
      <div className="bg-gradient-to-r from-rose-50 to-red-50 border-l-4 border-red-500 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate('/order-history')}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">Track your medication orders</p>
              </div>
            </div>
            <ShoppingCart className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </div>

      {/* Trending Diseases */}
      <div className="bg-white rounded-lg shadow border-l-4 border-red-400">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Trending Diagnoses
            </h3>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Last 7 Days</span>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {trendingDiseases.map((disease, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-red-500 w-4">{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{disease.name}</p>
                    <p className="text-sm text-gray-500">{disease.cases} cases</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-teal-600">{disease.trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border-l-4 border-cyan-500">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
              Today's Schedule
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-200">
                      <span className="text-sm font-semibold text-cyan-700">{appointment.time}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.patient}</p>
                      <p className="text-sm text-gray-600">{appointment.condition}</p>
                      <p className="text-xs text-gray-500 mt-1">{appointment.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border-l-4 border-emerald-500">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Performance Metrics
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Avg. Response Time</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.avgResponseTime}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Patient Satisfaction</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.patientSatisfaction}/5.0</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Diagnosis Accuracy</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.accuracy}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.accuracy}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatientsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border-l-4 border-red-500">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-red-500" />
            Patient Records
          </h3>
        </div>
        <div className="p-6">
          {loadingPatients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No patients found</p>
              <p className="text-gray-500 text-sm mt-1">Patient records will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border-l-2 border-teal-400 bg-gradient-to-r from-teal-50 to-white rounded-lg hover:from-teal-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center border-2 border-teal-300">
                      <span className="text-teal-700 font-semibold text-sm">
                        {patient.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">Age: {patient.age} • {patient.condition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Last: {patient.lastVisit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border-l-4 border-rose-500">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-600" />
              Weekly Overview
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Consultations</span>
                <span className="text-lg font-semibold text-gray-900">47</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Diagnoses Validated</span>
                <span className="text-lg font-semibold text-gray-900">42</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Emergency Cases</span>
                <span className="text-lg font-semibold text-gray-900">3</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Follow-ups</span>
                <span className="text-lg font-semibold text-gray-900">12</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border-l-4 border-teal-500">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Health Categories
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cardiovascular</span>
                  <span className="text-sm font-medium text-gray-900">65%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Respiratory</span>
                  <span className="text-sm font-medium text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Mental Health</span>
                  <span className="text-sm font-medium text-gray-900">38%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Digestive</span>
                  <span className="text-sm font-medium text-gray-900">52%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-16 relative overflow-hidden">
        <ParticlesBackground />
        <div className="p-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Doctor Dashboard
              </h1>
              <p className="text-gray-600">
                Medical management and patient care platform
              </p>
            </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow border-l-4 border-red-500 mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 min-w-[120px] px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex-1 min-w-[120px] px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'patients'
                  ? 'border-teal-500 text-teal-600 bg-teal-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Patients
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 min-w-[120px] px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 min-w-[120px] px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 relative ${
                activeTab === 'messages'
                  ? 'border-cyan-500 text-cyan-600 bg-cyan-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
              {unreadMessageCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-semibold">
                  {unreadMessageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex-1 min-w-[120px] px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'cases'
                  ? 'border-rose-500 text-rose-600 bg-rose-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Cases
            </button>
          </div>
        </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'patients' && renderPatientsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <DoctorMessaging initialCaseId={selectedCaseId} initialPatientId={selectedPatientId} />
            </div>
          )}
          {activeTab === 'cases' && (
            <div className="space-y-6">
              <DoctorCasesList onOpenChat={handleOpenChat} />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Footer - Full Width Outside All Containers */}
      <Footer />
    </>
  );
}