import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Custom hook to fetch and manage usernames for given user IDs
 * @param {Array} userIds - Array of user IDs to fetch usernames for
 * @param {boolean} autoFetch - Whether to fetch usernames automatically when userIds change
 * @returns {Object} An object containing usernames map, loading state, and utility functions
 */
const useUsername = (userIds = [], autoFetch = true) => {
  const [usernames, setUsernames] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to fetch a single username by user ID
  const getUsernameById = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data().username || null;
      } else {
        console.error("User document not found for ID:", userId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      setError(error.message);
      return null;
    }
  };

  // Function to fetch multiple usernames
  const fetchUsernames = async (ids = userIds) => {
    if (!ids || ids.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newUsernames = { ...usernames };
      let hasChanges = false;

      for (const userId of ids) {
        // Skip if we already have this username
        if (newUsernames[userId]) continue;
        
        const username = await getUsernameById(userId);
        if (username) {
          newUsernames[userId] = username;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setUsernames(newUsernames);
      }
    } catch (error) {
      console.error("Error fetching usernames:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single username and add it to state
  const fetchUsername = async (userId) => {
    if (!userId) return null;
    
    // Return from cache if available
    if (usernames[userId]) return usernames[userId];
    
    try {
      const username = await getUsernameById(userId);
      
      if (username) {
        setUsernames(prev => ({
          ...prev,
          [userId]: username
        }));
        return username;
      }
      return null;
    } catch (error) {
      console.error("Error in fetchUsername:", error);
      setError(error.message);
      return null;
    }
  };

  // Auto-fetch usernames when userIds change
  useEffect(() => {
    if (autoFetch && userIds && userIds.length > 0) {
      fetchUsernames(userIds);
    }
  }, [userIds, autoFetch]);

  return {
    usernames,
    loading,
    error,
    fetchUsername,
    fetchUsernames,
    getUsernameById,
  };
};

export default useUsername;