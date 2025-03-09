import { useState, useEffect, useRef } from "react";
import { doc, getDoc, getDocs, updateDoc, setDoc, arrayUnion, serverTimestamp, onSnapshot, collection, query, where } from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import OpenAI from 'openai';

const useMessages = (selectedFriend, selectedGroup, friendUsernames, deletedMessageIndex, userUsername) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const currentConversationIdRef = useRef(null);
  const [friendToTop, setFriendToTop] = useState(false);

  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: "sk-2fe6222bedf54239871cf7f3946d1fa7",
    dangerouslyAllowBrowser: true,
  });

  // Update currentConversationIdRef whenever selectedFriend or selectedGroup changes
  useEffect(() => {
    const user = auth.currentUser;
    if (user && selectedFriend) {
      currentConversationIdRef.current = [user.uid, selectedFriend].sort().join("_");
      console.log(currentConversationIdRef.current);
    } else if (selectedGroup) {
      currentConversationIdRef.current = `${selectedGroup}`;
      console.log(currentConversationIdRef.current);
    } else {
      currentConversationIdRef.current = null;
    }
  }, [selectedFriend, selectedGroup]);

  // Mark messages as viewed and reorder friends when a friend is selected
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
          
          if (updated) {
            // Update messages first
            await updateDoc(conversationRef, { texts: updatedTexts });

            // Now update friends order
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const currentFriends = userDoc.data().friends || [];
              
              // Only update if friend exists and isn't already first
              if (currentFriends.includes(selectedFriend)) {
                setFriendToTop(true);
                console.log("friends on top");
                if (currentFriends[currentFriends.length - 1] !== selectedFriend) {
                  // Create new array with friend at bottom
                  const filteredFriends = currentFriends.filter(id => id !== selectedFriend);
                  const newFriends = [...filteredFriends, selectedFriend];
                  
                  // Update Firestore
                  await updateDoc(userRef, { friends: newFriends });

                  
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing messages:", error);
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
          conversationId = `${selectedGroup}`;
          conversationRef = doc(db, "messages", selectedGroup);
        } else {
          // No conversation selected
          setMessages([]);
          return;
        }

        
        // Set up a real-time listener for the conversation document
        unsubscribe = onSnapshot(conversationRef, async (docSnap) => {
          // Only process if this is still the current conversation
          if (conversationId === currentConversationIdRef.current) {
            if (docSnap.exists()) {
              // Get the `texts` array from the document
              const texts = docSnap.data().texts || [];
            
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
                  viewed: selectedFriend ? msg.viewed : undefined, // Only track viewed status for direct messages
                  imageUrl: msg.imageUrl || null
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


  useEffect(() => {
    
    let unsubscribe = () => {};
    let hoodGPTUserId = null;
    let timeoutId = null;
    const processedMessages = new Set();
    let isProcessing = false;
  
    const initializeHoodGPT = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', 'HoodGPT'));
      const querySnapshot = await getDocs(q);
      hoodGPTUserId = querySnapshot.docs[0]?.id;
    };
  
    const handleHoodGPTMessages = (user) => {
      if (!selectedFriend || selectedFriend !== hoodGPTUserId) return;
  
      const conversationId = [user.uid, hoodGPTUserId].sort().join('_');
      const convoRef = doc(db, 'messages', conversationId);
  
      unsubscribe = onSnapshot(convoRef, async (docSnap) => {
        if (!docSnap.exists() || isProcessing) return;
  
        // Get current messages and check last sender
        const texts = docSnap.data().texts || [];
        const lastMessage = texts[texts.length - 1];
        
        // Only respond if last message is from user
        if (!lastMessage || lastMessage.sender !== user.uid) return;
  
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            isProcessing = true;
            const unprocessed = texts.filter(msg => 
              msg.sender === user.uid &&
              !processedMessages.has(msg.timestamp)
            );
  
            if (unprocessed.length === 0) return;
  
            // Mark messages as processed
            unprocessed.forEach(msg => processedMessages.add(msg.timestamp));
  
            // Get combined message content
            const combinedContent = unprocessed
              .map(msg => msg.text)
              .join(" [NEXT MESSAGE] ");
  
            // Generate response
            const completion = await openai.chat.completions.create({
              messages: [{
                role: 'user',
                content: `ROLEPLAY AS a inner city gangster named HoodGPT. You are violent, angry, and curse a lot. Don't cesnor your curse words with "*".
                 This your boss and fellow gangster ${userUsername} This is the context:\n${combinedContent} \nnow respond in under 30 words as HoodGPT:`
              }],
              model: 'deepseek-chat',
              max_tokens: 150
            });
  
            // Add bot response
            await updateDoc(convoRef, {
              texts: arrayUnion({
                sender: hoodGPTUserId,
                text: completion.choices[0].message.content,
                timestamp: new Date().toISOString(),
                viewed: false
              }),
              lastUpdated: serverTimestamp()
            });
  
            processedMessages.clear();
          } catch (error) {
            console.error('HoodGPT error:', error);
            unprocessed.forEach(msg => processedMessages.delete(msg.timestamp));
          } finally {
            isProcessing = false;
          }
        }, 2000); // 2-second debounce
      });
    };
  
    const user = auth.currentUser;
    if (user) {
      initializeHoodGPT().then(() => handleHoodGPTMessages(user));
    }
  
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      isProcessing = false;
      processedMessages.clear();
    };
  }, [selectedFriend]);

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

 // Modify handleImageChange to create preview
const handleImageChange = (e) => {
  if (e.target.files[0]) {
    const file = e.target.files[0];
    console.log("File selected:", file);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // Create object URL for preview
  }
};

  // 10) Upload image and send as a message
  // 10) Upload image and send as a message
  const handleUploadImage = async () => {
    setIsLoading(true);
    console.log("handleUploadImage triggered");
    if (!imageFile || (!selectedFriend && !selectedGroup)) {
      setIsLoading(false);
      return;
    }
  
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      // 1. Upload image to Firebase Storage
      const imageName = uuidv4() + "_" + imageFile.name;
      const imageRef = ref(storage, `chatImages/${imageName}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      // 2. Pre-load the image before sending the message
      const preloadImage = () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = downloadURL;
          img.onload = resolve;
          img.onerror = reject;
        });
      };
  
      await preloadImage();
  
      // 3. Determine conversation type and ID
      const isGroup = !!selectedGroup;
      const conversationId = isGroup 
        ? selectedGroup 
        : [user.uid, selectedFriend].sort().join("_");
  
      // 4. Create message object
      const newMessage = {
        sender: user.uid,
        ...(isGroup ? { groupId: selectedGroup } : { recipient: selectedFriend }),
        text: "",
        imageUrl: downloadURL,
        timestamp: new Date().toISOString(),
        viewed: false,
      };
  
      const conversationRef = doc(db, "messages", conversationId);
  
      // 5. Handle different conversation types
      if (isGroup) {
        // Group message - assume conversation document exists
        await updateDoc(conversationRef, {
          texts: arrayUnion(newMessage),
          lastUpdated: serverTimestamp(),
        });
      } else {
        // Private message - create conversation if it doesn't exist
        if ((await getDoc(conversationRef)).exists()) {
          await updateDoc(conversationRef, {
            texts: arrayUnion(newMessage),
            lastUpdated: serverTimestamp(),
          });
        } else {
          await setDoc(conversationRef, {
            participants: [user.uid, selectedFriend],
            texts: [newMessage],
            lastUpdated: serverTimestamp(),
          });
        }
      }

      setIsLoading(false);
      setImageFile(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsLoading(false); // Add this
    } finally {
      setIsLoading(false); // Optional safety net
    }
  };

  // Update cancel handler to clear preview
const handleCancelImage = () => {
  setImageFile(null);
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview); // Clean up memory
    setImagePreview(null);
  }
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

  return { message, setMessage, messages, handleSendMessage, handleImageChange, handleUploadImage, handleCancelImage, handleDeleteMessage, imageFile, fileInputRef, imagePreview, isLoading, friendToTop, setFriendToTop };
};

export default useMessages;