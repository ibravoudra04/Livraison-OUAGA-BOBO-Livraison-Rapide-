import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftbhmfdlvrykfbanajfp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YmhtZmRsdnJ5a2ZiYW5hamZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjEwNzAsImV4cCI6MjA5NTM5NzA3MH0.dK8-E2psZ4oCY6P8GXHsREWBFORLRI9H71x-mT82Pp8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestDriver() {
  const { data, error } = await supabase
    .from('livreurs')
    .select('*, auth_users:id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching driver:', error);
  } else {
    console.log('Latest driver:', JSON.stringify(data[0], null, 2));
  }
}

checkLatestDriver();
