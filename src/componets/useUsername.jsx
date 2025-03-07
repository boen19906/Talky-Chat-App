import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase"; // Import auth from your firebase config

/**
 * Custom hook to fetch and manage usernames for given user IDs including current user
 * @param {Array} userIds - Array of user IDs to fetch usernames for
 * @param {boolean} includeCurrentUser - Whether to include current user's username
 * @returns {Object} An object containing usernames map, loading state, and utility functions
 */
const useUsername = () => {
  const [userUsername, setUserUsername] = useState("");
  const [error, setError] = useState(null);

  // Get current user ID
  const currentUserId = auth.currentUser?.uid;

  // Helper function to fetch username by user ID
  useEffect(() => {
    const getUsername = async () => {
        if (currentUserId) {
            try {
                const userDocRef = doc(db, "users", currentUserId);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    setUserUsername(userDoc.data()?.username);
                } else {
                    setError(`User document not found for ID: ${currentUserId}`);
                }
            } catch (error) {
                setError(`Error fetching username: ${error.message}`);
            }
        }
    };

    getUsername();
}, [currentUserId]); // Dependency array ensures this runs when currentUserId changes



  

  



  return {
    userUsername
  };
};

export default useUsername;