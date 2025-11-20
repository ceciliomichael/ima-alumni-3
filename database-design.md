# IMA Alumni System - Database Design Documentation

## Collection 1. users
Contains user account information for the alumni system

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each user |
| name | String | Full name of the user |
| email | String | Email address (stored in lowercase) |
| password | String | User password (hashed in production) |
| alumniId | String | Alumni ID for authentication |
| batch | String | Graduation batch/year |
| profileImage | String | URL to profile image |
| coverPhoto | String | URL to cover photo |
| bio | String | User biography/description |
| job | String | Current job title |
| company | String | Current company |
| location | String | Current location |
| socialLinks | Object | Social media links (linkedin, twitter, website) |
| createdAt | DateTime | Timestamp when user was created |
| isActive | Boolean | Whether the user account is approved/active |
| following | Array | List of user IDs this user follows |
| followers | Array | List of user IDs following this user |
| officerPosition | Object | Officer position details (title, startDate, endDate, batchYear) |
| showOfficerInfo | Boolean | Whether to display officer information on profile |

## Collection 2. posts
Contains user posts and feed content

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each post |
| userId | String | ID of the user who created the post |
| userName | String | Name of the user who created the post |
| userImage | String | Profile image URL of the post author |
| content | String | Text content of the post |
| images | Array | Array of image URLs attached to the post |
| feeling | Object | Feeling/emotion data (emoji, text) |
| createdAt | DateTime | Timestamp when post was created |
| likedBy | Array | List of user IDs who liked this post |
| comments | Array | Array of comment objects |
| isApproved | Boolean | Whether the post is approved by admin |
| moderationStatus | String | Moderation status (pending/approved/rejected) |
| rejectionReason | String | Reason for post rejection |
| moderatedBy | String | ID of admin who moderated the post |
| moderatedAt | DateTime | Timestamp when post was moderated |

## Collection 3. alumni_records
Contains alumni member records

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each alumni record |
| name | String | Full name of the alumni |
| email | String | Email address of the alumni |
| alumniId | String | Alumni ID for authentication |
| batch | String | Graduation batch/year |
| isActive | Boolean | Whether the alumni account is active |
| dateRegistered | DateTime | Date when alumni was registered |
| position | String | Current position/role |
| profileImage | String | URL to profile image |
| userId | String | Reference to user ID |
| deletedAt | DateTime | Timestamp for soft delete |

## Collection 4. alumni_officers
Contains alumni officer position information

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each officer position |
| title | String | Position title (e.g., President, Vice President) |
| alumniId | String | Reference to alumni ID |
| batchYear | String | Batch year of the officer |
| startDate | DateTime | Start date of the position |
| endDate | DateTime | End date of the position |
| photo | String | URL to officer photo |

## Collection 5. jobs
Contains job posting information

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each job posting |
| title | String | Job title |
| company | String | Company name |
| location | String | Job location |
| description | String | Job description |
| requirements | String | Job requirements |
| contactEmail | String | Contact email for applications |
| postedDate | DateTime | Date when job was posted |
| isApproved | Boolean | Whether the job is approved by admin |
| postedBy | String | ID of user who posted the job |
| salary | String | Salary information |
| applicationType | String | Application type (email/website/inPerson) |
| applicationUrl | String | URL for application |
| deadline | DateTime | Application deadline |
| jobType | String | Job type (fullTime/partTime/contract/internship) |
| companyLogo | String | Base64 encoded image or URL |

## Collection 6. events
Contains event information

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each event |
| title | String | Event title |
| description | String | Event description |
| location | String | Event location |
| date | DateTime | Event date and time |
| isApproved | Boolean | Whether the event is approved by admin |
| createdBy | String | ID of user who created the event |
| coverImage | String | URL to cover image |
| createdAt | DateTime | Timestamp when event was created |
| isTest | Boolean | Flag to indicate if this is a test event |

## Collection 7. gallery_items
Contains gallery photos and albums

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each gallery item |
| title | String | Title of the gallery item |
| description | String | Description of the gallery item |
| imageUrl | String | URL to the image (for backward compatibility) |
| images | Array | Array of image objects with id, url, title, order |
| albumId | String | ID to group images into albums |
| albumTitle | String | Title of the album |
| imageOrder | Number | Order of images within an album |
| isAlbum | Boolean | Whether this is an album or single image |
| albumCategory | String | Category of the album |
| event | String | Associated event ID |
| postedDate | DateTime | Date when item was posted |
| isApproved | Boolean | Whether the item is approved by admin |
| postedBy | String | ID of user who posted the item |
| likedBy | Array | Array of user IDs who liked this post |
| bookmarkedBy | Array | Array of user IDs who bookmarked this post |

## Collection 8. donations
Contains donation records

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each donation |
| donorName | String | Name of the donor |
| donorEmail | String | Email address of the donor |
| amount | Number | Donation amount |
| currency | String | Currency code (e.g., PHP, USD) |
| purpose | String | Purpose of the donation |
| category | String | Donation category |
| description | String | Additional description |
| isPublic | Boolean | Whether to display donation publicly |
| isAnonymous | Boolean | Whether donor wants to remain anonymous |
| donationDate | DateTime | Date of the donation |
| archiveMonth | Number | Month for archiving (1-12) |
| archiveYear | Number | Year for archiving |
| createdAt | DateTime | Timestamp when record was created |
| updatedAt | DateTime | Timestamp when record was last updated |

## Collection 9. notifications
Contains system notifications

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each notification |
| type | String | Notification type (event/job/mention/system/donation) |
| title | String | Notification title |
| message | String | Notification message |
| isRead | Boolean | Whether the notification has been read |
| createdAt | DateTime | Timestamp when notification was created |
| sourceId | String | Reference to the source item (event, job, or donation ID) |

## Collection 10. contact_messages
Contains contact form submissions

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each message |
| name | String | Name of the sender |
| email | String | Email address of the sender |
| subject | String | Subject of the message |
| message | String | Message content |
| createdAt | DateTime | Timestamp when message was sent |
| isRead | Boolean | Whether the message has been read by admin |

## Collection 11. admin_users
Contains administrator account information

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each admin user |
| username | String | Admin username for login |
| password | String | Admin password (hashed in production) |
| name | String | Full name of the admin |
| role | String | Admin role (admin/super_admin) |

## Collection 12. about_content
Contains content for About Us sections

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Unique identifier for each content item |
| section | String | Section type (history/vision_mission/organization/organization_chart/contact) |
| content | Object | Section-specific content data |
| updatedAt | DateTime | Timestamp when content was last updated |
| updatedBy | String | ID of user who last updated the content |

### About Content - History Section
| Column Name | Data Type | Description |
|------------|-----------|-------------|
| year | Number | Year of the historical event |
| title | String | Title of the historical event |
| description | String | Description of the event |
| order | Number | Display order |

### About Content - Vision Mission Section
| Column Name | Data Type | Description |
|------------|-----------|-------------|
| vision | String | Organization vision statement |
| mission | String | Organization mission statement |
| goals | Array | Array of goal strings |

### About Content - Organization Section
| Column Name | Data Type | Description |
|------------|-----------|-------------|
| position | String | Position title |
| name | String | Name of the member |
| batch | String | Batch year |
| level | String | Organization level (president/vicePresident/executive) |
| order | Number | Display order |

### About Content - Organization Chart Section
| Column Name | Data Type | Description |
|------------|-----------|-------------|
| imageUrl | String | URL to organization chart image |
| title | String | Chart title |
| description | String | Chart description |

### About Content - Contact Section
| Column Name | Data Type | Description |
|------------|-----------|-------------|
| address | String | Physical address |
| email | String | Contact email |
| phone | String | Contact phone number |
| supportEmail | String | Support email |
| supportPhone | String | Support phone number |

## Collection 13. landing_config
Contains landing page configuration

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| id | String | Configuration document ID (always 'main') |
| updatedAt | DateTime | Timestamp when configuration was last updated |
| updatedBy | String | ID of user who last updated the configuration |

---

## Database Technology
- **Platform**: Firebase Firestore (NoSQL Cloud Database)
- **Authentication**: Firebase Authentication (planned)
- **Storage**: Firebase Storage for images and files

## Key Features
- Real-time data synchronization
- Offline data persistence
- Scalable cloud infrastructure
- Document-based data model
- Flexible schema design
- Built-in security rules

## Relationships
- `users.id` → `posts.userId`
- `users.id` → `alumni_records.userId`
- `alumni_records.alumniId` → `alumni_officers.alumniId`
- `users.id` → `jobs.postedBy`
- `users.id` → `events.createdBy`
- `users.id` → `gallery_items.postedBy`
- `events.id` → `notifications.sourceId` (when type='event')
- `jobs.id` → `notifications.sourceId` (when type='job')
- `donations.id` → `notifications.sourceId` (when type='donation')
