import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, collection, getDocs, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriend, setNewFriend] = useState("");
  const [friends, setFriends] = useState([]);
  const [friendUsernames, setFriendUsernames] = useState({});
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [showlogoutModal, setShowlogoutModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [error, setError] = useState("");
  const [isNewLogin, setIsNewLogin] = useState(true);
  const [newFriendRequest, setNewFriendRequest] = useState(false);
  const [friendRequested, setFriendRequested] = useState("");
  const [friendRequestedUsername, setFriendRequestedUsername] = useState("");
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const currentConversationIdRef = useRef(null); // Use ref to track current conversation ID

  const navigate = useNavigate();

  //new login 
  useEffect(() => {
    // Reset 'isNewLogin' after 3 seconds (or another event like opening a chat)
    const timer = setTimeout(() => setIsNewLogin(false), 3000);
    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    const userDocRef = doc(db, "users", user.uid);
  
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setFriends(docSnap.data().friends || []);
      } else {
        console.error("User document not found.");
      }
    });
  
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const getUsernameById = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        return userDoc.data().username || null;
      } else {
        console.error("User document not found.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      return null;
    }
  };

  useEffect(() => {
    if (friends.length > 0) {
      const fetchFriendUsernames = async () => {
        const usernames = {};
        for (const friendId of friends) {
          const username = await getUsernameById(friendId);
          if (username) {
            usernames[friendId] = username;
          } else {
            console.error("Username not found for ID:", friendId);
          }
        }
        setFriendUsernames(usernames);
      };
  
      fetchFriendUsernames();
    }
  }, [friends]);

  // Update currentConversationIdRef whenever selectedFriend changes
  useEffect(() => {
    const user = auth.currentUser;
    if (user && selectedFriend) {
      currentConversationIdRef.current = [user.uid, selectedFriend].sort().join("_");
    } else {
      currentConversationIdRef.current = null;
    }
  }, [selectedFriend]);

  // Mark messages as viewed when a friend is selected
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
              
              // Update local unread messages state
              setUnreadMessages(prev => {
                const newState = { ...prev };
                newState[selectedFriend] = 0;
                return newState;
              });
            }
          }
        } catch (error) {
          console.error("Error marking messages as viewed:", error);
        }
      }
    };
    
    markMessagesAsViewed();
  }, [selectedFriend, messages]); // Add messages as a dependency

  // useEffect to fetch messages for the selectedFriend
  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchMessages = async () => {
      if (selectedFriend) {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          // Create a unique ID for the conversation
          const conversationId = [user.uid, selectedFriend].sort().join("_");
          
          // Reference the conversation document
          const conversationRef = doc(db, "messages", conversationId);
          
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
                    viewed: msg.viewed
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
      } else {
        // Clear messages when no friend is selected
        setMessages([]);
      }
    };

    fetchMessages();
    
    // Clean up the listener when the component unmounts or selectedFriend changes
    return () => unsubscribe();
  }, [selectedFriend, friendUsernames]);

  // useEffect to track unread messages from non-selected friends
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    // Set up listeners for all conversations
    const unsubscribeMap = {};
  
    friends.forEach(friendId => {
      // Skip setting up listener for the selected friend
      if (friendId === selectedFriend) {
        return;
      }
  
      const conversationId = [user.uid, friendId].sort().join("_");
      const conversationRef = doc(db, "messages", conversationId);
  
      // Set up a real-time listener for each conversation (except selected friend)
      const unsubscribe = onSnapshot(conversationRef, (doc) => {
        if (doc.exists()) {
          const texts = doc.data().texts || [];
  
          // Count unread messages (messages sent by the friend that haven't been viewed)
          const unreadCount = texts.filter(msg => msg.sender === friendId && !msg.viewed).length;
  
          // Update the unread messages count for this friend
          setUnreadMessages(prev => ({ ...prev, [friendId]: unreadCount }));
  
          // Play notification sound if there are new messages and it's not the selected friend
          if (!isNewLogin && unreadCount > 0 && audioRef.current) {
            audioRef.current.play().catch(err => console.error("Error playing sound:", err));
          }
        }
      });
  
      unsubscribeMap[friendId] = unsubscribe;
    });
  
    // Clean up listeners when component unmounts
    return () => {
      Object.values(unsubscribeMap).forEach(unsubscribe => unsubscribe());
    };
  }, [friends, selectedFriend]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() && selectedFriend) {
      try {
        const user = auth.currentUser;
        if (user) {
          // Create a unique ID for the conversation
          const conversationId = [user.uid, selectedFriend].sort().join("_");
  
          // Reference the conversation document
          const conversationRef = doc(db, "messages", conversationId);
  
          // Check if the document exists
          const conversationDoc = await getDoc(conversationRef);
  
          if (conversationDoc.exists()) {
            // If the document exists, append the new message to the `texts` array
            await updateDoc(conversationRef, {
              texts: arrayUnion({
                sender: user.uid,
                recipient: selectedFriend,
                text: message,
                timestamp: new Date().toISOString(),
                viewed: false,
              }),
              lastUpdated: serverTimestamp(),
            });
          } else {
            // If the document doesn't exist, create it with the new message
            await setDoc(conversationRef, {
              participants: [user.uid, selectedFriend],
              texts: [
                {
                  sender: user.uid,
                  recipient: selectedFriend,
                  text: message,
                  timestamp: new Date().toISOString(),
                  viewed: false,
                },
              ],
              lastUpdated: serverTimestamp(),
            });
          }
  
          setMessage("");
          // No need to update messages state here as the real-time listener will handle it
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handlelogoutModal = () => {
    setShowlogoutModal(true);
  }

  const handlelogout = async () => {
    try {
      await signOut(auth);
      navigate("/signup");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  const handleAddFriendSubmit = async (e) => {
    e.preventDefault();
    if (newFriend.trim()) {
      try {
        const user = auth.currentUser;
        if (user) {
          // Look up the friend by their username
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", newFriend));
          const querySnapshot = await getDocs(q);
  
          if (querySnapshot.empty) {
            setError("User not found. Please check the username and try again.");
            return;
          }
  
          // Get the friend's user ID and document reference
          const friendDoc = querySnapshot.docs[0];
          const friendId = friendDoc.id;
          const friendDocRef = doc(db, "users", friendId);
  
          // Check if already friends
          if (friends.includes(friendId)) {
            setError("You are already friends with this user.");
            return;
          }
  
          // Check if already sent a request
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();
          
          if (userData.sentFriendRequests && userData.sentFriendRequests.includes(friendId)) {
            setError("Friend request already sent.");
            return;
          }
  
          // Add request to the friend's friendRequests array
          await updateDoc(friendDocRef, {
            friendRequests: arrayUnion(user.uid)
          });
  
          // Add to current user's sentFriendRequests array
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            sentFriendRequests: arrayUnion(friendId)
          });
  
          setNewFriend("");
          setError(null);
          setShowAddFriendModal(false);
        }
      } catch (error) {
        setError(`Error sending friend request: ${error.message}`);
        console.error("Error sending friend request:", error);
      }
    }
  };

  const handleFriendRequest = async (requesterId, action) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      const userDocRef = doc(db, "users", user.uid);
      const requesterDocRef = doc(db, "users", requesterId);
  
      if (action === "accept") {
        // Add each user to the other's friends list
        await updateDoc(userDocRef, {
          friends: arrayUnion(requesterId),
          friendRequests: arrayRemove(requesterId)
        });
  
        await updateDoc(requesterDocRef, {
          friends: arrayUnion(user.uid),
          sentFriendRequests: arrayRemove(user.uid)
        });
  
        // Update local state
        setFriends([...friends, requesterId]);
      } else if (action === "decline") {
        // Remove the request
        await updateDoc(userDocRef, {
          friendRequests: arrayRemove(requesterId)
        });
  
        await updateDoc(requesterDocRef, {
          sentFriendRequests: arrayRemove(user.uid)
        });
      }
  
      
    } catch (error) {
      console.error("Error handling friend request:", error);
      setError(`Error handling friend request: ${error.message}`);
    }
  };

  //hook to track friendRequests
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const currentRequests = data.friendRequests || [];

        // Check if new friend requests were added
        if (currentRequests.length > 0) {
          setNewFriendRequest(true);
        }

        setFriendRequested(data.friendRequests[0]); // Update state with new requests
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []); // Dependencies

  const handleRemoveFriend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      const userDocRef = doc(db, "users", user.uid);
      const friendDocRef = doc(db, "users", friendToRemove);
  
      // Remove the friend from the user's friends list
      await updateDoc(userDocRef, {
        friends: arrayRemove(friendToRemove),
      });
  
      // Remove the user from the friend's friends list
      const friendDoc = await getDoc(friendDocRef);
      if (friendDoc.exists()) {
        await updateDoc(friendDocRef, {
          friends: arrayRemove(user.uid),
        });
      }
  
      // Update the local state
      setFriends(friends.filter((friend) => friend !== friendToRemove));
      setSelectedFriend(null);
      setShowRemoveFriendModal(false);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleImageClick = () => {
    setSelectedFriend(null);
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFriendClick = (friendId) => {
    if (selectedFriend === friendId) {
      setFriendToRemove(friendId);
      setShowRemoveFriendModal(true);
    } else {
      setSelectedFriend(friendId);
    }
  };

  useEffect(() => {
    const fetchFriendRequestUsername = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
  
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          if (friendRequested) { 
            // Fetch the username using the helper function
            const username = await getUsernameById(friendRequested);
            if (username) {
              setFriendRequestedUsername(username);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching friend request username:", error);
      }
    };
  
    fetchFriendRequestUsername();
  }, [friendRequested]);

  return (
    <div className="home-container">
      <audio ref={audioRef} src="/notf.mp3" preload="auto" />

      {/* Friends List */}
      <div className="friends-list">
        <img src="logo.png" alt="logo" className="logo" onClick={handleImageClick}/>
        <h2>Friends</h2>
        <button className="add-friend-button" onClick={handleAddFriend}>
          Add Friend
        </button>
        <ul>
          {friends.map((friendId, index) => (
            <li
              key={index}
              onClick={() => handleFriendClick(friendId)}
              className={`friend-list-item ${selectedFriend === friendId ? "selected" : ""}`}
            >
              {friendUsernames[friendId] || "Loading..."}
              {unreadMessages[friendId] > 0 && (
                <div className="new-message-indicator">{unreadMessages[friendId]}</div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedFriend ? (
          <>
            <div className="chat-header">
              <h3>Chat with {friendUsernames[selectedFriend] || "Unknown"}</h3>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender === "You" ? "user-message" : "recipient-message"}`}
                >
                  <strong>{msg.sender}: </strong>
                  {msg.text}
                  <span className="timestamp">
                    {msg.timestamp?.toLocaleTimeString()}
                    {msg.sender === "You" && (
                      <span className="read-receipt">
                        {msg.viewed ? " ✓✓" : " ✓"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>
            <form onSubmit={handleSendMessage} className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                required
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-header">
            <p>Select a friend to start chatting</p>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button className="logout-button" onClick={handlelogoutModal}>
        Log Out
      </button>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Friend</h3>
            <form onSubmit={handleAddFriendSubmit}>
              <input
                type="text"
                value={newFriend}
                onChange={(e) => setNewFriend(e.target.value)}
                placeholder="Enter friend's username"
                required
              />
              {error && <div className="error-message">{error}</div>}
              <button type="submit">Add</button>
              <button
                type="button"
                onClick={() => {
                  setShowAddFriendModal(false);
                  setError(null); // Clear error when closing
                }}
                
                className="cancel-button"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Remove Friend Modal */}
      {showRemoveFriendModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Remove Friend</h3>
            <p>
              Are you sure you want to remove{" "}
              <strong>{friendUsernames[friendToRemove] || "Unknown"}</strong> from your
              friends list?
            </p>
            <div className="modal-buttons">
              <button
                onClick={handleRemoveFriend}
                className="confirm-button"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => {
                  setShowRemoveFriendModal(false);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Out Modal */}
      {showlogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Log Out?</h3>
            <p>
              Are you sure you want to log out?
            </p>
            <div className="modal-buttons">
              <button
                onClick={handlelogout}
                className="confirm-button"
              >
                Log out
              </button>
              <button
                onClick={() => setShowlogoutModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friend Request Modal */}
      {newFriendRequest && friendRequested && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>You got a new Friend Request!</h3>
            <p>{friendRequestedUsername} wants to be your friend.</p>
            <div className="modal-buttons">
              <button
                onClick={() => handleFriendRequest(friendRequested, "accept")}
                className="confirm-button"
              >
                Accept
              </button>
              <button
                onClick={() => handleFriendRequest(friendRequested, "decline")}
                className="cancel-button"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;