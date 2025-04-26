import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

const useUnreadMessages = (friends, selectedFriend, groups, selectedGroup, isNewLogin, audioRef) => {
  const [unreadMessages, setUnreadMessages] = useState({});
  const [groupUnreadMessages, setGroupUnreadMessages] = useState({});
  const prevUnreadCounts = useRef({});
  const prevUnreadCountsGroups = useRef({});
  
  // Effect for individual friend messages
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
          
          // Count messages that are from the friend and current user hasn't read
          const unreadCount = texts.filter(msg => {
            const readBy = msg.readBy || [];
            return msg.sender === friendId && !readBy.includes(user.uid);
          }).length;
          
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

  // Effect for group messages
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    const unsubscribeGroupMap = {};
    
    groups.forEach((groupId) => {
      if (groupId === selectedGroup) return;
      
      const groupRef = doc(db, "messages", groupId);
      
      const unsubscribe = onSnapshot(groupRef, async (docSnap) => {
        if (docSnap.exists()) {
          const texts = docSnap.data().texts || [];
          
          // Count messages that aren't from the current user and they haven't read
          const unreadCount = texts.filter(msg => {
            const readBy = msg.readBy || [];
            return msg.sender !== user.uid && !readBy.includes(user.uid);
          }).length;
          
          // Get previous count for this group
          const prevCount = prevUnreadCountsGroups.current[groupId] || 0;
          
          // Update state first
          setGroupUnreadMessages((prev) => ({ ...prev, [groupId]: unreadCount }));
          
          // Only proceed if there's a NEW unread message
          if (unreadCount > prevCount) {
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              
              if (userDoc.exists()) {
                const currentGroups = userDoc.data().groups || [];
                
                if (currentGroups.includes(groupId)) {
                  // Check if group isn't already last
                  if (currentGroups[currentGroups.length - 1] !== groupId) {
                    const filteredGroups = currentGroups.filter(id => id !== groupId);
                    const newGroups = [...filteredGroups, groupId];
                    
                    console.log("Moving group to end position");
                    await updateDoc(doc(db, "users", user.uid), { groups: newGroups });
                  }
                }
              }
            } catch (error) {
              console.error("Error updating groups order:", error);
            }
          }
          
          // Update previous count tracker
          prevUnreadCountsGroups.current[groupId] = unreadCount;
          
          // Play sound only for NEW messages
          if (!isNewLogin && unreadCount > prevCount && audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
        }
      });
      
      unsubscribeGroupMap[groupId] = unsubscribe;
    });
    
    return () => {
      Object.values(unsubscribeGroupMap).forEach((fn) => fn());
    };
  }, [groups, selectedGroup, isNewLogin]);
  
  return { 
    unreadMessages, 
    setUnreadMessages,
    groupUnreadMessages,
    setGroupUnreadMessages
  };
};

export default useUnreadMessages;