import React from 'react';
import './ImagePlaceholder.css';

interface ImagePlaceholderProps {
  shape?: 'circle' | 'square' | 'rectangle';
  width?: string;
  height?: string;
  color?: string;
  text?: string;
  recommendedSize?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  isAvatar?: boolean;
}

const ImagePlaceholder = ({
  shape = 'rectangle',
  width = '100%',
  height = '150px',
  color = '#3498db',
  text,
  recommendedSize = '800x600px',
  name = '',
  size = 'medium',
  className = '',
  isAvatar = false
}: ImagePlaceholderProps) => {
  const borderRadius = shape === 'circle' ? '50%' : shape === 'square' ? '8px' : '4px';
  
  // Generate a stable background color based on name
  const getColorFromName = (name: string) => {
    if (!name) return '#3498db';
    const colors = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22', '#e74c3c', '#d35400', '#c0392b'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  };

  // Get user's initials
  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };
  
  // Determine size based on prop
  let avatarSize, fontSize;
  if (isAvatar) {
    switch(size) {
      case 'small':
        avatarSize = '32px';
        fontSize = '14px';
        break;
      case 'large':
        avatarSize = '100px';
        fontSize = '36px';
        break;
      case 'medium':
      default:
        avatarSize = '48px';
        fontSize = '20px';
        break;
    }
  }

  if (isAvatar) {
    return (
      <div 
        className={`default-avatar ${className}`}
        style={{
          backgroundColor: getColorFromName(name),
          borderRadius: '50%',
          width: avatarSize,
          height: avatarSize,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontWeight: 'bold',
          textAlign: 'center',
          overflow: 'hidden',
          userSelect: 'none',
          lineHeight: '1',
          fontSize: fontSize,
          textTransform: 'uppercase',
          objectFit: 'cover'
        }}
      >
        {getInitials(name)}
      </div>
    );
  }
  
  return (
    <div 
      className={`image-placeholder ${className}`}
      style={{
        backgroundColor: color,
        borderRadius,
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {text && <div style={{ fontSize: '24px', marginBottom: '5px' }}>{text}</div>}
      {recommendedSize && <div style={{ fontSize: '12px', opacity: 0.8 }}>Recommended: {recommendedSize}</div>}
    </div>
  );
};

export default ImagePlaceholder; 