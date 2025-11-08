import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import EventNotification from './EventNotification';
import { Event } from '../../../../services/firebase/eventService';

interface EventNotificationData {
  id: string;
  title: string;
  date: string;
  location: string;
  timestamp: number;
}

const EventNotificationsContainer = () => {
  const [notifications, setNotifications] = useState<EventNotificationData[]>([]);
  const eventInitializedRef = useRef<boolean>(false);
  const previousEventsRef = useRef<Map<string, boolean>>(new Map());

  // Set up event notifications listener
  useEffect(() => {
    const eventsRef = collection(db, 'events');

    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      // First snapshot is the current data; initialize previous state
      if (!eventInitializedRef.current) {
        snapshot.docs.forEach((doc) => {
          const event = doc.data() as Event;
          previousEventsRef.current.set(doc.id, event.isApproved || false);
        });
        eventInitializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const event = {
            id: change.doc.id,
            ...change.doc.data()
          } as Event;

          // Check if event was just approved (transition from unapproved to approved)
          const wasApproved = previousEventsRef.current.get(event.id) || false;

          if (event.isApproved && !wasApproved) {
            const notification: EventNotificationData = {
              id: `event-${event.id}-${Date.now()}`,
              title: event.title,
              date: event.date,
              location: event.location,
              timestamp: Date.now()
            };

            setNotifications(prev => [notification, ...prev].slice(0, 10));
          }
          
          // Update previous state
          previousEventsRef.current.set(event.id, event.isApproved || false);
        }
      });
    }, (error) => {
      console.error('Realtime event notifications error:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleCloseNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {notifications.map((notification) => (
        <EventNotification
          key={notification.id}
          notification={notification}
          onClose={handleCloseNotification}
        />
      ))}
    </>
  );
};

export default EventNotificationsContainer;

