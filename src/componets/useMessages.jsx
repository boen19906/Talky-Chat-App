import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, setDoc, arrayUnion, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const useMessages = (selectedFriend, selectedGroup, friendUsernames, deletedMessageIndex) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const currentConversationIdRef = useRef(null);

  // Update currentConversationIdRef whenever selectedFriend or selectedGroup changes
  useEffect(() => {
    const user = auth.currentUser;
    if (user && selectedFriend) {
      currentConversationIdRef.current = [user.uid, selectedFriend].sort().join("_");
    } else if (selectedGroup) {
      currentConversationIdRef.current = `group_${selectedGroup}`;
    } else {
      currentConversationIdRef.current = null;
    }
  }, [selectedFriend, selectedGroup]);

  // Mark messages as viewed when a friend is selected (only for direct messages)
  useEffect(() => {
    const markMessagesAsViewed = async () => {
      const user = auth.currentUser;
      if (user && selectedFriend) {
        const conversationId = [user.uid, selectedFriend].sort().join("_");
        const conversationRef = doc(db, "messages", conversationId);
        
        try {
          const conversationDoc = await getDoc(conversationRef);
          
          if (conversationDoc.exists()) {
            const textsArray = conversationDoc.data().texts || [];
            let updated = false;
            
            // Create a new array with viewed status updated
            const updatedTexts = textsArray.map(msg => {
              if (msg.sender === selectedFriend && !msg.viewed) {
                updated = true;
                return { ...msg, viewed: true };
              }
              return msg;
            });
            
            // Only update if there were unread messages
            if (updated) {
              await updateDoc(conversationRef, {
                texts: updatedTexts
              });
            }
          }
        } catch (error) {
          console.error("Error marking messages as viewed:", error);
        }
      }
    };
    
    markMessagesAsViewed();
  }, [selectedFriend, messages]);

  // useEffect to fetch messages for either selectedFriend or selectedGroup
  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchMessages = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      try {
        let conversationId;
        let conversationRef;
        
        if (selectedFriend) {
          // Direct message conversation
          conversationId = [user.uid, selectedFriend].sort().join("_");
          conversationRef = doc(db, "messages", conversationId);
        } else if (selectedGroup) {
          // Group conversation
          conversationId = `group_${selectedGroup}`;
          conversationRef = doc(db, "messages", selectedGroup);
        } else {
          // No conversation selected
          setMessages([]);
          return;
        }
        
        // Set up a real-time listener for the conversation document
        unsubscribe = onSnapshot(conversationRef, async (doc) => {
          // Only process if this is still the current conversation
          if (conversationId === currentConversationIdRef.current) {
            if (doc.exists()) {
              // Get the `texts` array from the document
              const texts = doc.data().texts || [];
              
              // Format the messages
              const formattedMessages = texts.map((msg) => {
                let timestamp;
                if (msg.timestamp?.toDate) {
                  timestamp = msg.timestamp.toDate();
                } else if (msg.timestamp?.seconds) {
                  timestamp = new Date(msg.timestamp.seconds * 1000);
                } else if (typeof msg.timestamp === "string") {
                  timestamp = new Date(msg.timestamp);
                } else {
                  timestamp = new Date();
                }

                return {
                  text: msg.text,
                  sender: msg.sender === user.uid ? "You" : friendUsernames[msg.sender] || "Unknown",
                  timestamp: timestamp,
                  viewed: selectedFriend ? msg.viewed : undefined // Only track viewed status for direct messages
                };
              });

              setMessages(formattedMessages);
            } else {
              setMessages([]);
            }
          }
        });
      } catch (error) {
        console.error("Error setting up real-time listener:", error);
      }
    };

    fetchMessages();
    
    // Clean up the listener when the component unmounts or selected conversation changes
    return () => unsubscribe();
  }, [selectedFriend, selectedGroup, friendUsernames]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      try {
        const user = auth.currentUser;
        if (user) {
          let conversationRef;
          let newMessageData;
          
          if (selectedFriend) {
            // Direct message
            const conversationId = [user.uid, selectedFriend].sort().join("_");
            conversationRef = doc(db, "messages", conversationId);
            
            newMessageData = {
              sender: user.uid,
              recipient: selectedFriend,
              text: message,
              timestamp: new Date().toISOString(),
              viewed: false,
            };
          } else if (selectedGroup) {
            // Group message
            conversationRef = doc(db, "messages", selectedGroup);
            
            newMessageData = {
              sender: user.uid,
              text: message,
              timestamp: new Date().toISOString(),
              // No recipient or viewed field for group messages
            };
          } else {
            // No conversation selected
            return;
          }
  
          // Check if the document exists
          const conversationDoc = await getDoc(conversationRef);
  
          if (conversationDoc.exists()) {
            // If the document exists, append the new message to the `texts` array
            await updateDoc(conversationRef, {
              texts: arrayUnion(newMessageData),
              lastUpdated: serverTimestamp(),
            });
          } else {
            // If the document doesn't exist, create it with the new message
            if (selectedFriend) {
              // Create new direct message conversation
              await setDoc(conversationRef, {
                participants: [user.uid, selectedFriend],
                texts: [newMessageData],
                lastUpdated: serverTimestamp(),
              });
            } else if (selectedGroup) {
              // Create new group conversation (this should rarely happen as groups should be created elsewhere)
              await setDoc(conversationRef, {
                groupName: "New Group", // This should be set when creating the group
                participants: [user.uid], // This should include all participants
                texts: [newMessageData],
                lastUpdated: serverTimestamp(),
              });
            }
          }
  
          setMessage("");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleDeleteMessage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      let conversationRef;
      
      if (selectedFriend) {
        // Direct message
        const conversationId = [user.uid, selectedFriend].sort().join("_");
        conversationRef = doc(db, "messages", conversationId);
      } else if (selectedGroup) {
        // Group message
        conversationRef = doc(db, "messages", selectedGroup);
      } else {
        return;
      }
      
      // Get the current conversation data
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        // Get the texts array from the document
        const texts = conversationDoc.data().texts || [];
        
        // Check if the message exists and belongs to the current user
        const messageToDelete = texts[deletedMessageIndex];
        
        if (messageToDelete && messageToDelete.sender === user.uid) {
          // Remove the message from the array
          texts.splice(deletedMessageIndex, 1);
          
          // Update the document with the modified texts array
          await updateDoc(conversationRef, {
            texts: texts,
            lastUpdated: serverTimestamp(),
          });
        } else {
          console.error("Cannot delete: Message doesn't exist or doesn't belong to you");
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return { message, setMessage, messages, handleSendMessage, handleDeleteMessage };
};

export default useMessages;