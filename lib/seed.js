import { supabase } from './supabase';
// Note: Structural constants (like ROLES) are now in constants.js
// Seeding mock data is no longer supported to ensure actual data only.
const users = [];
const leaveRequests = [];
const attendance = [];
const INITIAL_ACTIVITY_HISTORY = [];

export async function seedDatabase() {
  console.log('Starting Database Seed...');

  // 1. Profiles (Note: Auth users must be created manually or via signup first)
  // This helper assumes user IDs match or will be linked later.
  // For a "Truly Real" app, users should sign up themselves.
  
  // 2. Activity History
  const { error: histError } = await supabase.from('activity_history').insert(
    INITIAL_ACTIVITY_HISTORY.map(h => ({
      ...h,
      action_code: h.actionCode,
      performed_by_id: null, // Link to real IDs if possible
      target_employee_id: null
    }))
  );
  if (histError) console.error('Error seeding history:', histError);

  // 3. Attendance
  const { error: attError } = await supabase.from('attendance').insert(
    attendance.map(a => ({
      ...a,
      user_id: null // Link to real IDs later
    }))
  );
  if (attError) console.error('Error seeding attendance:', attError);

  console.log('Seed Complete (Partial - Real Auth IDs required for full link)');
}
