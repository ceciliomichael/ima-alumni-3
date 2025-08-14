import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import './FeelingSelector.css';

interface Feeling {
  emoji: string;
  text: string;
}

interface FeelingSelectorProps {
  onSelectFeeling: (feeling: Feeling | null) => void;
  onClose: () => void;
  selectedFeeling: Feeling | null;
}

const FeelingSelector: React.FC<FeelingSelectorProps> = ({ 
  onSelectFeeling, 
  onClose,
  selectedFeeling
}) => {
  const [searchText, setSearchText] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const feelings: Feeling[] = [
    { emoji: '😊', text: 'happy' },
    { emoji: '😃', text: 'excited' },
    { emoji: '🥰', text: 'loved' },
    { emoji: '😎', text: 'cool' },
    { emoji: '🤔', text: 'thoughtful' },
    { emoji: '😢', text: 'sad' },
    { emoji: '😡', text: 'angry' },
    { emoji: '😴', text: 'sleepy' },
    { emoji: '🤒', text: 'sick' },
    { emoji: '🥳', text: 'celebrating' },
    { emoji: '😌', text: 'blessed' },
    { emoji: '🙏', text: 'thankful' },
    { emoji: '❤️', text: 'in love' },
    { emoji: '👨‍💻', text: 'working' },
    { emoji: '📚', text: 'studying' },
    { emoji: '🏃', text: 'active' },
    { emoji: '✈️', text: 'traveling' },
    { emoji: '🎮', text: 'gaming' },
    { emoji: '🎵', text: 'musical' },
    { emoji: '🍽️', text: 'hungry' }
  ];

  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const filteredFeelings = feelings.filter(feeling => 
    feeling.text.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = (feeling: Feeling) => {
    onSelectFeeling(feeling);
    onClose();
  };

  const clearFeeling = () => {
    onSelectFeeling(null);
  };

  return (
    <div className="feeling-selector-backdrop">
      <div className="feeling-selector-container" ref={modalRef}>
        <div className="feeling-selector-header">
          <h3>How are you feeling?</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {selectedFeeling ? (
          <div className="selected-feeling">
            <div className="feeling-item" onClick={clearFeeling}>
              <span className="feeling-emoji">{selectedFeeling.emoji}</span>
              <span className="feeling-text">
                feeling <b>{selectedFeeling.text}</b>
              </span>
              <button className="clear-feeling-btn">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="feeling-search">
              <input
                type="text"
                placeholder="Search feelings..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="feelings-grid">
              {filteredFeelings.length > 0 ? (
                filteredFeelings.map((feeling, index) => (
                  <div
                    key={index}
                    className="feeling-item"
                    onClick={() => handleSelect(feeling)}
                  >
                    <span className="feeling-emoji">{feeling.emoji}</span>
                    <span className="feeling-text">{feeling.text}</span>
                  </div>
                ))
              ) : (
                <div className="no-feelings">
                  No feelings match your search
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeelingSelector; 