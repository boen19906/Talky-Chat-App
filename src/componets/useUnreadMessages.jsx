import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const useUnreadMessages = (selectedConversationId, isNewLogin, audioRef) => {
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Query all messages documents where the current user is a participant
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("participants", "array-contains", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const unreadUpdates = {};
      
      querySnapshot.forEach((doc) => {
        const conversationId = doc.id;
        const conversationData = doc.data();
        const texts = conversationData.texts || [];
        const participants = conversationData.participants || [];
        
        // Skip the currently selected conversation
        if (conversationId === selectedConversationId) return;
        
        // Count unread messages
        const unreadCount = texts.filter(
          (msg) => msg.sender !== user.uid && !msg.viewed
        ).length;
        
        if (unreadCount > 0) {
          // Determine if it's a group chat (more than 2 participants) or direct message
          const isGroupChat = participants.length > 2;
          
          // Play notification sound for new messages
          if (!isNewLogin && audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error playing notification sound:", e));
          }
          
          unreadUpdates[conversationId] = {
            count: unreadCount,
            isGroup: isGroupChat
          };
        }
      });
      
      setUnreadMessages(unreadUpdates);
    });
    
    return () => unsubscribe();
  }, [selectedConversationId, isNewLogin, audioRef]);

  return { unreadMessages };
};

export default useUnreadMessages;