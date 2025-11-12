/**
 * Migration Script: Add Moderation Fields to Existing Posts
 * 
 * This script updates all existing posts in the database to include the new moderation fields.
 * Run this script once after deploying the Phase 4 moderation feature.
 * 
 * How to use:
 * 1. Import this function in your admin panel or run it manually in the browser console
 * 2. Call migrateExistingPosts() from the admin panel
 * 3. The script will update all existing posts to be approved by default
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const migrateExistingPosts = async () => {
  try {
    console.log('Starting migration of existing posts...');
    
    const postsCollection = collection(db, 'posts');
    const querySnapshot = await getDocs(postsCollection);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const postData = docSnapshot.data();
      
      // Skip if already has moderation fields
      if (Object.prototype.hasOwnProperty.call(postData, 'isApproved')) {
        skippedCount++;
        continue;
      }
      
      // Update with default approved status for existing posts
      const postRef = doc(db, 'posts', docSnapshot.id);
      await updateDoc(postRef, {
        isApproved: true,
        moderationStatus: 'approved',
        moderatedBy: 'system-migration',
        moderatedAt: new Date().toISOString()
      });
      
      updatedCount++;
    }
    
    console.log(`Migration completed!`);
    console.log(`✅ Updated: ${updatedCount} posts`);
    console.log(`⏭️ Skipped: ${skippedCount} posts (already migrated)`);
    console.log(`📊 Total: ${querySnapshot.docs.length} posts`);
    
    return {
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
      total: querySnapshot.docs.length
    };
  } catch (error) {
    console.error('Error during migration:', error);
    return {
      success: false,
      error: error
    };
  }
};

