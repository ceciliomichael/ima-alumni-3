# ImagePlaceholder Component

A versatile component that provides both general image placeholders and beautiful, consistent user avatars throughout the application.

## Features

- **Default Avatars**: Creates visually appealing user avatars with initials when profile images aren't available
- **Consistent Sizing**: Ensures avatars are displayed at the right size without stretching or zooming issues
- **Size Options**: Small, medium, and large avatar size options
- **Color Generation**: Creates a unique, consistent color for each user based on their name
- **Regular Image Placeholders**: Can also be used for general image placeholders in various shapes

## Usage

### As a User Avatar

```jsx
import ImagePlaceholder from 'components/ImagePlaceholder';

// Basic usage (medium size default)
<ImagePlaceholder 
  isAvatar 
  name="John Doe" 
/>

// Small size avatar
<ImagePlaceholder 
  isAvatar 
  size="small"
  name="Alice Smith" 
/>

// Large size avatar
<ImagePlaceholder 
  isAvatar 
  size="large"
  name="Bob Johnson" 
/>

// With additional class name
<ImagePlaceholder 
  isAvatar 
  name="Sarah Wilson"
  className="custom-avatar"
/>
```

### Conditional Usage (Profile Image Fallback)

```jsx
// When a user might or might not have a profile image
{user.profileImage ? (
  <img 
    src={user.profileImage} 
    alt={user.name || 'User Avatar'} 
    className="profile-image"
  />
) : (
  <ImagePlaceholder 
    isAvatar 
    size="medium" 
    name={user.name || ''} 
  />
)}
```

### As a General Image Placeholder

```jsx
// Default rectangle placeholder
<ImagePlaceholder 
  text="Upload an image" 
  recommendedSize="800x600px"
/>

// Square placeholder
<ImagePlaceholder 
  shape="square"
  width="200px"
  height="200px"
  text="Add Photo" 
/>

// Circle placeholder (not avatar)
<ImagePlaceholder 
  shape="circle"
  width="150px"
  height="150px"
  color="#e74c3c"
  text="+" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isAvatar` | boolean | `false` | Set to `true` to use as an avatar with initials |
| `name` | string | `''` | User's name (used to generate initials and color for avatars) |
| `size` | 'small' \| 'medium' \| 'large' | `'medium'` | Size of the avatar (only applicable when `isAvatar` is true) |
| `shape` | 'circle' \| 'square' \| 'rectangle' | `'rectangle'` | Shape of the general image placeholder |
| `width` | string | `'100%'` | Width of the general image placeholder |
| `height` | string | `'150px'` | Height of the general image placeholder |
| `color` | string | `'#3498db'` | Background color of the general image placeholder |
| `text` | string | `undefined` | Text to display in the general image placeholder |
| `recommendedSize` | string | `'800x600px'` | Recommended image size to display in the general image placeholder |
| `className` | string | `''` | Additional CSS class to apply | 