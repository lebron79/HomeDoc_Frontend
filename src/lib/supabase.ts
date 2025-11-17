import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vebmeyrvgkifagheaoib.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYm1leXJ2Z2tpZmFnaGVhb2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDMxNTMsImV4cCI6MjA3NjU3OTE1M30.ZMiXpiErXyeYDJjwSo7R4rRcqopTYWWRa5RbvtNdneo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  // Patient fields
  age?: number;
  phone?: string;
  gender?: string;
  address?: string;
  // Doctor fields
  specialization?: string;
  license_number?: string;
  years_of_experience?: number;
  education?: string;
  bio?: string;
  consultation_fee?: number;
  available_days?: string[];
  available_hours?: string;
  // Admin management fields
  is_active: boolean;
  suspended_at?: string;
  suspended_by?: string;
  suspension_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'analysis';
  analysis?: {
    diagnosis: string;
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
    requiresDoctor: boolean;
    confidence: number;
    additionalNotes?: string;
  };
  source?: 'gemini' | 'fallback';
  rawGemini?: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  conversation_type: 'symptom_check' | 'health_chat';
  title?: string;
  messages: AIMessage[];
  final_diagnosis?: {
    diagnosis: string;
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
    requiresDoctor: boolean;
    confidence: number;
    additionalNotes?: string;
  };
  severity?: 'mild' | 'moderate' | 'severe';
  rating?: number; // 1-5 star rating
  rating_comment?: string; // Optional feedback text
  patient_status?: string; // Patient's self-reported status
  created_at: string;
  updated_at: string;
}
