import { useState, useEffect } from 'react';
import { Eye, Target, CheckSquare } from 'lucide-react';
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play logic
  useEffect(() => {
    if (!isPaused && slides.length > 1) {
      const interval = setInterval(goToNext, autoPlayMs);
      return () => clearInterval(interval);
    }
  }, [isPaused, slides.length, autoPlayMs]);

  // Touch handlers for swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
    setIsPaused(false);
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
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

      {/* Navigation Controls (Arrows removed as requested, Dots kept) */}
      {slides.length > 1 && (
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
      )}
    </div>
  );
};

export default AboutSlideshow;