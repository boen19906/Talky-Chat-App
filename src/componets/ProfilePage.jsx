import { useState, useRef } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const ProfilePage = ({ page, profileImage, setProfileImage, userUsername, userEmail, createdAt }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const userId = auth.currentUser.uid;
      
      // Create a reference to the storage location
      const storage = getStorage();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `profileImages/${fileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the user document in Firestore
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        profileImage: downloadURL
      });
      
      setProfileImage(downloadURL);
      
      setIsUploading(false);
      console.log("Profile image updated successfully!");
    } catch (error) {
      setIsUploading(false);
      console.error("Error updating profile image:", error);
      console.log("Failed to update profile image. Please try again.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (page !== "profile") return null;

  return (
    <div className="profile-area">
      <h3>Profile</h3>
      
      <div 
        className="profile-image-container" 
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={triggerFileInput}
      >
        {profileImage ? (
          <img 
            src={profileImage} 
            alt="Profile" 
            className={`profile-image ${isUploading ? 'uploading' : ''}`}
          />
        ) : (
          <div className={`profile-placeholder ${isUploading ? 'uploading' : ''}`}>
            {userUsername ? userUsername.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        
        {isHovering && (
          <div className="edit-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" className="pencil-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleProfileChange} 
          accept="image/*" 
          className="file-input" 
        />
      </div>
      
      <h3 className="profile-username">{userUsername}</h3>
      <div className="profile-content">
        <div className="user-detail">
          <span className="detail-label">Email</span>
          <span className="detail-value">{userEmail}</span>
        </div>
        <div className="user-detail">
          <span className="detail-label">Member since</span>
          <span className="detail-value">
            <span className="account-age">
              {createdAt instanceof Date 
                ? createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : createdAt && typeof createdAt === 'string' 
                  ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : "Unknown date"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;