import React from 'react';
import ImagePlaceholder from './ImagePlaceholder';

const AvatarExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      <h2>Avatar Examples</h2>
      
      <div>
        <h3>Small Avatars</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ImagePlaceholder 
            isAvatar 
            size="small" 
            name="John Doe" 
          />
          <ImagePlaceholder 
            isAvatar 
            size="small" 
            name="Alice Smith" 
          />
          <ImagePlaceholder 
            isAvatar 
            size="small" 
            name="Bob Johnson" 
          />
          <ImagePlaceholder 
            isAvatar 
            size="small" 
            name="" 
          />
        </div>
      </div>

      <div>
        <h3>Medium Avatars (Default)</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ImagePlaceholder 
            isAvatar 
            name="John Doe" 
          />
          <ImagePlaceholder 
            isAvatar 
            name="Alice Smith" 
          />
          <ImagePlaceholder 
            isAvatar 
            name="Bob Johnson" 
          />
          <ImagePlaceholder 
            isAvatar 
            name="" 
          />
        </div>
      </div>

      <div>
        <h3>Large Avatars</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ImagePlaceholder 
            isAvatar 
            size="large" 
            name="John Doe" 
          />
          <ImagePlaceholder 
            isAvatar 
            size="large" 
            name="Alice Smith" 
          />
          <ImagePlaceholder 
            isAvatar 
            size="large" 
            name="Bob Johnson" 
          />
          <ImagePlaceholder 
            isAvatar 
            size="large" 
            name="" 
          />
        </div>
      </div>

      <div>
        <h3>Usage in Components</h3>
        <p>Example of how to integrate in your components:</p>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {`// User has no profile image
if (!user.profileImage) {
  return (
    <ImagePlaceholder 
      isAvatar 
      size="medium" 
      name={user.name || ''} 
    />
  );
}

// User has a profile image
return <img src={user.profileImage} alt={user.name} />;`}
        </pre>
      </div>
    </div>
  );
};

export default AvatarExample; 