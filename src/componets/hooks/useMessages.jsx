import { useState, useEffect, useRef } from "react";
import { doc, getDoc, getDocs, updateDoc, setDoc, arrayUnion, serverTimestamp, onSnapshot, collection, query, where } from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reactionIndex, setReactionIndex] = useState(0);
  const inputRef = useRef(null);

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
// For direct messages
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
          
          // Create a new array with readBy status updated
          const updatedTexts = textsArray.map(msg => {
            // Initialize readBy if it doesn't exist
            const readBy = msg.readBy || [];
            
            // If current user hasn't read this message yet
            if (msg.sender === selectedFriend && !readBy.includes(user.uid)) {
              updated = true;
              return { 
                ...msg, 
                viewed: true, // Keep for backward compatibility
                readBy: [...readBy, user.uid] // Add current user to readBy array
              };
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

// For group messages
useEffect(() => {
  const markGroupMessagesAsViewed = async () => {
    const user = auth.currentUser;
    if (user && selectedGroup) {
      const groupRef = doc(db, "messages", selectedGroup);
      
      try {
        const groupDoc = await getDoc(groupRef);
        
        if (groupDoc.exists()) {
          const textsArray = groupDoc.data().texts || [];
          let updated = false;
          
          // Create a new array with readBy status updated
          const updatedTexts = textsArray.map(msg => {
            // Initialize readBy if it doesn't exist
            const readBy = msg.readBy || [];
            
            // If current user hasn't read this message yet and they're not the sender
            if (msg.sender !== user.uid && !readBy.includes(user.uid)) {
              updated = true;
              return { 
                ...msg,
                readBy: [...readBy, user.uid] // Add current user to readBy array
              };
            }
            return msg;
          });
          
          if (updated) {
            // Update messages first
            await updateDoc(groupRef, { texts: updatedTexts });

            // Now update groups order
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const currentGroups = userDoc.data().groups || [];
              
              // Only update if group exists and isn't already at the end
              if (currentGroups.includes(selectedGroup)) {
                if (currentGroups[currentGroups.length - 1] !== selectedGroup) {
                  // Create new array with group at end
                  const filteredGroups = currentGroups.filter(id => id !== selectedGroup);
                  const newGroups = [...filteredGroups, selectedGroup];
                  
                  // Update Firestore
                  await updateDoc(userRef, { groups: newGroups });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing group messages:", error);
      }
    }
  };
  
  markGroupMessagesAsViewed();
}, [selectedGroup, messages]);

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
                  text: msg.text || "",
                  sender: msg.sender === user.uid ? "You" : friendUsernames[msg.sender] || "Unknown",
                  timestamp: timestamp,
                  viewed: selectedFriend ? msg.viewed : undefined,
                  fileUrl: msg.fileUrl || null,
                  fileName: msg.fileName || null,
                  fileType: msg.fileType || null,
                  reaction: msg.reaction || null,
                  recipient: msg.recipient
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




  // Enhanced bot message handling system
useEffect(() => {
  let unsubscribes = [];
  let botUserIds = {};
  let timeoutIds = {};
  const processedMessages = new Set();
  
  // Initialize all bots
  const initializeBots = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isBot', '==', true));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.docs.forEach(doc => {
      const botData = doc.data();
      botUserIds[botData.username] = doc.id;
    });
    
    console.log("Initialized bots:", Object.keys(botUserIds));
  };

  const handleBotMessages = (user) => {
    if (!selectedFriend) return;
    
    // Get the bot data for the selected friend
    const botId = selectedFriend;
    let botInfo = null;
    
    // Check if the selected friend is a bot
    const checkIfSelectedFriendIsBot = async () => {
      try {
        const friendDoc = await getDoc(doc(db, 'users', selectedFriend));
        if (friendDoc.exists() && friendDoc.data().isBot === true) {
          botInfo = friendDoc.data();
          setupBotListener(botInfo, botId);
        }
      } catch (error) {
        console.error("Error checking if friend is bot:", error);
      }
    };
    
    // Set up a listener for this specific bot
    const setupBotListener = (botInfo, botId) => {
      const conversationId = [user.uid, botId].sort().join('_');
      const convoRef = doc(db, 'messages', conversationId);
      
      const unsubscribe = onSnapshot(convoRef, async (docSnap) => {
        if (!docSnap.exists() || isProcessing) return;
  
        // Get current messages and check last sender
        const texts = docSnap.data().texts || [];
        const lastMessage = texts[texts.length - 1];
        
        // Only respond if last message is from user
        if (!lastMessage || lastMessage.sender !== user.uid) return;
  
        clearTimeout(timeoutIds[botId]);
        timeoutIds[botId] = setTimeout(async () => {
          try {
            setIsProcessing(true);
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
            
            let promptContent = '';
            let model = 'deepseek-chat';
            
            // Determine which bot is selected and set appropriate prompt
            if (botInfo.username === 'HoodGPT') {
              promptContent = `ROLEPLAY AS a inner city gangster named HoodGPT. You are violent, angry, and curse a lot. Don't cesnor your curse words with "*".
                Don't keep repeating the same things, mix things up for example don't keep saying "yo..." and mix up things at the end too. This your boss and fellow gangster ${userUsername}  
                This is the context:\n${combinedContent} \nnow respond in under 30 words as HoodGPT, Do not, again DO NOT start your response with  "Yo ${userUsername}":`;
            } else if (botInfo.username === 'Aristotle') {
              promptContent = `ROLEPLAY AS the ancient Greek philosopher Aristotle. You are wise, thoughtful, and speak in a formal manner with philosophical insights.
                Also you are good tutor and your philosphy is: emphasized the importance of reason, observation, and logic in understanding the world, arguing that happiness (eudaimonia) is achieved through virtuous living and intellectual activity, and that everything has a purpose or "telos"
                This is the context:\n${combinedContent} \nnow respond in under 50 words as Aristotle, relating to the user's query with philosophical wisdom, also don't keep repeating yourself in the :`;
            } else {
              // Default prompt for other bots
              promptContent = `ROLEPLAY AS ${botInfo.username}. This is the context:\n${combinedContent} \nnow respond in under 40 words:`;
            }
  
            // Generate response
            const completion = await openai.chat.completions.create({
              messages: [{
                role: 'user',
                content: promptContent
              }],
              model: model,
              max_tokens: 150
            });
  
            // Add bot response
            await updateDoc(convoRef, {
              texts: arrayUnion({
                sender: botId,
                text: completion.choices[0].message.content,
                timestamp: new Date().toISOString(),
                viewed: false,
              }),
              lastUpdated: serverTimestamp()
            });
  
            processedMessages.clear();
          } catch (error) {
            console.error(`${botInfo.username} error:`, error);
            unprocessed.forEach(msg => processedMessages.delete(msg.timestamp));
          } finally {
            setIsProcessing(false);
          }
        }, 2000); // 2-second debounce
      });
      
      unsubscribes.push(unsubscribe);
    };
    
    // Check if the selected friend is a bot
    checkIfSelectedFriendIsBot();
  };

  const user = auth.currentUser;
  if (user) {
    initializeBots().then(() => handleBotMessages(user));
  }

  return () => {
    // Clear all timeouts and unsubscribe from all listeners
    Object.keys(timeoutIds).forEach(botId => clearTimeout(timeoutIds[botId]));
    unsubscribes.forEach(unsubscribe => unsubscribe());
    setIsProcessing(false);
    processedMessages.clear();
  };
}, [selectedFriend, userUsername]);

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
    if (file.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(file)); // Create object URL for preview
    }
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
  
      // 1. Upload file to Firebase Storage
      const fileName = uuidv4() + "_" + imageFile.name;
      const fileRef = ref(storage, `chatFiles/${fileName}`);
      const snapshot = await uploadBytes(fileRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      // 2. Pre-load the file if it's an image
      if (imageFile.type.startsWith('image/')) {
        const preloadImage = () => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = downloadURL;
            img.onload = resolve;
            img.onerror = reject;
          });
        };
        await preloadImage();
      }
  
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
        fileUrl: downloadURL,
        fileName: imageFile.name,
        fileType: imageFile.type,
        timestamp: new Date().toISOString(),
        viewed: false,
        reaction: ""
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
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Update cancel handler to clear preview
const handleCancelImage = async () => {
  console.log("canceling image");
  setImageFile(null);
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview); // Clean up memory
    setImagePreview(null);
  }
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

const handleSendReaction = async (emoji) => {
  const user = auth.currentUser;
  try {
    if (!user || !selectedFriend) return;
    console.log(emoji);
    
    // Create the conversation ID
    let messageRef;

    const conversationId = [user.uid, selectedFriend].sort().join("_");
    messageRef = doc(db, "messages", conversationId);
    
    
    // Get the current message data
    const messageSnapshot = await getDoc(messageRef);
    
    if (!messageSnapshot.exists()) {
      console.error("Message not found");
      return;
    }
    
    const messageData = messageSnapshot.data();
    const textsArray = messageData.texts || [];
    
    // Check if the reactionIndex is valid
    if (reactionIndex < 0 || reactionIndex >= textsArray.length) {
      console.error("Invalid reaction index");
      return;
    }
    
    // Make a copy of the texts array
    const updatedTexts = [...textsArray];
    
    // Set the reaction as a string
    updatedTexts[reactionIndex].reaction = emoji;
    
    // Update the message document in Firestore
    await updateDoc(messageRef, {
      texts: updatedTexts
    });
    
    console.log(`Reaction ${emoji} added successfully`);
  } catch (error) {
    console.error("Error adding reaction:", error);
  }
};

  return { message, setMessage, messages, handleSendMessage, handleImageChange, handleUploadImage, handleCancelImage, handleDeleteMessage, imageFile, fileInputRef, imagePreview, isLoading, friendToTop, setFriendToTop
    , isProcessing,selectedImage, setSelectedImage, handleSendReaction, reactionIndex, setReactionIndex, inputRef
   };
};

export default useMessages;