import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log(`🔗 URL: ${supabaseUrl}`);
  
  try {
    // Test collages table
    const { data: collagesData, error: collagesError } = await supabase
      .from('collages')
      .select('count(*)');
    
    if (collagesError) throw collagesError;
    console.log('✅ Collages table connection successful!');
    console.log('📊 Collages count:', collagesData[0].count);
    
    // Test photos table
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('count(*)');
    
    if (photosError) throw photosError;
    console.log('✅ Photos table connection successful!');
    console.log('📊 Photos count:', photosData[0].count);
    
    // Test collage_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from('collage_settings')
      .select('count(*)');
    
    if (settingsError) throw settingsError;
    console.log('✅ Collage settings table connection successful!');
    console.log('📊 Settings count:', settingsData[0].count);
    
    // Test storage
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('photos');
    
    if (bucketError) throw bucketError;
    console.log('✅ Storage bucket connection successful!');
    console.log('📦 Bucket info:', bucketData);
    
    console.log('\n🎉 All tests passed! Your Supabase connection is working properly.');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    
    if (error.message?.includes('JWT')) {
      console.error('\n🔑 Authentication error: Your API key might be invalid or expired.');
    } else if (error.message?.includes('fetch')) {
      console.error('\n🌐 Network error: Check your Supabase URL and internet connection.');
    } else if (error.message?.includes('permission denied')) {
      console.error('\n🔒 Permission error: Check your RLS policies.');
    } else if (error.message?.includes('does not exist')) {
      console.error('\n📋 Schema error: The table might not exist or has a different name.');
    }
    
    console.error('\n📝 Troubleshooting tips:');
    console.error('1. Verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    console.error('2. Check if your Supabase project is running');
    console.error('3. Ensure your database schema matches the expected tables');
    console.error('4. Verify RLS policies allow the operations you\'re trying to perform');
  }
}

testConnection();