import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Eye,
  UserCheck,
  Filter,
  Trash2,
  User
} from 'lucide-react';

interface MedicalCase {
  id: string;
  case_reason: string;
  emergency_level: string;
  description: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
  patient_id: string;
  doctor_id: string | null;
  patient?: {
    full_name: string;
    age: number;
  };
}

interface DoctorCasesListProps {
  onOpenChat?: (caseId: string, patientId: string) => void;
}

const getEmergencyLevelColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'text-teal-700 bg-teal-50 border-teal-300';
    case 'medium':
      return 'text-yellow-700 bg-yellow-50 border-yellow-300';
    case 'high':
      return 'text-orange-700 bg-orange-50 border-orange-300';
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-300';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-300';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-blue-700 bg-blue-50 border-blue-300';
    case 'accepted':
      return 'text-green-700 bg-green-50 border-green-300';
    case 'in_progress':
      return 'text-purple-700 bg-purple-50 border-purple-300';
    case 'completed':
      return 'text-gray-700 bg-gray-50 border-gray-300';
    case 'cancelled':
      return 'text-red-700 bg-red-50 border-red-300';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-300';
  }
};

const getEmergencyIcon = (level: string) => {
  switch (level) {
    case 'low':
      return <Clock className="w-4 h-4" />;
    case 'medium':
      return <Activity className="w-4 h-4" />;
    case 'high':
      return <AlertTriangle className="w-4 h-4" />;
    case 'critical':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'accepted':
      return <CheckCircle className="w-4 h-4" />;
    case 'in_progress':
      return <Activity className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const formatCaseReason = (reason: string) => {
  return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function DoctorCasesList({ onOpenChat }: DoctorCasesListProps = {}) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEmergency, setFilterEmergency] = useState<string>('all');
  const [acceptingCase, setAcceptingCase] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadCases();
      
      // Subscribe to case updates
      const channel = supabase
        .channel('doctor-cases')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medical_cases',
          },
          () => {
            loadCases();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const loadCases = async () => {
    if (!profile) return;

    try {
      // First, get all cases
      const { data: casesData, error: casesError } = await supabase
        .from('medical_cases')
        .select('*')
        .or(`status.eq.pending,doctor_id.eq.${profile.id}`)
        .is('hidden_from_doctor', null)
        .order('emergency_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Then fetch patient data for each case
      const casesWithPatients = await Promise.all(
        (casesData || []).map(async (caseItem) => {
          const { data: patientData } = await supabase
            .from('user_profiles')
            .select('full_name, age')
            .eq('id', caseItem.patient_id)
            .single();

          return {
            ...caseItem,
            patient: patientData || { full_name: 'Unknown Patient', age: null }
          };
        })
      );
      
      // Sort by emergency priority: critical > high > medium > low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = casesWithPatients.sort((a, b) => {
        const priorityDiff = priorityOrder[a.emergency_level as keyof typeof priorityOrder] - 
                            priorityOrder[b.emergency_level as keyof typeof priorityOrder];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setCases(sorted);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCase = async (caseId: string) => {
    if (!profile) return;

    setAcceptingCase(caseId);
    try {
      const { error } = await supabase
        .from('medical_cases')
        .update({
          doctor_id: profile.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', caseId)
        .eq('status', 'pending');

      if (error) throw error;

      await loadCases();
    } catch (error) {
      console.error('Error accepting case:', error);
      alert('Failed to accept case. Please try again.');
    } finally {
      setAcceptingCase(null);
    }
  };

  const handleOpenChat = (caseItem: MedicalCase) => {
    if (onOpenChat) {
      onOpenChat(caseItem.id, caseItem.patient_id);
    } else {
      // Fallback: navigate to messages tab
      navigate(`/doctor-dashboard?tab=messages&caseId=${caseItem.id}&patientId=${caseItem.patient_id}`);
    }
  };

  const handleMarkInProgress = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from('medical_cases')
        .update({ status: 'in_progress' })
        .eq('id', caseId);

      if (error) throw error;
      await loadCases();
    } catch (error) {
      console.error('Error updating case:', error);
    }
  };

  const handleDeleteCase = async (caseId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to delete the case for ${patientName}? This will hide it from your view but remain visible to admins.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('medical_cases')
        .update({ 
          hidden_from_doctor: true,
          status: 'cancelled'
        })
        .eq('id', caseId);

      if (error) throw error;
      await loadCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete case. Please try again.');
    }
  };

  const filteredCases = cases.filter(caseItem => {
    if (filterStatus !== 'all' && caseItem.status !== filterStatus) return false;
    if (filterEmergency !== 'all' && caseItem.emergency_level !== filterEmergency) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Medical Cases</h2>
        <p className="text-gray-600 mt-1">Review and manage patient consultation requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border-l-4 border-red-500 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none font-medium"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterEmergency}
            onChange={(e) => setFilterEmergency(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </div>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-lg shadow border-l-4 border-gray-300 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cases Found</h3>
          <p className="text-gray-600">No cases match your current filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className={`bg-white rounded-lg shadow border-l-4 overflow-hidden ${
                caseItem.emergency_level === 'critical' ? 'border-red-500' :
                caseItem.emergency_level === 'high' ? 'border-orange-500' :
                caseItem.emergency_level === 'medium' ? 'border-yellow-500' :
                'border-teal-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatCaseReason(caseItem.case_reason)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getEmergencyLevelColor(caseItem.emergency_level)}`}>
                        {getEmergencyIcon(caseItem.emergency_level)}
                        {caseItem.emergency_level.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(caseItem.status)}`}>
                        {getStatusIcon(caseItem.status)}
                        {caseItem.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {caseItem.patient && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{caseItem.patient.full_name}</span>
                        {caseItem.patient.age && (
                          <span className="text-gray-500">• Age: {caseItem.patient.age}</span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Created {new Date(caseItem.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {caseItem.doctor_id === profile?.id && (
                      <button
                        onClick={() => handleDeleteCase(caseItem.id, caseItem.patient?.full_name || 'this patient')}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete case (hide from your view)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {caseItem.status === 'pending' && (
                      <button
                        onClick={() => handleAcceptCase(caseItem.id)}
                        disabled={acceptingCase === caseItem.id}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-teal-600 disabled:opacity-50"
                      >
                        {acceptingCase === caseItem.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Accept Case
                          </>
                        )}
                      </button>
                    )}
                    {caseItem.status === 'accepted' && caseItem.doctor_id === profile?.id && (
                      <>
                        <button
                          onClick={() => handleMarkInProgress(caseItem.id)}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-purple-600"
                        >
                          <Activity className="w-4 h-4" />
                          Start
                        </button>
                        <button
                          onClick={() => handleOpenChat(caseItem)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-cyan-600"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </button>
                      </>
                    )}
                    {caseItem.status === 'in_progress' && caseItem.doctor_id === profile?.id && (
                      <button
                        onClick={() => handleOpenChat(caseItem)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-cyan-600"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedCase(expandedCase === caseItem.id ? null : caseItem.id)}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {expandedCase === caseItem.id && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Patient Description:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{caseItem.description}</p>
                    {caseItem.accepted_at && (
                      <p className="text-sm text-gray-500 mt-3">
                        Accepted on {new Date(caseItem.accepted_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
