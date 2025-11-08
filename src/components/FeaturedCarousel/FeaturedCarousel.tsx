import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './FeaturedCarousel.css';

export type FeaturedCarouselProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderFeatured: (item: T) => React.ReactNode;
  renderThumb: (item: T, isActive: boolean) => React.ReactNode;
  initialIndex?: number;
  autoplayMs?: number;
  loop?: boolean;
  className?: string;
};

function FeaturedCarousel<T>({
  items,
  getKey,
  renderFeatured,
  renderThumb,
  initialIndex = 0,
  autoplayMs,
  loop = true,
  className = ''
}: FeaturedCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const goToSlide = useCallback((index: number) => {
    if (items.length === 0) return;

    let newIndex = index;
    if (loop) {
      newIndex = ((index % items.length) + items.length) % items.length;
    } else {
      newIndex = Math.max(0, Math.min(index, items.length - 1));
    }

    setCurrentIndex(newIndex);

    // Scroll thumbnail into view
    if (thumbsRef.current) {
      const thumbElements = thumbsRef.current.children;
      const activeThumb = thumbElements[newIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [items.length, loop]);

  const goToPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  // Autoplay
  useEffect(() => {
    if (!autoplayMs || isPaused || items.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoplayMs);

    return () => clearInterval(interval);
  }, [autoplayMs, isPaused, items.length, goToNext]);

  // Reset currentIndex when items array changes and current item is no longer available
  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [items]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    if (featuredRef.current) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [goToPrev, goToNext]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  if (items.length === 0) {
    return null;
  }

  const showArrows = items.length > 1;
  const canGoPrev = loop || currentIndex > 0;
  const canGoNext = loop || currentIndex < items.length - 1;

  return (
    <div 
      className={`featured-carousel ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Featured Panel */}
      <div 
        className="featured-panel"
        ref={featuredRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="featured-content">
          {items.length > 0 && currentIndex < items.length ? renderFeatured(items[currentIndex]) : null}
        </div>

        {/* Navigation Arrows */}
        {showArrows && (
          <>
            <button
              className="featured-arrow featured-arrow-left"
              onClick={goToPrev}
              disabled={!canGoPrev}
              aria-label="Previous item"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="featured-arrow featured-arrow-right"
              onClick={goToNext}
              disabled={!canGoNext}
              aria-label="Next item"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="featured-counter">
          {currentIndex + 1} / {items.length}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {items.length > 1 && (
        <div className="thumbnails-container">
          <div className="thumbnails-strip" ref={thumbsRef}>
            {items.map((item, index) => (
              <button
                key={getKey(item)}
                className={`thumbnail-item ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to item ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              >
                {renderThumb(item, index === currentIndex)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturedCarousel;

