import { useState, useEffect } from "react";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";


const useFriends = (setShowFriendRequestModal) => {
  const [friends, setFriends] = useState([]);
  const [friendUsernames, setFriendUsernames] = useState({});
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [groupToRemove, setGroupToRemove] = useState(null);
  const [newFriend, setNewFriend] = useState("");
  const [error, setError] = useState("");
  const [friendRequested, setFriendRequested] = useState("");
  const [newFriendRequest, setNewFriendRequest] = useState(false);
  const [friendRequestedUsername, setFriendRequestedUsername] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupNames, setGroupNames] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("friends");
  
  

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    const userDocRef = doc(db, "users", user.uid);
  
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setFriends(docSnap.data().friends || []);
        setGroups(docSnap.data().groups || []);
      } else {
        console.error("User document not found.");
      }
    });
  
    return () => unsubscribe();
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
    const fetchParticipants = async () => {
      if (!selectedGroup) return;
  
      try {
        // Get group document reference
        const groupDocRef = doc(db, 'messages', selectedGroup);
        const groupDoc = await getDoc(groupDocRef);
  
        if (!groupDoc.exists()) {
          console.error('Group document not found');
          setSelectedGroupMembers([]);
          return;
        }
  
        // Get participants array from document
        const participantsIds = groupDoc.data().participants || [];
        
        // Fetch usernames for all participant IDs
        const usernamesPromises = participantsIds.map(id => getUsernameById(id));
        const usernames = await Promise.all(usernamesPromises);
        
        // Filter out any null values and update state
        const validUsernames = usernames.filter(username => username !== null);
        setSelectedGroupMembers(validUsernames);
  
      } catch (error) {
        console.error('Error fetching participants:', error);
        setSelectedGroupMembers([]);
      }
    };
  
    fetchParticipants();
  }, [selectedGroup]); // Runs whenever selectedGroup changes

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        // Assume you have the current user's ID
        const currentUserId = auth.currentUser.uid;
  
        // Reference to the current user's document
        const userDocRef = doc(db, "users", currentUserId);
  
        // Fetch the user document
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          // Get the groups array from the user document
          const userGroups = userDocSnap.data().groups || [];
  
          if (userGroups.length > 0) {
            // Create a query to fetch group names for these group IDs
            const messagesRef = collection(db, "messages");
            const groupQuery = query(
              messagesRef, 
              where("isGroup", "==", true),
              where("__name__", "in", userGroups)
            );
  
            // Set up a real-time listener for these groups
            const unsubscribe = onSnapshot(groupQuery, (querySnapshot) => {
              const namesMap = {};
  
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                const groupId = doc.id;
                
                if (data.groupName) {
                  namesMap[groupId] = data.groupName;
                }
              });
  
              // Update state with the group names
              setGroupNames(namesMap);
            }, (error) => {
              console.error("Error fetching group names:", error);
            });
  
            // Cleanup function
            return () => unsubscribe();
          } else {
            // User is not in any groups
            setGroupNames({});
          }
        } else {
          console.error("No user document found");
          setGroupNames({});
        }
      } catch (error) {
        console.error("Error fetching user groups:", error);
        setGroupNames({});
      }
    };
  
    // Initial fetch
    fetchUserGroups();
  }, [auth.currentUser.uid, groups]); // Add auth.currentUser.uid as a dependency

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
          setShowFriendRequestModal(true);
        }

        setFriendRequested(data.friendRequests[0]); // Update state with new requests
      }
    });

    return () => unsubscribe();
  }, []);

  //fetch friend request username
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

  const handleAddFriendSubmit = async () => {
    
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
  
      setNewFriendRequest(false);
    } catch (error) {
      console.error("Error handling friend request:", error);
      setError(`Error handling friend request: ${error.message}`);
    }
  };

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
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleRemoveFromGroup = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      const userDocRef = doc(db, "users", user.uid);
      const groupDocRef = doc(db, "messages", groupToRemove);
  
      // Remove the user from the group's participants array
      await updateDoc(groupDocRef, {
        participants: arrayRemove(user.uid),
      });
  
      // Remove the group from the user's groups list
      await updateDoc(userDocRef, {
        groups: arrayRemove(groupToRemove),
      });

      setGroups(groups.filter((group) => group !== groupToRemove));
      setSelectedGroup(null);
  
     
    } catch (error) {
      console.error("Error removing user from group:", error);
    }
  };

  const createGroup = async (groupName, memberIds) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      // Make sure current user is included
      if (!memberIds.includes(user.uid)) {
        memberIds.push(user.uid);
      }
  
      // Sort participant IDs for consistency
      const participants = [...memberIds].sort();
  
      // Create the group ID from sorted participant IDs
      const groupId = `${participants.join('_')}`;
  
      // Check if group already exists
      const messagesRef = doc(db, "messages", groupId);
      const docSnap = await getDoc(messagesRef);
      if (docSnap.exists()) {
        setError("This group chat already exists");
        return null;
      }
  
      // Add the group to each participant's groups array
      for (const memberId of participants) {
        const memberRef = doc(db, "users", memberId);
        await updateDoc(memberRef, {
          groups: arrayUnion(groupId)
        });
      }
  
      // Create the messages document
      await setDoc(messagesRef, {
        participants,
        groupName: groupName,
        isGroup: true,
        texts: [],
        lastUpdated: serverTimestamp()
      });

      setActiveTab("groups");
  
      return groupId;
    } catch (error) {
      console.error("Error creating group:", error);
      setError(`Error creating group: ${error.message}`);
      return null;
    }
  };

  return {
    friends,
    friendUsernames,
    selectedFriend,
    setSelectedFriend,
    selectedGroup,
    setSelectedGroup,
    selectedGroupMembers,
    setSelectedGroupMembers,
    friendToRemove,
    setFriendToRemove,
    groupToRemove,
    setGroupToRemove,
    newFriend,
    setNewFriend,
    error,
    setError,
    friendRequested,
    setFriendRequested,
    newFriendRequest,
    setNewFriendRequest,
    friendRequestedUsername,
    handleAddFriendSubmit,
    handleFriendRequest,
    handleRemoveFriend,
    handleRemoveFromGroup,
    groups,
    setGroups,
    groupNames,
    setGroupNames,
    createGroup,
    activeTab,
    setActiveTab
  };
};

export default useFriends;