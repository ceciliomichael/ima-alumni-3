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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Donation, DonationReport } from '../../types';
import { createDonationNotification, deleteNotificationsBySourceId } from './notificationService';

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

// Helper function to extract archive metadata from date
const extractArchiveMetadata = (dateString: string) => {
  const date = new Date(dateString);
  return {
    archiveMonth: date.getMonth() + 1, // 1-12
    archiveYear: date.getFullYear()
  };
};

// Add new donation
export const addDonation = async (donation: Omit<Donation, 'id'>): Promise<string> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    const archiveMetadata = extractArchiveMetadata(donation.donationDate);
    
    const newDonation = {
      ...donation,
      ...archiveMetadata,
      isAnonymous: donation.isAnonymous || false, // Ensure isAnonymous has a default value
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(donationsRef, newDonation);
    
    // Create a notification for this donation if it's public (including test items)
    if (donation.isPublic) {
      try {
        await createDonationNotification(
          donation.donorName,
          donation.amount,
          donation.currency,
          donation.isAnonymous || false,
          docRef.id // Pass the donation ID to prevent duplicates
        );
      } catch (notificationError) {
        console.error('Failed to create donation notification:', notificationError);
        // Don't throw - donation was created successfully even if notification fails
      }
    }
    
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      ...donation,
      updatedAt: serverTimestamp()
    };
    
    // Update archive metadata if donation date is changed
    if (donation.donationDate) {
      const archiveMetadata = extractArchiveMetadata(donation.donationDate);
      Object.assign(updateData, archiveMetadata);
    }
    
    await updateDoc(donationRef, updateData);
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
    
    // Delete associated notifications
    try {
      await deleteNotificationsBySourceId(id);
    } catch (notificationError) {
      console.error('Failed to delete donation notifications:', notificationError);
      // Don't throw - donation was deleted successfully
    }
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

// Get donations by month and year
export const getDonationsByPeriod = async (
  month?: number,
  year?: number
): Promise<Donation[]> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    let q = query(donationsRef, orderBy('donationDate', 'desc'));

    if (year !== undefined) {
      q = query(donationsRef, where('archiveYear', '==', year), orderBy('donationDate', 'desc'));
      
      if (month !== undefined) {
        q = query(
          donationsRef,
          where('archiveYear', '==', year),
          where('archiveMonth', '==', month),
          orderBy('donationDate', 'desc')
        );
      }
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Donation[];
  } catch (error) {
    console.error('Error getting donations by period:', error);
    throw error;
  }
};

// Generate donation report
export const generateDonationReport = async (
  startDate?: string,
  endDate?: string,
  category?: string,
  donorName?: string
): Promise<DonationReport> => {
  try {
    let donations = await getAllDonations();

    // Apply filters
    if (startDate) {
      donations = donations.filter(d => new Date(d.donationDate) >= new Date(startDate));
    }
    if (endDate) {
      donations = donations.filter(d => new Date(d.donationDate) <= new Date(endDate));
    }
    if (category && category !== 'All Categories') {
      donations = donations.filter(d => d.category === category);
    }
    if (donorName) {
      const term = donorName.toLowerCase();
      donations = donations.filter(d => d.donorName.toLowerCase().includes(term));
    }

    // Calculate aggregates
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const count = donations.length;
    const avgAmount = count > 0 ? totalAmount / count : 0;

    // Group by category
    const byCategory: Record<string, { amount: number; count: number }> = {};
    donations.forEach(d => {
      if (!byCategory[d.category]) {
        byCategory[d.category] = { amount: 0, count: 0 };
      }
      byCategory[d.category].amount += d.amount;
      byCategory[d.category].count += 1;
    });

    // Group by month
    const byMonth: Record<string, { amount: number; count: number }> = {};
    donations.forEach(d => {
      const date = new Date(d.donationDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { amount: 0, count: 0 };
      }
      byMonth[monthKey].amount += d.amount;
      byMonth[monthKey].count += 1;
    });

    // Group by year
    const byYear: Record<string, { amount: number; count: number }> = {};
    donations.forEach(d => {
      const date = new Date(d.donationDate);
      const yearKey = `${date.getFullYear()}`;
      if (!byYear[yearKey]) {
        byYear[yearKey] = { amount: 0, count: 0 };
      }
      byYear[yearKey].amount += d.amount;
      byYear[yearKey].count += 1;
    });

    return {
      totalAmount,
      count,
      avgAmount,
      byCategory,
      byMonth,
      byYear,
      donations
    };
  } catch (error) {
    console.error('Error generating donation report:', error);
    throw error;
  }
};

// Migrate existing donations to add archive metadata
export const migrateExistingDonations = async (): Promise<void> => {
  try {
    const donations = await getAllDonations();
    const donationsToUpdate = donations.filter(
      d => d.archiveMonth === undefined || d.archiveYear === undefined
    );

    console.log(`Migrating ${donationsToUpdate.length} donations...`);

    for (const donation of donationsToUpdate) {
      const archiveMetadata = extractArchiveMetadata(donation.donationDate);
      await updateDonation(donation.id, archiveMetadata as Partial<Donation>);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error migrating donations:', error);
    throw error;
  }
};

// Add initialization function
export const initializeDonationData = async (): Promise<void> => {
  try {
    const donationsRef = collection(db, DONATIONS_COLLECTION);
    await getDocs(donationsRef);
    
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