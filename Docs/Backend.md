# Backend Operations

## Database Schema

The backend uses Supabase for database, authentication, storage, and real-time functionality.

### Core Tables

1. **collages**
   - `id`: uuid (primary key)
   - `code`: text (unique, 4 characters)
   - `name`: text
   - `user_id`: uuid (foreign key to auth.users)
   - `created_at`: timestamptz

2. **photos**
   - `id`: uuid (primary key)
   - `collage_id`: uuid (foreign key to collages)
   - `url`: text
   - `created_at`: timestamptz

3. **collage_settings**
   - `id`: uuid (primary key)
   - `collage_id`: uuid (foreign key to collages)
   - `settings`: jsonb
   - `created_at`: timestamptz
   - `updated_at`: timestamptz

4. **stock_photos**
   - `id`: uuid (primary key)
   - `url`: text
   - `category`: text
   - `created_at`: timestamptz

5. **users**
   - `id`: uuid (primary key, references auth.users)
   - `email`: text
   - `created_at`: timestamptz
   - `updated_at`: timestamptz

6. **user_roles**
   - `id`: uuid (primary key)
   - `user_id`: uuid (references auth.users)
   - `role`: text (enum: 'admin', 'user')
   - `created_at`: timestamptz
   - `updated_at`: timestamptz

## Storage

The application uses Supabase Storage for photo uploads:

- **Bucket**: `photos`
- **Access**: Public read, authenticated write
- **File Structure**: `{collage_id}/{random_id}.{extension}`
- **Size Limit**: 10MB per file
- **Allowed Types**: JPEG, PNG, GIF, WebP

## Real-time Functionality

Real-time updates are implemented using Supabase Realtime:

1. **Publication**: `supabase_realtime`
   - Tables: photos, collages, collage_settings
   - Events: INSERT, UPDATE, DELETE, TRUNCATE

2. **Client Subscription**:
   - Channel format: `photos_{collage_id}`
   - Filter: `collage_id=eq.{collage_id}`
   - Events: All (*) 

3. **Fallback Mechanism**:
   - Polling interval: 3 seconds
   - Triggered when WebSocket connection fails
   - Automatically reverts to real-time when connection is restored

## Database Functions

1. **create_default_collage_settings()**
   - Trigger: After INSERT on collages
   - Purpose: Creates default settings for new collages
   - Returns: TRIGGER

2. **update_updated_at_column()**
   - Trigger: Before UPDATE on tables with updated_at
   - Purpose: Updates the updated_at timestamp
   - Returns: TRIGGER

3. **handle_auth_user_created()**
   - Trigger: After INSERT on auth.users
   - Purpose: Creates entry in public.users and assigns default role
   - Returns: TRIGGER

4. **handle_auth_user_updated()**
   - Trigger: After UPDATE on auth.users
   - Purpose: Syncs changes to public.users
   - Returns: TRIGGER

5. **check_realtime_status()**
   - Purpose: Checks which tables have real-time enabled
   - Returns: TABLE (table_name, realtime_enabled, publication_name, events_published)

6. **test_realtime(collage_id)**
   - Purpose: Tests real-time functionality by creating and deleting a test photo
   - Parameters: collage_id (uuid)
   - Returns: text (result message)

7. **generate_random_code()**
   - Purpose: Generates a random 4-character code for collages
   - Returns: text

## Row Level Security (RLS)

The following RLS policies are implemented:

1. **collages**
   - Anyone can view collages
   - Anyone can create collages
   - Anyone can update collages
   - Anyone can delete collages

2. **photos**
   - Completely open access (all operations)

3. **collage_settings**
   - Completely open access (all operations)

4. **stock_photos**
   - Anyone can view stock photos (read-only)

5. **users**
   - Users can read own profile
   - Users can update own profile

6. **user_roles**
   - Users can view their own roles
   - Admins can view all roles

7. **settings**
   - Completely open access (all operations)

8. **sound_settings**
   - Users can manage their own sound settings

9. **images**
   - Completely open access (all operations)

10. **storage.objects (photos bucket)**
    - Anyone can upload photos
    - Anyone can view photos

## Authentication

The application uses Supabase Auth with the following configuration:

1. **Methods**:
   - Email/Password
   - Demo admin account for testing

2. **User Roles**:
   - Admin: Full access to all features
   - User: Access to own collages and photos

3. **Anonymous Access**:
   - View collages with code
   - Upload photos to collages
   - Interact with 3D scene

## API Operations

### Collage Operations

1. **Create Collage**
   - Generate unique 4-character code
   - Create collage record
   - Create default settings
   - Return collage with settings

2. **Fetch Collage by Code**
   - Normalize code to uppercase
   - Fetch collage record
   - Fetch associated settings
   - Set up real-time subscription
   - Fetch initial photos

3. **Fetch Collage by ID**
   - Fetch collage record
   - Fetch associated settings
   - Set up real-time subscription
   - Fetch initial photos

4. **Update Collage Settings**
   - Merge new settings with existing
   - Update settings record
   - Update local state

5. **Update Collage Name**
   - Update name in database
   - Update local state

### Photo Operations

1. **Upload Photo**
   - Validate file (type, size)
   - Generate unique filename
   - Upload to storage
   - Create photo record
   - Return photo data

2. **Delete Photo**
   - Delete photo record from database
   - Remove file from storage
   - Update local state
   - Broadcast deletion via real-time

3. **Fetch Photos by Collage ID**
   - Query photos table
   - Order by created_at (descending)
   - Update local state

### Real-time Operations

1. **Setup Real-time Subscription**
   - Create channel for collage
   - Subscribe to photo changes
   - Handle connection status
   - Set up fallback polling

2. **Handle Real-time Events**
   - INSERT: Add photo to state
   - DELETE: Remove photo from state
   - UPDATE: Update photo in state

3. **Cleanup Subscription**
   - Unsubscribe from channel
   - Stop polling
   - Reset connection status