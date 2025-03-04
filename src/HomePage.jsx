import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db, storage } from "./firebase"; // Using our firebase config
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
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
  const currentConversationIdRef = useRef(null);

  // For file uploads
  const [imageFile, setImageFile] = useState(null);

  const navigate = useNavigate();

  // 1) Mark "new login" as false after 3s
  useEffect(() => {
    const timer = setTimeout(() => setIsNewLogin(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // 2) Listen to changes in user's friends array
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
    return () => unsubscribe();
  }, []);

  // Helper function to fetch a user's username by ID
  const getUsernameById = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data().username || null;
      } else {
        console.error("User document not found:", userId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      return null;
    }
  };

  // 3) Fetch each friend's username
  useEffect(() => {
    if (friends.length > 0) {
      const fetchFriendUsernames = async () => {
        const usernames = {};
        for (const friendId of friends) {
          const username = await getUsernameById(friendId);
          if (username) {
            usernames[friendId] = username;
          }
        }
        setFriendUsernames(usernames);
      };
      fetchFriendUsernames();
    }
  }, [friends]);

  // 4) Keep track of the current conversation ID
  useEffect(() => {
    const user = auth.currentUser;
    if (user && selectedFriend) {
      currentConversationIdRef.current = [user.uid, selectedFriend].sort().join("_");
    } else {
      currentConversationIdRef.current = null;
    }
  }, [selectedFriend]);

  // 5) Mark messages as viewed when a friend is selected
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

            const updatedTexts = textsArray.map((msg) => {
              if (msg.sender === selectedFriend && !msg.viewed) {
                updated = true;
                return { ...msg, viewed: true };
              }
              return msg;
            });

            if (updated) {
              await updateDoc(conversationRef, { texts: updatedTexts });
              setUnreadMessages((prev) => {
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
  }, [selectedFriend, messages]);

  // 6) Real-time listener for the currently selected conversation
  useEffect(() => {
    let unsubscribe = () => {};

    const fetchMessages = async () => {
      if (selectedFriend) {
        const user = auth.currentUser;
        if (!user) return;

        try {
          const conversationId = [user.uid, selectedFriend].sort().join("_");
          const conversationRef = doc(db, "messages", conversationId);

          unsubscribe = onSnapshot(conversationRef, (docSnap) => {
            // Only update if this is still the current conversation
            if (conversationId === currentConversationIdRef.current) {
              if (docSnap.exists()) {
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
                    sender:
                      msg.sender === user.uid
                        ? "You"
                        : friendUsernames[msg.sender] || "Unknown",
                    timestamp: timestamp,
                    viewed: msg.viewed,
                    imageUrl: msg.imageUrl || null,
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
        setMessages([]);
      }
    };

    fetchMessages();
    return () => unsubscribe();
  }, [selectedFriend, friendUsernames]);

  // 7) Track unread messages for non-selected friends
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

  // 8) Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() && selectedFriend) {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const conversationId = [user.uid, selectedFriend].sort().join("_");
        const conversationRef = doc(db, "messages", conversationId);
        const conversationDoc = await getDoc(conversationRef);

        const newMessage = {
          sender: user.uid,
          recipient: selectedFriend,
          text: message,
          timestamp: new Date().toISOString(),
          viewed: false,
        };

        if (conversationDoc.exists()) {
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

        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // 9) Handle file selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      console.log("File selected:", e.target.files[0]);
      setImageFile(e.target.files[0]);
    }
  };

  // 10) Upload image and send as a message
  const handleUploadImage = async () => {
    console.log("handleUploadImage triggered");
    if (!imageFile) {
      console.log("No image file selected.");
      return;
    }
    if (!selectedFriend) {
      console.log("No friend selected.");
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("User not authenticated.");
        return;
      }
      console.log("Uploading image:", imageFile);

      // Create a unique filename
      const imageName = uuidv4() + "_" + imageFile.name;
      const imageRef = ref(storage, `chatImages/${imageName}`);

      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(imageRef, imageFile);
      console.log("File uploaded, snapshot:", snapshot);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Download URL:", downloadURL);

      // Build the message object with the image URL
      const conversationId = [user.uid, selectedFriend].sort().join("_");
      const conversationRef = doc(db, "messages", conversationId);
      const conversationDoc = await getDoc(conversationRef);

      const newMessage = {
        sender: user.uid,
        recipient: selectedFriend,
        text: "",
        imageUrl: downloadURL,
        timestamp: new Date().toISOString(),
        viewed: false,
      };

      if (conversationDoc.exists()) {
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

      console.log("Image message sent successfully.");
      // Clear the file input
      setImageFile(null);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // 11) Logout handling
  const handlelogoutModal = () => {
    setShowlogoutModal(true);
  };

  const handlelogout = async () => {
    try {
      await signOut(auth);
      navigate("/signup");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // 12) Add friend modal
  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  const handleAddFriendSubmit = async (e) => {
    e.preventDefault();
    if (newFriend.trim()) {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", newFriend));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("User not found. Please check the username and try again.");
          return;
        }

        const friendDoc = querySnapshot.docs[0];
        const friendId = friendDoc.id;
        const friendDocRef = doc(db, "users", friendId);

        // Check if already friends
        if (friends.includes(friendId)) {
          setError("You are already friends with this user.");
          return;
        }

        // Check if request already sent
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        if (
          userData.sentFriendRequests &&
          userData.sentFriendRequests.includes(friendId)
        ) {
          setError("Friend request already sent.");
          return;
        }

        // Add request to friend's friendRequests array
        await updateDoc(friendDocRef, {
          friendRequests: arrayUnion(user.uid),
        });

        // Add to current user's sentFriendRequests array
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          sentFriendRequests: arrayUnion(friendId),
        });

        setNewFriend("");
        setError(null);
        setShowAddFriendModal(false);
      } catch (error) {
        setError(`Error sending friend request: ${error.message}`);
        console.error("Error sending friend request:", error);
      }
    }
  };

  // 13) Handle incoming friend requests
  const handleFriendRequest = async (requesterId, action) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const requesterDocRef = doc(db, "users", requesterId);

      if (action === "accept") {
        await updateDoc(userDocRef, {
          friends: arrayUnion(requesterId),
          friendRequests: arrayRemove(requesterId),
        });

        await updateDoc(requesterDocRef, {
          friends: arrayUnion(user.uid),
          sentFriendRequests: arrayRemove(user.uid),
        });

        setFriends([...friends, requesterId]);
      } else if (action === "decline") {
        await updateDoc(userDocRef, {
          friendRequests: arrayRemove(requesterId),
        });
        await updateDoc(requesterDocRef, {
          sentFriendRequests: arrayRemove(user.uid),
        });
      }
    } catch (error) {
      console.error("Error handling friend request:", error);
      setError(`Error handling friend request: ${error.message}`);
    }
  };

  // 14) Track friendRequests in real-time
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const currentRequests = data.friendRequests || [];

        if (currentRequests.length > 0) {
          setNewFriendRequest(true);
        }
        setFriendRequested(data.friendRequests[0] || "");
      }
    });

    return () => unsubscribe();
  }, []);

  // 15) Remove friend
  const handleRemoveFriend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const friendDocRef = doc(db, "users", friendToRemove);

      // Remove from user's friends
      await updateDoc(userDocRef, {
        friends: arrayRemove(friendToRemove),
      });

      // Remove user from friend's friends
      const friendDoc = await getDoc(friendDocRef);
      if (friendDoc.exists()) {
        await updateDoc(friendDocRef, {
          friends: arrayRemove(user.uid),
        });
      }

      setFriends(friends.filter((f) => f !== friendToRemove));
      setSelectedFriend(null);
      setShowRemoveFriendModal(false);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  // Simple function to reset selected friend on logo click
  const handleImageClick = () => {
    setSelectedFriend(null);
  };

  // 16) Always scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 17) Click friend to chat or remove
  const handleFriendClick = (friendId) => {
    if (selectedFriend === friendId) {
      setFriendToRemove(friendId);
      setShowRemoveFriendModal(true);
    } else {
      setSelectedFriend(friendId);
    }
  };

  // 18) Fetch the username for the incoming friend request
  useEffect(() => {
    const fetchFriendRequestUsername = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        if (friendRequested) {
          const username = await getUsernameById(friendRequested);
          if (username) {
            setFriendRequestedUsername(username);
          }
        }
      } catch (error) {
        console.error("Error fetching friend request username:", error);
      }
    };
    fetchFriendRequestUsername();
  }, [friendRequested]);

  // 19) Render
  return (
    <div className="home-container">
      <audio ref={audioRef} src="/notf.mp3" preload="auto" />

      {/* Friends List */}
      <div className="friends-list">
        <img
          src="logo.png"
          alt="logo"
          className="logo"
          onClick={handleImageClick}
        />
        <h2>Friends</h2>
        <button className="add-friend-button" onClick={handleAddFriend}>
          Add Friend
        </button>
        <ul>
          {friends.map((friendId, index) => (
            <li
              key={index}
              onClick={() => handleFriendClick(friendId)}
              className={`friend-list-item ${
                selectedFriend === friendId ? "selected" : ""
              }`}
            >
              {friendUsernames[friendId] || "Loading..."}
              {unreadMessages[friendId] > 0 && (
                <div className="new-message-indicator">
                  {unreadMessages[friendId]}
                </div>
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
                  className={`message ${
                    msg.sender === "You" ? "user-message" : "recipient-message"
                  }`}
                >
                  <strong>{msg.sender}: </strong>
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded"
                      style={{ maxWidth: "200px", margin: "8px 0" }}
                    />
                  ) : (
                    msg.text
                  )}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="chat-input">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginRight: "8px" }}
              />
              <button
                type="button"
                onClick={handleUploadImage}
                style={{ marginRight: "8px" }}
              >
                Upload
              </button>
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
                  setError(null);
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
              <strong>{friendUsernames[friendToRemove] || "Unknown"}</strong>{" "}
              from your friends list?
            </p>
            <div className="modal-buttons">
              <button onClick={handleRemoveFriend} className="confirm-button">
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
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons">
              <button onClick={handlelogout} className="confirm-button">
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
