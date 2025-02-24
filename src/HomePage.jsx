import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion,arrayRemove, query, where,collection,getDocs,setDoc, serverTimestamp, onSnapshot} from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false); // State for the modal
  const [newFriend, setNewFriend] = useState(""); // State for the new friend's username
  const [friends, setFriends] = useState([]); // State for the friend's list
  const [friendUsernames, setFriendUsernames] = useState({}); // Store usernames by user ID
  const [selectedFriend, setSelectedFriend] = useState(null); // State for selected friend
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState(null); // Track which friend to remove
  const [showLogOutModal, setShowLogOutModal] = useState(false);
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
            setFriends(friendsArray); // Update the friends array
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
    if (friends.length > 0) { // Only fetch usernames if friends array is populated
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
  }, [friends]); // Run this effect whenever the friends array changes

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedFriend) {
        console.log("Fetching messages for selectedFriend:", selectedFriend);
  
        try {
          const user = auth.currentUser;
          if (user) {
            console.log("Current user:", user.uid);
  
            // Step 1: Create a unique ID for the conversation
            const conversationId = [user.uid, selectedFriend].sort().join("_");
            console.log("Generated conversationId:", conversationId);
  
            // Step 2: Reference the conversation document
            const conversationRef = doc(db, "messages", conversationId);
            console.log("Referencing conversation document:", conversationRef.path);
  
            // Step 3: Set up a real-time listener for the conversation document
            const unsubscribe = onSnapshot(conversationRef, (doc) => {
              console.log("Received real-time update for conversation document:", doc.exists() ? "Exists" : "Does not exist");
  
              if (doc.exists()) {
                // Step 4: Get the `texts` array from the document
                const texts = doc.data().texts || [];
                console.log("Fetched texts array:", texts);
  
                // Step 5: Update the local state with the fetched messages
                const formattedMessages = texts.map((msg) => {
                  let timestamp;
                  if (msg.timestamp?.toDate) {
                    // If timestamp is a Firestore Timestamp, convert it to a Date
                    timestamp = msg.timestamp.toDate();
                  } else if (msg.timestamp?.seconds) {
                    // If timestamp is a plain object with seconds and nanoseconds, convert it to a Date
                    timestamp = new Date(msg.timestamp.seconds * 1000);
                  } else if (typeof msg.timestamp === "string") {
                    // If timestamp is a string, parse it as a Date
                    timestamp = new Date(msg.timestamp);
                  } else {
                    // If timestamp is missing or invalid, use the current time
                    console.warn("Invalid timestamp format. Using current time.");
                    timestamp = new Date();
                  }
  
                  return {
                    text: msg.text,
                    sender: msg.sender === user.uid ? "You" : friendUsernames[msg.sender] || "Unknown",
                    timestamp: timestamp,
                  };
                });
  
                console.log("Formatted messages:", formattedMessages);
                setMessages(formattedMessages);
              } else {
                // Step 6: If the document doesn't exist, set messages to an empty array
                console.log("No conversation document found. Setting messages to empty array.");
                setMessages([]);
              }
            });
  
            // Step 7: Clean up the listener when the component unmounts or selectedFriend changes
            return () => unsubscribe();
          }
        } catch (error) {
          console.error("Error setting up real-time listener:", error);
        }
      } else {
        console.log("No selectedFriend. Skipping message fetch.");
      }
    };
  
    fetchMessages();
  }, [selectedFriend, friendUsernames]);
  

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() && selectedFriend) {
      try {
        const user = auth.currentUser;
        if (user) {
          // Step 1: Create a unique ID for the conversation
          const conversationId = [user.uid, selectedFriend].sort().join("_");
  
          // Step 2: Reference the conversation document
          const conversationRef = doc(db, "messages", conversationId);
  
          // Step 3: Check if the document exists
          const conversationDoc = await getDoc(conversationRef);
  
          if (conversationDoc.exists()) {
            // Step 4: If the document exists, append the new message to the `texts` array
            await updateDoc(conversationRef, {
              texts: arrayUnion({
                sender: user.uid,
                recipient: selectedFriend,
                text: message,
                timestamp: new Date().toISOString(), // Use client-side timestamp for now
              }),
              lastUpdated: serverTimestamp(), // Update the lastUpdated field
            });
          } else {
            // Step 5: If the document doesn't exist, create it with the new message
            await setDoc(conversationRef, {
              participants: [user.uid, selectedFriend],
              texts: [
                {
                  sender: user.uid,
                  recipient: selectedFriend,
                  text: message,
                  timestamp: new Date().toISOString(), // Use client-side timestamp for now
                },
              ],
              lastUpdated: serverTimestamp(), // Add a lastUpdated field
            });
          }
  
          // Step 6: Update local state to display the message
          setMessages([
            ...messages,
            { text: message, sender: "You", timestamp: new Date() },
          ]);
          setMessage("");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleLogOutModal = () => {
    setShowLogOutModal(true);
  }

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      navigate("/signup"); // Redirect to the sign-up page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleAddFriend = () => {
    setShowAddFriendModal(true); // Show the add friend modal
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
            throw new Error("User not found.");
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
          setShowAddFriendModal(false);
        }
      } catch (error) {
        console.error("Error adding friend:", error);
      }
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
  
        // Step 1: Remove the friend from Firestore
        await updateDoc(userDocRef, {
          friends: arrayRemove(friendToRemove), // Remove the friend from the array
        });
  
        // Step 2: Update the local state
        setFriends(friends.filter((friend) => friend !== friendToRemove));
        setSelectedFriend(null); // Clear the selected friend
        setShowRemoveFriendModal(false); // Close the modal
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  return (
    <div className="home-container">
      {/* Friends List */}
      
      <div className="friends-list">
        <img src="logo.png" alt="Logo" className="logo" />
        <h2>Friends</h2>
        <button className="add-friend-button" onClick={handleAddFriend}>
          Add Friend
        </button>
        <ul>
            {friends.map((friendId, index) => (
                <li
                key={index}
                onClick={() => {
                    if (selectedFriend === friendId) {
                    setFriendToRemove(friendId);
                    setShowRemoveFriendModal(true);
                    } else {
                    setSelectedFriend(friendId);
                    }
                }}
                className={selectedFriend === friendId ? "selected" : ""}
                >
                {friendUsernames[friendId] || "Loading..."}
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
                        {msg.timestamp?.toLocaleTimeString()} {/* Display the timestamp */}
                    </span>
                    </div>
                ))}
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
          <div className="chat-placeholder">
            <p>Select a friend to start chatting</p>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button className="logout-button" onClick={handleLogOutModal}>
        Log Out
      </button>
      {/*Add Friend Modal*/}
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
              <button type="submit">Add</button>
              <button
                type="button"
                onClick={() => setShowAddFriendModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/*Remove Friend Modal*/}
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
                onClick={handleRemoveFriend} // Handle the removal
                className="confirm-button"
                >
                Yes, Remove
                </button>
                <button
                onClick={() => setShowRemoveFriendModal(false)} // Close the modal
                className="cancel-button"
                >
                Cancel
                </button>
            </div>
            </div>
        </div>
        )}
        {/*Log Out Modal*/}
        {showLogOutModal && (
        <div className="modal-overlay">
            <div className="modal">
            <h3>Log Out?</h3>
            <p>
                Are you sure you want to log out?
            </p>
            <div className="modal-buttons">
                <button
                onClick={handleLogout} // Handle the removal
                className="confirm-button"
                >
                Log out
                </button>
                <button
                onClick={() => setShowLogOutModal(false)} // Close the modal
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