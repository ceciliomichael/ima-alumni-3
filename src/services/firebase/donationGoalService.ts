import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { DonationGoal } from '../../types';

const DONATION_GOALS_COLLECTION = 'donation_goals';

// Get the currently active goal (the one to display publicly)
export const getActiveGoal = async (): Promise<DonationGoal | null> => {
  try {
    const goalsRef = collection(db, DONATION_GOALS_COLLECTION);
    const q = query(
      goalsRef,
      where('isActive', '==', true),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const goalDoc = snapshot.docs[0];
    return {
      id: goalDoc.id,
      ...goalDoc.data()
    } as DonationGoal;
  } catch (error) {
    console.error('Error getting active goal:', error);
    throw error;
  }
};

// Get all donation goals
export const getAllGoals = async (): Promise<DonationGoal[]> => {
  try {
    const goalsRef = collection(db, DONATION_GOALS_COLLECTION);
    const snapshot = await getDocs(goalsRef);
    
    return snapshot.docs.map(goalDoc => ({
      id: goalDoc.id,
      ...goalDoc.data()
    })) as DonationGoal[];
  } catch (error) {
    console.error('Error getting all goals:', error);
    throw error;
  }
};

// Get goal for a specific period
export const getGoalForPeriod = async (
  goalType: 'monthly' | 'yearly',
  year: number,
  month?: number
): Promise<DonationGoal | null> => {
  try {
    const goalsRef = collection(db, DONATION_GOALS_COLLECTION);
    let q;

    if (goalType === 'monthly' && month !== undefined) {
      q = query(
        goalsRef,
        where('goalType', '==', 'monthly'),
        where('year', '==', year),
        where('month', '==', month)
      );
    } else {
      q = query(
        goalsRef,
        where('goalType', '==', 'yearly'),
        where('year', '==', year)
      );
    }

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const goalDoc = snapshot.docs[0];
    return {
      id: goalDoc.id,
      ...goalDoc.data()
    } as DonationGoal;
  } catch (error) {
    console.error('Error getting goal for period:', error);
    throw error;
  }
};

// Create or update a donation goal
export const saveGoal = async (
  goalData: Omit<DonationGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    // Check if goal for this period already exists
    const existingGoal = await getGoalForPeriod(
      goalData.goalType,
      goalData.year,
      goalData.goalType === 'monthly' ? goalData.month : undefined
    );

    if (existingGoal) {
      // Update existing goal - build clean update object
      const updateData: Partial<DonationGoal> = {
        goalType: goalData.goalType,
        amount: goalData.amount,
        year: goalData.year,
        isActive: goalData.isActive
      };
      // Only include month for monthly goals
      if (goalData.goalType === 'monthly' && goalData.month !== undefined) {
        updateData.month = goalData.month;
      }
      await updateGoal(existingGoal.id, updateData);
      return existingGoal.id;
    }

    // Create new goal - build clean object without undefined values
    const goalsRef = collection(db, DONATION_GOALS_COLLECTION);
    const newGoal: Record<string, unknown> = {
      goalType: goalData.goalType,
      amount: goalData.amount,
      year: goalData.year,
      isActive: goalData.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Only include month for monthly goals
    if (goalData.goalType === 'monthly' && goalData.month !== undefined) {
      newGoal.month = goalData.month;
    }

    const docRef = await addDoc(goalsRef, newGoal);
    return docRef.id;
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};

// Update an existing goal
export const updateGoal = async (
  id: string,
  goalData: Partial<Omit<DonationGoal, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const goalRef = doc(db, DONATION_GOALS_COLLECTION, id);
    await updateDoc(goalRef, {
      ...goalData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

// Set a goal as active (deactivates other goals of the same type only)
export const setActiveGoal = async (id: string): Promise<void> => {
  try {
    const allGoals = await getAllGoals();
    const targetGoal = allGoals.find(g => g.id === id);
    
    if (!targetGoal) {
      throw new Error('Goal not found');
    }

    // Only deactivate goals of the same type
    const deactivatePromises = allGoals
      .filter(goal => goal.isActive && goal.id !== id && goal.goalType === targetGoal.goalType)
      .map(goal => updateGoal(goal.id, { isActive: false }));
    
    await Promise.all(deactivatePromises);

    // Then activate the selected goal
    await updateGoal(id, { isActive: true });
  } catch (error) {
    console.error('Error setting active goal:', error);
    throw error;
  }
};

// Toggle a goal's active state (for checkbox behavior)
export const toggleGoalActive = async (id: string, isActive: boolean): Promise<void> => {
  try {
    if (isActive) {
      // If activating, deactivate other goals of the same type first
      await setActiveGoal(id);
    } else {
      // If deactivating, just set this goal to inactive
      await updateGoal(id, { isActive: false });
    }
  } catch (error) {
    console.error('Error toggling goal active state:', error);
    throw error;
  }
};

// Get active goals by type
export const getActiveGoalByType = async (goalType: 'monthly' | 'yearly'): Promise<DonationGoal | null> => {
  try {
    const goalsRef = collection(db, DONATION_GOALS_COLLECTION);
    const q = query(
      goalsRef,
      where('isActive', '==', true),
      where('goalType', '==', goalType),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const goalDoc = snapshot.docs[0];
    return {
      id: goalDoc.id,
      ...goalDoc.data()
    } as DonationGoal;
  } catch (error) {
    console.error('Error getting active goal by type:', error);
    throw error;
  }
};

// Delete a goal
export const deleteGoal = async (id: string): Promise<void> => {
  try {
    const goalRef = doc(db, DONATION_GOALS_COLLECTION, id);
    await deleteDoc(goalRef);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// Get current period goal (for public display - with fallback logic)
export const getCurrentDisplayGoal = async (): Promise<DonationGoal | null> => {
  try {
    // First try to get the explicitly active goal
    const activeGoal = await getActiveGoal();
    if (activeGoal) {
      return activeGoal;
    }

    // Fallback: try to get current month's goal
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const monthlyGoal = await getGoalForPeriod('monthly', currentYear, currentMonth);
    if (monthlyGoal) {
      return monthlyGoal;
    }

    // Fallback: try to get current year's goal
    const yearlyGoal = await getGoalForPeriod('yearly', currentYear);
    if (yearlyGoal) {
      return yearlyGoal;
    }

    return null;
  } catch (error) {
    console.error('Error getting current display goal:', error);
    throw error;
  }
};
