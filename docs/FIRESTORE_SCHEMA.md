# Firestore Schema Documentation

This document outlines the Firestore database schema required for the Scouting Namibia application.

## Collections Overview

### Existing Collections (Already in use)

- **profiles** - User profile information
- **player_profiles** - Player-specific data
- **coach_profiles** - Coach-specific data
- **club_profiles** - Club-specific data
- **videos** - Video metadata and content
- **video_likes** - Like tracking for videos
- **saved_players** - Bookmarked players
- **follows** - Follow relationships
- **chat_conversations** - Conversation metadata

---

## NEW Collections (Required for new features)

### 1. comments Collection

Stores comments on videos.

**Collection Path**: `comments`

**Document Structure**:
```javascript
{
  id: string,              // auto-generated document ID
  video_id: string,        // Reference to videos collection
  user_id: string,         // Reference to profiles collection (commenter)
  text: string,            // Comment text content
  created_at: Timestamp,   // When comment was created
  updated_at: Timestamp,   // When comment was last edited (optional)
  likes_count: number,     // Number of likes on this comment (optional, default: 0)
}
```

**Indexes Required**:
- `video_id` + `created_at` (descending) - for fetching comments for a video

**Example Query**:
```javascript
const commentsQuery = query(
  collection(db, "comments"),
  where("video_id", "==", videoId),
  orderBy("created_at", "desc")
)
```

**Security Rules**:
```javascript
match /comments/{document=**} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.user_id;
}
```

---

### 2. messages Collection

Stores individual messages within conversations.

**Collection Path**: `messages`

**Document Structure**:
```javascript
{
  id: string,              // auto-generated document ID
  conversation_id: string, // Reference to chat_conversations collection
  sender_id: string,       // Reference to profiles collection (message sender)
  text: string,            // Message content
  created_at: Timestamp,   // When message was sent
  read: boolean,           // Whether message has been read (default: false)
  edited_at: Timestamp,    // When message was edited (optional)
}
```

**Indexes Required**:
- `conversation_id` + `created_at` (ascending) - for fetching messages in a conversation
- `conversation_id` + `read` - for unread message queries (optional)

**Example Query**:
```javascript
const messagesQuery = query(
  collection(db, "messages"),
  where("conversation_id", "==", conversationId),
  orderBy("created_at", "asc")
)
```

**Security Rules**:
```javascript
match /messages/{document=**} {
  allow read: if request.auth != null && 
              (request.auth.uid in get(/databases/$(database)/documents/chat_conversations/$(request.resource.data.conversation_id)).data.keys());
  allow create: if request.auth != null && 
                request.auth.uid == request.resource.data.sender_id &&
                exists(/databases/$(database)/documents/chat_conversations/$(request.resource.data.conversation_id));
  allow update: if request.auth != null && request.auth.uid == resource.data.sender_id;
  allow delete: if request.auth != null && request.auth.uid == resource.data.sender_id;
}
```

---

## UPDATED Collections (With new fields)

### chat_conversations (Updated)

The existing `chat_conversations` collection needs additional fields:

**Added Fields**:
```javascript
{
  // ... existing fields
  last_viewed_at: Timestamp,  // When current user last viewed this conversation
  participant_1_last_read: Timestamp,  // Last message read by participant 1
  participant_2_last_read: Timestamp,  // Last message read by participant 2
}
```

---

## Creating Indexes in Firebase Console

### For comments Collection

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. **Collection**: `comments`
4. **Fields to index**:
   - Field: `video_id` (Ascending)
   - Field: `created_at` (Descending)
5. Click "Create Index"

### For messages Collection

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. **Collection**: `messages`
4. **Fields to index**:
   - Field: `conversation_id` (Ascending)
   - Field: `created_at` (Ascending)
5. Click "Create Index"

(Optional) Create a second index for unread messages:
1. **Collection**: `messages`
2. **Fields to index**:
   - Field: `conversation_id` (Ascending)
   - Field: `read` (Ascending)

---

## Firestore Rules (Security)

Update your Firestore rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is in conversation
    function isParticipant(conversationId) {
      let conv = get(/databases/$(database)/documents/chat_conversations/$(conversationId)).data;
      return request.auth.uid == conv.participant_1_id || 
             request.auth.uid == conv.participant_2_id;
    }

    // Profiles - public read, users edit own
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Player Profiles
    match /player_profiles/{userId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Coach Profiles
    match /coach_profiles/{userId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Club Profiles
    match /club_profiles/{userId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Videos - anyone read, creator edit/delete
    match /videos/{videoId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.user_id;
    }

    // Video Likes - users manage own
    match /video_likes/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
      allow delete: if request.auth != null && request.auth.uid == resource.data.user_id;
    }

    // Follows - users manage own
    match /follows/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.follower_id;
      allow delete: if request.auth != null && request.auth.uid == resource.data.follower_id;
    }

    // Comments - anyone read, creator edit/delete
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.user_id;
    }

    // Chat Conversations - participants only
    match /chat_conversations/{conversationId} {
      allow read: if request.auth != null && isParticipant(conversationId);
      allow create: if request.auth != null;
      allow update: if request.auth != null && isParticipant(conversationId);
      allow delete: if request.auth != null && isParticipant(conversationId);
    }

    // Messages - conversation participants only
    match /messages/{messageId} {
      allow read: if request.auth != null && isParticipant(resource.data.conversation_id);
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.sender_id &&
                       isParticipant(request.resource.data.conversation_id);
      allow update: if request.auth != null && request.auth.uid == resource.data.sender_id;
      allow delete: if request.auth != null && request.auth.uid == resource.data.sender_id;
    }

    // Saved Players
    match /saved_players/{document=**} {
      allow read: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
      allow delete: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
  }
}
```

---

## Quick Setup Checklist

- [ ] Create `comments` collection (auto-created on first write)
- [ ] Create `messages` collection (auto-created on first write)
- [ ] Create composite indexes for `comments` (video_id + created_at)
- [ ] Create composite indexes for `messages` (conversation_id + created_at)
- [ ] Update Firestore Security Rules with the rules above
- [ ] Test read/write permissions for authenticated users
- [ ] Verify indexes in Firebase Console

---

## Data Migration Notes

If migrating from an existing system, consider:

1. **Comments**: Batch import if needed
2. **Messages**: Batch import with proper timestamps
3. **Conversation Updates**: Add new fields to existing conversations
4. **Indexes**: Wait for indexes to complete before querying (Firebase will notify)

---

## Performance Considerations

- **Comments**: Paginate to fetch 10-20 per request
- **Messages**: Paginate to fetch 20-30 per request
- **Indexes**: Monitor index size; archive old messages after retention period
- **Compound Queries**: Always use indexed fields to avoid timeouts

---

## Future Enhancements

- Add `comment_likes` collection for like functionality on comments
- Add `message_reactions` for emoji reactions
- Add `typing_indicators` for real-time typing status
- Archive old messages to Cloud Storage for archival
- Add message encryption for privacy
