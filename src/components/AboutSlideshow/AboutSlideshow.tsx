import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Target, CheckSquare } from 'lucide-react';
import { HistoryItem, VisionMissionContent } from '../../services/firebase/aboutService';
import './AboutSlideshow.css';

export type SlideshowType = 'history' | 'vision';

interface BaseSlide {
  id: string;
  title: string;
  content: string;
}

interface HistorySlide extends BaseSlide {
  year: number;
}

interface VisionSlide extends BaseSlide {
  icon: 'eye' | 'target' | 'check';
}

interface AboutSlideshowProps {
  type: SlideshowType;
  historyItems?: HistoryItem[];
  visionMission?: VisionMissionContent | null;
  autoPlayMs?: number;
}

const AboutSlideshow = ({ 
  type, 
  historyItems = [], 
  visionMission, 
  autoPlayMs = 5000 
}: AboutSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Get slides based on type
  const getSlides = (): (HistorySlide | VisionSlide)[] => {
    if (type === 'history') {
      return historyItems.map(item => ({
        id: item.id,
        title: item.title,
        content: item.description,
        year: item.year
      }));
    } else if (type === 'vision' && visionMission) {
      const slides: VisionSlide[] = [
        {
          id: 'vision',
          title: 'Vision',
          content: visionMission.vision,
          icon: 'eye'
        },
        {
          id: 'mission',
          title: 'Mission',
          content: visionMission.mission,
          icon: 'target'
        }
      ];
      
      if (visionMission.goals) {
        slides.push(...visionMission.goals.map((goal, index) => ({
          id: `goal-${index}`,
          title: `Goal ${index + 1}`,
          content: goal,
          icon: 'check' as const
        })));
      }
      
      return slides;
    }
    return [];
  };

  const slides = getSlides();

  useEffect(() => {
    if (!isPaused && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        );
      }, autoPlayMs);

      return () => clearInterval(interval);
    }
  }, [isPaused, slides.length, autoPlayMs]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === slides.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (slides.length === 0) {
    return (
      <div className="slideshow-empty">
        <p>No content available at the moment.</p>
      </div>
    );
  }

  const getIcon = (iconType: 'eye' | 'target' | 'check') => {
    const iconClass = "slide-icon-svg";
    switch (iconType) {
      case 'eye':
        return <Eye className={iconClass} size={32} />;
      case 'target':
        return <Target className={iconClass} size={32} />;
      case 'check':
        return <CheckSquare className={iconClass} size={32} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="about-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slideshow Container */}
      <div className="slideshow-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slideshow-slide ${
              index === currentIndex ? 'active' : ''
            } ${index < currentIndex ? 'prev' : ''} ${index > currentIndex ? 'next' : ''} ${
              type === 'vision' && 'icon' in slide && (slide as VisionSlide).icon === 'check' ? 'goal-slide' : ''
            } ${
              type === 'vision' && 'icon' in slide && (slide as VisionSlide).icon === 'eye' ? 'vision-slide' : ''
            } ${
              type === 'vision' && 'icon' in slide && (slide as VisionSlide).icon === 'target' ? 'mission-slide' : ''
            } ${
              type === 'history' ? 'history-slide' : ''
            }`}
          >
            <div className="slide-content">
              <div className={`slide-header ${
                type === 'vision' && 'icon' in slide && (slide as VisionSlide).icon === 'check' ? 'goal-header' : ''
              } ${
                type === 'history' ? 'history-header' : ''
              }`}>
                {type === 'history' && 'year' in slide && (
                  <div className="slide-year">{(slide as HistorySlide).year}</div>
                )}
                {type === 'vision' && 'icon' in slide && (
                  <div className="slide-icon">
                    {getIcon((slide as VisionSlide).icon)}
                  </div>
                )}
                <h3 className="slide-title">{slide.title}</h3>
              </div>
              <div className="slide-text">
                <p>{slide.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button 
            className="slideshow-nav-btn prev-btn"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            className="slideshow-nav-btn next-btn"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="slideshow-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slideshow-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="slideshow-counter">
            {currentIndex + 1} / {slides.length}
          </div>
        </>
      )}
    </div>
  );
};

export default AboutSlideshow;