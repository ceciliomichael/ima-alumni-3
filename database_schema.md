# Database Design

The following collections contain the design and information used in the IMA Alumni Management System.

## Collection 1. users
Contains user account information for the alumni system.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
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

## Collection 2. alumni_records
Contains comprehensive alumni records and information.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each alumni record |
| name | String | Full name of the alumni |
| email | String | Email address |
| alumniId | String | Alumni ID for authentication |
| batch | String | Graduation batch/year |
| isActive | Boolean | Whether the alumni record is active |
| dateRegistered | DateTime | Timestamp when alumni was registered |
| position | String | Current position/title |
| profileImage | String | URL to profile image |
| userId | String | Reference to linked user account ID |

## Collection 3. posts
Contains social media posts created by users.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each post |
| userId | String | Reference to user who created the post |
| userName | String | Name of the user who created the post |
| userImage | String | Profile image of the user |
| content | String | Text content of the post |
| images | Array | Array of image URLs attached to the post |
| feeling | Object | Feeling/emotion data (emoji, text) |
| createdAt | DateTime | Timestamp when post was created |
| likedBy | Array | Array of user IDs who liked the post |
| comments | Array | Array of comment objects |

## Collection 4. events
Contains information about alumni events.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each event |
| title | String | Event title |
| description | String | Event description |
| location | String | Event location |
| date | DateTime | Event date and time |
| isApproved | Boolean | Whether the event is approved |
| createdBy | String | User ID who created the event |
| coverImage | String | URL to event cover image |
| createdAt | DateTime | Timestamp when event was created |

## Collection 5. jobs
Contains job posting information.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each job |
| title | String | Job title |
| company | String | Company name |
| location | String | Job location |
| description | String | Job description |
| requirements | String | Job requirements |
| contactEmail | String | Contact email for applications |
| postedDate | DateTime | Date when job was posted |
| isApproved | Boolean | Whether the job posting is approved |
| postedBy | String | User ID who posted the job |
| salary | String | Salary information |
| applicationType | String | Application type (email, website, inPerson) |
| applicationUrl | String | URL for job applications |
| deadline | DateTime | Application deadline |
| jobType | String | Job type (fullTime, partTime, contract, internship) |
| companyLogo | String | Company logo URL or base64 encoded image |

## Collection 6. gallery_items
Contains gallery photos and albums.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each gallery item |
| title | String | Title of the gallery item |
| description | String | Description of the gallery item |
| imageUrl | String | Primary image URL |
| images | Array | Array of image objects for albums |
| albumId | String | Album identifier for grouping images |
| albumTitle | String | Title of the album |
| imageOrder | Number | Order of image within album |
| isAlbum | Boolean | Whether this is part of an album |
| albumCategory | String | Category of the album |
| event | String | Associated event ID |
| postedDate | DateTime | Date when item was posted |
| isApproved | Boolean | Whether the gallery item is approved |
| postedBy | String | User ID who posted the item |
| likedBy | Array | Array of user IDs who liked the item |
| bookmarkedBy | Array | Array of user IDs who bookmarked the item |

## Collection 7. alumni_officers
Contains information about alumni officers and their positions.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each officer position |
| title | String | Officer position title |
| alumniId | String | Reference to alumni record ID |
| batchYear | String | Batch year for batch-specific positions |
| startDate | DateTime | Start date of the officer term |
| endDate | DateTime | End date of the officer term |

## Collection 8. donations
Contains donation records and information.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each donation |
| donorName | String | Name of the donor |
| donorEmail | String | Email address of the donor |
| amount | Number | Donation amount |
| currency | String | Currency of the donation |
| purpose | String | Purpose of the donation |
| category | String | Category of the donation |
| description | String | Additional description |
| isPublic | Boolean | Whether the donation is publicly visible |
| isAnonymous | Boolean | Whether the donor wishes to remain anonymous |
| donationDate | DateTime | Date of the donation |
| createdAt | Timestamp | Firestore timestamp when record was created |
| updatedAt | Timestamp | Firestore timestamp when record was updated |

## Collection 9. contact_messages
Contains contact form messages from visitors.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each message |
| name | String | Name of the message sender |
| email | String | Email address of the sender |
| subject | String | Subject of the message |
| message | String | Message content |
| createdAt | DateTime | Timestamp when message was created |
| isRead | Boolean | Whether the message has been read by admin |

## Collection 10. about_content
Contains content for the About Us page sections.

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | String | Unique identifier for each content item |
| section | String | Section type (history, vision_mission, organization, organization_chart, contact) |
| content | Object | Content data specific to the section type |
| updatedAt | DateTime | Timestamp when content was last updated |
| updatedBy | String | User ID who last updated the content |

## Relationships

### Primary Relationships
- **users.id** ← **alumni_records.userId** (One-to-One): Links user accounts to alumni records
- **alumni_records.id** ← **alumni_officers.alumniId** (One-to-Many): Links alumni to their officer positions
- **users.id** ← **posts.userId** (One-to-Many): Links users to their posts
- **users.id** ← **events.createdBy** (One-to-Many): Links users to events they created
- **users.id** ← **jobs.postedBy** (One-to-Many): Links users to jobs they posted
- **users.id** ← **gallery_items.postedBy** (One-to-Many): Links users to gallery items they posted

### Secondary Relationships
- **events.id** ← **gallery_items.event** (One-to-Many): Links events to their gallery items
- **gallery_items.albumId** groups multiple gallery items into albums
- **users.following** and **users.followers** create Many-to-Many relationships between users

## Data Access Patterns

### Dashboard Statistics
The system provides comprehensive statistics through parallel data fetching:
- Alumni statistics (total, by batch, active/inactive)
- Event statistics (total, upcoming, past, approved/pending)
- Job statistics (total, by type, active/expired, approved/pending)
- Gallery statistics (total items, approved/pending)

### Content Management
- Complete CRUD operations for all collections
- Real-time data binding for dashboard updates
- Batch operations for CSV imports
- Approval workflows for user-generated content

### Security Considerations
- User passwords should be properly hashed in production
- Alumni ID validation for authentication
- Admin approval required for new user accounts
- Content moderation for posts, events, jobs, and gallery items

## Migration Notes

The current Firebase implementation can be migrated to other databases:
- PostgreSQL: Collections become tables with proper foreign key relationships
- MySQL: Similar table structure with appropriate data types
- Supabase: Direct migration path with real-time subscriptions
- The service layer abstracts database operations for easy migration
