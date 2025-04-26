import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase"; // Import auth from your firebase config

/**
 * Custom hook to fetch and manage user information with real-time updates
 * @returns {Object} An object containing user information and utility functions
 */
const useUsername = () => {
  const [userUsername, setUserUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user ID
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    const userDocRef = doc(db, "users", currentUserId);
    
    // This creates a subscription that will update whenever the document changes
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUserUsername(userData?.username || "");
          setProfileImage(userData?.profileImage || "");
          
          // Handle Firestore timestamp
          if (userData?.createdAt) {
            // Convert Firestore timestamp to JavaScript Date
            setCreatedAt(userData.createdAt.toDate ? userData.createdAt.toDate() : userData.createdAt);
          }
          
          setUserEmail(userData?.email || "");
          setError(null);
        } else {
          setError(`User document not found for ID: ${currentUserId}`);
        }
        setLoading(false);
      },
      (err) => {
        setError(`Error fetching user data: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe when the component unmounts
    // or when currentUserId changes
    return () => unsubscribe();
  }, [currentUserId]);

  // Function to manually update profile image in the local state
  const updateProfileImage = (newImageUrl) => {
    setProfileImage(newImageUrl);
  };

  return {
    userUsername,
    profileImage,
    setProfileImage: updateProfileImage,
    createdAt,
    userEmail,
    loading,
    error
  };
};

export default useUsername;