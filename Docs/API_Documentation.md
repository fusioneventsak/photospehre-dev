# API Documentation

## Overview

The PhotoSphere API is built on Supabase, providing a serverless backend for the 3D photo collage platform. This document outlines the available endpoints, their parameters, and expected responses.

## Base URL

All API requests are made to your Supabase project URL:

```
https://[YOUR_SUPABASE_PROJECT_ID].supabase.co
```

## Authentication

Most endpoints use Supabase's built-in authentication:

- **Anonymous Access**: Some endpoints allow anonymous access with the anon key
- **Authenticated Access**: Other endpoints require a valid JWT token
- **RLS Policies**: Row Level Security (RLS) policies control access to data

## Collage Endpoints

### Get All Collages

Retrieves all collages for the authenticated user.

```typescript
const { data, error } = await supabase
  .from('collages')
  .select('*')
  .order('created_at', { ascending: false });
```

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "ABC1",
    "name": "My Collage",
    "user_id": "user-uuid",
    "created_at": "2025-06-25T12:00:00Z"
  },
  ...
]
```

### Get Collages with Photo Count

Retrieves all collages with their photo counts.

```typescript
const { data, error } = await supabase
  .rpc('get_collages_with_photo_count');
```

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "ABC1",
    "name": "My Collage",
    "user_id": "user-uuid",
    "created_at": "2025-06-25T12:00:00Z",
    "photo_count": 42
  },
  ...
]
```

### Get User Collages with Photo Count

Retrieves collages for a specific user with their photo counts.

```typescript
const { data, error } = await supabase
  .rpc('get_user_collages_with_photo_count', { user_uuid: 'user-uuid' });
```

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "ABC1",
    "name": "My Collage",
    "user_id": "user-uuid",
    "created_at": "2025-06-25T12:00:00Z",
    "photo_count": 42
  },
  ...
]
```

### Get Collage by Code

Retrieves a collage by its code.

```typescript
const { data, error } = await supabase
  .from('collages')
  .select('*')
  .eq('code', 'ABC1')
  .maybeSingle();
```

**Response:**
```json
{
  "id": "uuid",
  "code": "ABC1",
  "name": "My Collage",
  "user_id": "user-uuid",
  "created_at": "2025-06-25T12:00:00Z"
}
```

### Get Collage by ID

Retrieves a collage by its ID.

```typescript
const { data, error } = await supabase
  .from('collages')
  .select('*')
  .eq('id', 'collage-uuid')
  .maybeSingle();
```

**Response:**
```json
{
  "id": "uuid",
  "code": "ABC1",
  "name": "My Collage",
  "user_id": "user-uuid",
  "created_at": "2025-06-25T12:00:00Z"
}
```

### Create Collage

Creates a new collage.

```typescript
const { data, error } = await supabase
  .from('collages')
  .insert([{ name: 'My New Collage', code: 'XYZ9' }])
  .select()
  .single();
```

**Response:**
```json
{
  "id": "new-uuid",
  "code": "XYZ9",
  "name": "My New Collage",
  "user_id": "user-uuid",
  "created_at": "2025-06-25T12:00:00Z"
}
```

### Update Collage Name

Updates a collage's name.

```typescript
const { data, error } = await supabase
  .from('collages')
  .update({ name: 'Updated Collage Name' })
  .eq('id', 'collage-uuid')
  .select()
  .single();
```

**Response:**
```json
{
  "id": "collage-uuid",
  "code": "ABC1",
  "name": "Updated Collage Name",
  "user_id": "user-uuid",
  "created_at": "2025-06-25T12:00:00Z"
}
```

### Delete Collage

Deletes a collage and all associated photos.

```typescript
const { error } = await supabase
  .from('collages')
  .delete()
  .eq('id', 'collage-uuid');
```

## Photo Endpoints

### Get Photos by Collage ID

Retrieves all photos for a specific collage.

```typescript
const { data, error } = await supabase
  .from('photos')
  .select('*')
  .eq('collage_id', 'collage-uuid')
  .order('created_at', { ascending: false });
```

**Response:**
```json
[
  {
    "id": "photo-uuid",
    "collage_id": "collage-uuid",
    "url": "https://example.com/photos/image.jpg",
    "created_at": "2025-06-25T12:00:00Z"
  },
  ...
]
```

### Upload Photo

Uploads a photo to storage and creates a database record.

```typescript
// Step 1: Upload to storage
const fileName = `${collageId}/${nanoid()}.${fileExt}`;
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('photos')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });

// Step 2: Get public URL
const publicUrl = supabase.storage.from('photos').getPublicUrl(uploadData.path).data.publicUrl;

// Step 3: Create database record
const { data: photo, error: dbError } = await supabase
  .from('photos')
  .insert([{
    collage_id: collageId,
    url: publicUrl
  }])
  .select()
  .single();
```

**Response:**
```json
{
  "id": "new-photo-uuid",
  "collage_id": "collage-uuid",
  "url": "https://example.com/photos/image.jpg",
  "created_at": "2025-06-25T12:00:00Z"
}
```

### Delete Photo

Deletes a photo from both the database and storage.

```typescript
// Step 1: Get the photo to find the storage path
const { data: photo, error: fetchError } = await supabase
  .from('photos')
  .select('url')
  .eq('id', 'photo-uuid')
  .single();

// Step 2: Delete from database
const { error: deleteDbError } = await supabase
  .from('photos')
  .delete()
  .eq('id', 'photo-uuid');

// Step 3: Extract storage path from URL and delete from storage
const url = new URL(photo.url);
const pathParts = url.pathname.split('/');
const storagePathIndex = pathParts.findIndex(part => part === 'photos');
const storagePath = pathParts.slice(storagePathIndex + 1).join('/');

const { error: deleteStorageError } = await supabase.storage
  .from('photos')
  .remove([storagePath]);
```

## Collage Settings Endpoints

### Get Collage Settings

Retrieves settings for a specific collage.

```typescript
const { data, error } = await supabase
  .from('collage_settings')
  .select('settings')
  .eq('collage_id', 'collage-uuid')
  .maybeSingle();
```

**Response:**
```json
{
  "settings": {
    "gridSize": 200,
    "floorSize": 200,
    "photoSize": 4.0,
    "animationPattern": "grid",
    ...
  }
}
```

### Update Collage Settings

Updates settings for a specific collage.

```typescript
const { data, error } = await supabase
  .from('collage_settings')
  .update({ settings: mergedSettings })
  .eq('collage_id', 'collage-uuid')
  .select()
  .single();
```

**Response:**
```json
{
  "id": "settings-uuid",
  "collage_id": "collage-uuid",
  "settings": {
    "gridSize": 200,
    "floorSize": 200,
    "photoSize": 4.0,
    "animationPattern": "grid",
    ...
  },
  "created_at": "2025-06-25T12:00:00Z",
  "updated_at": "2025-06-25T13:00:00Z"
}
```

## Stock Photos Endpoints

### Get All Stock Photos

Retrieves all stock photos.

```typescript
const { data, error } = await supabase
  .from('stock_photos')
  .select('*');
```

**Response:**
```json
[
  {
    "id": "stock-photo-uuid",
    "url": "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg",
    "category": "landscape",
    "created_at": "2025-06-25T12:00:00Z"
  },
  ...
]
```

### Get Stock Photos by Category

Retrieves stock photos filtered by category.

```typescript
const { data, error } = await supabase
  .from('stock_photos')
  .select('*')
  .eq('category', 'people');
```

**Response:**
```json
[
  {
    "id": "stock-photo-uuid",
    "url": "https://images.pexels.com/photos/1839564/pexels-photo-1839564.jpeg",
    "category": "people",
    "created_at": "2025-06-25T12:00:00Z"
  },
  ...
]
```

## Real-time Subscriptions

### Subscribe to Photo Changes

Sets up a real-time subscription for photo changes in a specific collage.

```typescript
const channel = supabase
  .channel(`photos_${collageId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'photos',
      filter: `collage_id=eq.${collageId}`
    },
    (payload) => {
      // Handle the payload based on event type
      if (payload.eventType === 'INSERT') {
        // Handle new photo
      } else if (payload.eventType === 'DELETE') {
        // Handle deleted photo
      } else if (payload.eventType === 'UPDATE') {
        // Handle updated photo
      }
    }
  )
  .subscribe();
```

### Unsubscribe from Channel

Cleans up a real-time subscription.

```typescript
supabase.removeChannel(channel);
```

## Authentication Endpoints

### Sign Up

Creates a new user account.

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      email: email
    }
  }
});
```

### Sign In

Authenticates a user.

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### Sign Out

Logs out the current user.

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current Session

Retrieves the current user session.

```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

## Utility Functions

### Test Real-time Connection

Tests the real-time connection by creating and deleting a test photo.

```typescript
const { data, error } = await supabase
  .rpc('test_realtime', { collage_id: 'collage-uuid' });
```

**Response:**
```json
"Test completed. A photo was created and deleted to test realtime. Check your client for events."
```

### Check Real-time Status

Checks which tables have real-time enabled.

```typescript
const { data, error } = await supabase
  .rpc('check_realtime_status');
```

**Response:**
```json
[
  {
    "table_name": "photos",
    "realtime_enabled": true,
    "publication_name": "supabase_realtime",
    "events_published": "INSERT, UPDATE, DELETE, TRUNCATE"
  },
  ...
]
```

## Error Handling

All API calls return an error object when unsuccessful. Common error scenarios:

- **Authentication Errors**: 401 Unauthorized
- **Permission Errors**: 403 Forbidden
- **Not Found Errors**: 404 Not Found
- **Validation Errors**: 422 Unprocessable Entity
- **Server Errors**: 500 Internal Server Error

Example error handling:

```typescript
const { data, error } = await supabase.from('collages').select('*');

if (error) {
  if (error.code === '42501') {
    console.error('Permission denied. Check RLS policies.');
  } else if (error.code === '42P01') {
    console.error('Table not found. Check schema.');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Rate Limits

- **Anonymous Requests**: 100 requests per minute
- **Authenticated Requests**: 1000 requests per minute
- **Storage Uploads**: 50 uploads per minute
- **Real-time Connections**: 100 concurrent connections

## Best Practices

1. **Use Batching**: Batch operations when possible to reduce API calls
2. **Implement Caching**: Cache frequently accessed data
3. **Handle Errors Gracefully**: Always check for errors in responses
4. **Clean Up Real-time Subscriptions**: Always unsubscribe when components unmount
5. **Use Optimistic Updates**: Update UI immediately, then confirm with server
6. **Implement Retry Logic**: Add exponential backoff for failed requests
7. **Validate Input**: Validate data before sending to the API
8. **Use Transactions**: Use transactions for operations that modify multiple tables