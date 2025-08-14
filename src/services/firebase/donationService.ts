import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Donation } from '../../types';

const DONATIONS_COLLECTION = 'donations';

// Get all donations
export const getAllDonations = async (): Promise<Donation[]> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    const q = query(donationsRef, orderBy('donationDate', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Donation[];
  } catch (error) {
    console.error('Error getting donations:', error);
    throw error;
  }
};

// Get featured/public donations only
export const getPublicDonations = async (): Promise<Donation[]> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    const q = query(
      donationsRef, 
      where('isPublic', '==', true),
      orderBy('donationDate', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Donation[];
  } catch (error) {
    console.error('Error getting public donations:', error);
    throw error;
  }
};

// Add new donation
export const addDonation = async (donation: Omit<Donation, 'id'>): Promise<string> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    const newDonation = {
      ...donation,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(donationsRef, newDonation);
    return docRef.id;
  } catch (error) {
    console.error('Error adding donation:', error);
    throw error;
  }
};

// Update donation
export const updateDonation = async (id: string, donation: Partial<Donation>): Promise<void> => {
  try {
    const donationRef = doc(db, DONATIONS_COLLECTION, id);
    await updateDoc(donationRef, {
      ...donation,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
};

// Delete donation
export const deleteDonation = async (id: string): Promise<void> => {
  try {
    const donationRef = doc(db, DONATIONS_COLLECTION, id);
    await deleteDoc(donationRef);
  } catch (error) {
    console.error('Error deleting donation:', error);
    throw error;
  }
};

// Toggle donation visibility (public/private)
export const toggleDonationVisibility = async (id: string, isPublic: boolean): Promise<void> => {
  try {
    const donationRef = doc(db, DONATIONS_COLLECTION, id);
    await updateDoc(donationRef, {
      isPublic,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating donation visibility:', error);
    throw error;
  }
};

// Add initialization function
export const initializeDonationData = async (): Promise<void> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    const snapshot = await getDocs(donationsRef);
    
    // If no donations exist, initialize with some sample donations
    // if (snapshot.empty) {
    //   console.log('Initializing sample donation data...');
      
    //   const sampleDonations = [
    //     {
    //       donorName: 'Juan Dela Cruz',
    //       donorEmail: 'juan@example.com',
    //       amount: 5000,
    //       currency: 'PHP',
    //       purpose: 'Computer Lab Equipment',
    //       category: 'Equipment Fund',
    //       description: 'Donation for new computers in the alumni computer laboratory.',
    //       isPublic: true,
    //       donationDate: new Date(2023, 5, 15).toISOString(),
    //       createdAt: serverTimestamp()
    //     },
    //     {
    //       donorName: 'Maria Santos',
    //       donorEmail: 'maria@example.com',
    //       amount: 10000,
    //       currency: 'PHP',
    //       purpose: 'Scholarship for Deserving Students',
    //       category: 'Scholarship Fund',
    //       description: 'Annual donation to support students from low-income families.',
    //       isPublic: true,
    //       donationDate: new Date(2023, 6, 22).toISOString(),
    //       createdAt: serverTimestamp()
    //     },
    //     {
    //       donorName: 'Anonymous Donor',
    //       amount: 2500,
    //       currency: 'PHP',
    //       purpose: 'Library Book Collection',
    //       category: 'Library Fund',
    //       description: 'For purchasing new books for the school library.',
    //       isPublic: true,
    //       donationDate: new Date(2023, 7, 8).toISOString(),
    //       createdAt: serverTimestamp()
    //     },
    //     {
    //       donorName: 'Pedro Reyes',
    //       donorEmail: 'pedro@example.com',
    //       amount: 7500,
    //       currency: 'PHP',
    //       purpose: 'Alumni Homecoming Event',
    //       category: 'Special Projects',
    //       description: 'Sponsorship for the upcoming alumni homecoming celebration.',
    //       isPublic: true,
    //       donationDate: new Date(2023, 8, 12).toISOString(),
    //       createdAt: serverTimestamp()
    //     },
    //     {
    //       donorName: 'Anonymous',
    //       amount: 15000,
    //       currency: 'PHP',
    //       purpose: 'School Building Renovation',
    //       category: 'Building Fund',
    //       description: 'Contribution to help renovate the east wing of the main school building.',
    //       isPublic: true,
    //       donationDate: new Date(2023, 9, 5).toISOString(),
    //       createdAt: serverTimestamp()
    //     }
    //   ];
      
    //   for (const donation of sampleDonations) {
    //     await addDoc(collection(db, DONATIONS_COLLECTION), donation);
    //   }
      
    //   console.log('Sample donation data initialized successfully');
    // }
  } catch (error) {
    console.error('Error initializing donation data:', error);
    throw error;
  }
}; 