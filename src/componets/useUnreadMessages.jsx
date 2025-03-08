import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const useUnreadMessages = (friends, selectedFriend, isNewLogin, audioRef) => {
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    const unsubscribeMap = {};
    friends.forEach((friendId) => {
      if (friendId === selectedFriend) return;
  
      const conversationId = [user.uid, friendId].sort().join("_");
      const conversationRef = doc(db, "messages", conversationId);
  
      const unsubscribe = onSnapshot(conversationRef, async (docSnap) => {
        if (docSnap.exists()) {
          const texts = docSnap.data().texts || [];
          const unreadCount = texts.filter(
            (msg) => msg.sender === friendId && !msg.viewed
          ).length;
  
          setUnreadMessages((prev) => ({ ...prev, [friendId]: unreadCount }));
  
          // Update friends array if there are unread messages
          if (unreadCount > 0) {
            try {
              const userRef = doc(db, "users", user.uid);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const currentFriends = userDoc.data().friends || [];
                
                // Only update if friend exists and isn't already first
                if (currentFriends.includes(friendId)) {
                  if (currentFriends[0] !== friendId) {
                    // Create new array with friend at top
                    const filteredFriends = currentFriends.filter(id => id !== friendId);
                    const newFriends = [friendId, ...filteredFriends];
                    
                    // Update Firestore
                    console.log("updating friends...");
                    await updateDoc(userRef, { friends: newFriends });
                  }
                }
              }
            } catch (error) {
              console.error("Error updating friends order:", error);
            }
          }
  
          // Play notification sound (existing logic)
          if (!isNewLogin && unreadCount > 0 && audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
        }
      });
  
      unsubscribeMap[friendId] = unsubscribe;
    });
  
    return () => {
      Object.values(unsubscribeMap).forEach((fn) => fn());
    };
  }, [friends, selectedFriend, isNewLogin]);

  return { unreadMessages, setUnreadMessages };
};

export default useUnreadMessages;