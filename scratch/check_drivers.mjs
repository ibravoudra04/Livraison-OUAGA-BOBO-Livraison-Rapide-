import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftbhmfdlvrykfbanajfp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YmhtZmRsdnJ5a2ZiYW5hamZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjEwNzAsImV4cCI6MjA5NTM5NzA3MH0.dK8-E2psZ4oCY6P8GXHsREWBFORLRI9H71x-mT82Pp8'
);

async function check() {
  const { data, error } = await supabase.from('livreurs_view').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total drivers in livreurs_view: ${data.length}`);
  
  const active = data.filter(d => d.status === 'actif' || d.status === 'approved');
  console.log(`Active/Approved drivers: ${active.length}`);
  
  active.forEach(d => {
    console.log(`- ${d.name} | City: ${d.city} | Lat: ${d.lat}, Lng: ${d.lng} | Distance to Ouaga: ${Math.sqrt(Math.pow((d.lat || 0) - 12.3714, 2) + Math.pow((d.lng || 0) - -1.5197, 2))}`);
  });
}
check();
