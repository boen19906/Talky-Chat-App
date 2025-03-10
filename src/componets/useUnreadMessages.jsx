import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const useUnreadMessages = (friends, selectedFriend, groups, selectedGroup, isNewLogin, audioRef) => {
  const [unreadMessages, setUnreadMessages] = useState({});
  const prevUnreadCounts = useRef({});
  const prevUnreadCountsGroups = useRef({}); 
  

  useEffect(() => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
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
      
          // Get previous count for this friend
          const prevCount = prevUnreadCounts.current[friendId] || 0;
          
          // Update state first
          setUnreadMessages((prev) => ({ ...prev, [friendId]: unreadCount }));
      
          // Only proceed if there's a NEW unread message
          if (unreadCount > prevCount) {
            try {
              
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const currentFriends = userDoc.data().friends || [];
                
                if (currentFriends.includes(friendId)) {
                  // Check if friend isn't already last
                  if (currentFriends[currentFriends.length - 1] !== friendId) {
                    const filteredFriends = currentFriends.filter(id => id !== friendId);
                    const newFriends = [...filteredFriends, friendId];
                    
                    console.log("Moving friend to end position");
                    await updateDoc(userRef, { friends: newFriends });
                  }
                } else {
                  // Add new friend to end if not in list
                  console.log("Adding new friend to list");
                  await updateDoc(userRef, {
                    friends: [...currentFriends, friendId]
                  });
                }
              }
            } catch (error) {
              console.error("Error updating friends order:", error);
            }
          }
      
          // Update previous count tracker
          prevUnreadCounts.current[friendId] = unreadCount;
      
          // Play sound only for NEW messages
          if (!isNewLogin && unreadCount > prevCount && audioRef.current) {
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