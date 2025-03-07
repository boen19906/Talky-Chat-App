import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const useUnreadMessages = (friends, selectedFriend, isNewLogin, audioRef) => {
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribeMap = {};
    friends.forEach((friendId) => {
      // Skip if it's the selected friend
      if (friendId === selectedFriend) return;

      const conversationId = [user.uid, friendId].sort().join("_");
      const conversationRef = doc(db, "messages", conversationId);

      const unsubscribe = onSnapshot(conversationRef, (docSnap) => {
        if (docSnap.exists()) {
          const texts = docSnap.data().texts || [];
          const unreadCount = texts.filter(
            (msg) => msg.sender === friendId && !msg.viewed
          ).length;

          setUnreadMessages((prev) => ({ ...prev, [friendId]: unreadCount }));

          // Play notification sound if new messages come in
          if (!isNewLogin && unreadCount > 0 && audioRef.current) {
            audioRef.current
              .play()
              .catch((err) => console.error("Error playing sound:", err));
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