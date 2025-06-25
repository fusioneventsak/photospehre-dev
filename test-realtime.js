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

// Test realtime connection
async function testRealtimeConnection() {
  console.log('🔍 Testing Supabase Realtime connection...');
  console.log(`🔗 URL: ${supabaseUrl}`);
  
  try {
    // Create a test collage
    const testCollageName = `Test Collage ${Date.now()}`;
    console.log(`📝 Creating test collage: "${testCollageName}"`);
    
    const { data: collage, error: collageError } = await supabase
      .from('collages')
      .insert([{ name: testCollageName, code: `T${Math.floor(Math.random() * 9000) + 1000}` }])
      .select()
      .single();
    
    if (collageError) throw collageError;
    console.log('✅ Test collage created:', collage);
    
    // Set up realtime subscription
    console.log('🔄 Setting up realtime subscription for photos...');
    
    let subscriptionReceived = false;
    const channel = supabase
      .channel(`photos_${collage.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `collage_id=eq.${collage.id}`
        },
        (payload) => {
          console.log('🔔 Realtime event received:', payload.eventType);
          console.log('📊 Payload:', payload);
          subscriptionReceived = true;
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });
    
    // Wait for subscription to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Insert a test photo
    console.log('📸 Inserting test photo...');
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .insert([{
        collage_id: collage.id,
        url: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg'
      }])
      .select()
      .single();
    
    if (photoError) throw photoError;
    console.log('✅ Test photo inserted:', photo);
    
    // Wait for realtime event
    console.log('⏳ Waiting for realtime event...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (subscriptionReceived) {
      console.log('✅ Realtime subscription is working!');
    } else {
      console.log('⚠️ No realtime event received. Realtime might not be configured correctly.');
    }
    
    // Clean up - delete test photo and collage
    console.log('🧹 Cleaning up test data...');
    
    const { error: deletePhotoError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photo.id);
    
    if (deletePhotoError) console.warn('⚠️ Could not delete test photo:', deletePhotoError);
    
    // Wait a bit to see if we get the delete event
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { error: deleteCollageError } = await supabase
      .from('collages')
      .delete()
      .eq('id', collage.id);
    
    if (deleteCollageError) console.warn('⚠️ Could not delete test collage:', deleteCollageError);
    
    // Unsubscribe from channel
    supabase.removeChannel(channel);
    
    console.log('\n🎉 Realtime test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
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
    console.error('3. Ensure Realtime is enabled in your Supabase dashboard');
    console.error('4. Verify RLS policies allow the operations you\'re trying to perform');
  }
}

testRealtimeConnection();