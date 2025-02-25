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
  const [newMessages, setNewMessages] = useState(new Set());
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const currentConversationIdRef = useRef(null); // Use ref to track current conversation ID

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            const friendsArray = userDoc.data().friends || [];
            setFriends(friendsArray);
          } else {
            console.error("User document not found.");
          }
        } catch (error) {
          console.error("Error fetching friends array:", error);
        }
      }
    };
  
    fetchFriends();
  }, []);

  useEffect(() => {
    if (friends.length > 0) {
      const fetchFriendUsernames = async () => {
        const usernames = {};
        for (const friendId of friends) {
          const friendDocRef = doc(db, "users", friendId);
          const friendDoc = await getDoc(friendDocRef);
          if (friendDoc.exists()) {
            usernames[friendId] = friendDoc.data().username;
          } else {
            console.error("Friend document not found for ID:", friendId);
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

  // useEffect to track new messages from unselected friends
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const messagesCollectionRef = collection(db, "messages");
    const userConversationsQuery = query(
      messagesCollectionRef,
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(userConversationsQuery, (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const participants = change.doc.data().participants;
          const otherParticipant = participants.find((participant) => participant !== user.uid);

          // Only mark as new if it's not the currently selected conversation
          if (otherParticipant && otherParticipant !== selectedFriend) {
            setNewMessages((prev) => new Set(prev).add(otherParticipant));
            
            if (audioRef.current) {
                audioRef.current.play().catch((err) => console.error("Error playing sound:", err));
            }
        }
        
        }
      });
    });

    return () => unsubscribe();
  }, [selectedFriend]);
  
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
            // Show error in the modal
            setError("User not found. Please check the username and try again.");
            return;
          }
  
          // Get the friend's user ID
          const friendDoc = querySnapshot.docs[0];
          const friendId = friendDoc.id;
  
          // Add the friend's user ID to the current user's friends array
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            friends: arrayUnion(friendId),
          });
  
          // Update local state
          setFriends([...friends, friendId]);
          setNewFriend("");
          setError(null); // Clear any previous errors
          setShowAddFriendModal(false);
        }
      } catch (error) {
        // Show error in the modal
        setError(`Error adding friend: ${error.message}`);
        console.error("Error adding friend:", error);
      }
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
  
        // Remove the friend from Firestore
        await updateDoc(userDocRef, {
          friends: arrayRemove(friendToRemove),
        });
  
        // Update the local state
        setFriends(friends.filter((friend) => friend !== friendToRemove));
        setSelectedFriend(null);
        setShowRemoveFriendModal(false);
      }
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
      setNewMessages((prev) => {
        const updated = new Set(prev);
        updated.delete(friendId);
        return updated;
      });
    }
  };

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
              {newMessages.has(friendId) && <div className="new-message-indicator" />}
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
    </div>
  );
};

export default HomePage;