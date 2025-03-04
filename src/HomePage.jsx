import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import FriendsList from "./componets/FriendsList";
import ChatArea from "./componets/ChatArea";
import useAuth from "./componets/useAuth";
import useMessages from "./componets/useMessages";
import useFriends from "./componets/useFriends";
import useUnreadMessages from "./componets/useUnreadMessages";
import useUsername from "./componets/useUsername";
import AddFriendModal from "./componets/AddFriendModal";
import RemoveFriendModal from "./componets/RemoveFriendModal";
import RemoveGroupModal from "./componets/RemoveGroupModal";
import LogoutModal from "./componets/LogOutModal";
import FriendRequestModal from "./componets/FriendRequestModal";
import RequestSentModal from "./componets/RequestSentModal";
import DeleteMessageModal from "./componets/DeleteMessageModal";
import AddGroupModal from "./componets/AddGroupModal";
import AddGroupMembersModal from "./componets/AddGroupMembersModal";

const HomePage = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [showlogoutModal, setShowlogoutModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);
  const [showRemoveGroupModal, setShowRemoveGroupModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddGroupMembers, setShowAddGroupMembers] = useState(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [deletedMessageIndex, setDeletedMessageIndex] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [newGroup, setNewGroup] = useState([]);
  const [error, setError] = useState("");
  const [isNewLogin, setIsNewLogin] = useState(true);

  // Custom hooks
  const { user } = useAuth();
  const { selectedGroup, setSelectedGroup, groupNames, setGroupNames, groups, setGroups, createGroup, selectedFriend, setSelectedFriend, friends, friendToRemove, setFriendToRemove, 
          newFriend, setNewFriend, groupToRemove, setGroupToRemove, friendRequested, setFriendRequested, friendRequestedUsername, friendUsernames, handleAddFriendSubmit, handleRemoveFriend, handleRemoveFromGroup, handleFriendRequest } = useFriends(setShowFriendRequestModal);
  const { message, setMessage, messages, handleSendMessage, handleDeleteMessage } = useMessages(
    selectedFriend,
    selectedGroup,
    friendUsernames, 
    deletedMessageIndex
  );
  const { unreadMessages } = useUnreadMessages(friends, selectedFriend, isNewLogin, audioRef);
  const { userUsername } = useUsername();

  useEffect(() => {
    // Reset 'isNewLogin' after 3 seconds
    const timer = setTimeout(() => setIsNewLogin(false), 3000);
    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

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

  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  const handleImageClick = () => {
    setSelectedFriend(null);
    setSelectedGroup(null);
  };

  const handleFriendClick = (friendId) => {
    setSelectedGroup(null);
    if (selectedFriend === friendId) {
      setFriendToRemove(friendId);
      setShowRemoveFriendModal(true);
    } else {
      setSelectedFriend(friendId);
    }
  };

  const handleGroupClick = (groupId) => {
    if (selectedGroup === groupId) {
      setGroupToRemove(groupId);
      setShowRemoveGroupModal(true);
    } else {
      setSelectedGroup(groupId);
      setSelectedFriend(null);
    }
  };

  return (
    <div className="home-container">
      <audio ref={audioRef} src="/notf.mp3" preload="auto" />

      {/* Friends List */}
      <FriendsList 
        userUsername={userUsername}
        handleImageClick={handleImageClick} 
        handleAddFriend={handleAddFriend}
        friends={friends}
        handleFriendClick={handleFriendClick}
        selectedFriend={selectedFriend}
        friendUsernames={friendUsernames}
        unreadMessages={unreadMessages}
        setShowAddGroupModal={setShowAddGroupModal}
        groups = {groups}
        groupNames = {groupNames}
        handleGroupClick = {handleGroupClick}
      />
      

      {/* Chat Area */}
      <ChatArea 
        selectedFriend={selectedFriend}
        selectedGroup = {selectedGroup}
        groupNames = {groupNames}
        friendUsernames={friendUsernames}
        messages={messages}
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        setShowDeleteMessageModal={setShowDeleteMessageModal}
        setDeletedMessageIndex={setDeletedMessageIndex}
      />

      {/* Logout Button */}
      <button className="logout-button" onClick={handlelogoutModal}>
        Log Out
      </button>

      {/* Modals */}
      {showAddFriendModal && (
        <AddFriendModal 
          handleAddFriendSubmit={handleAddFriendSubmit}
          setShowAddFriendModal={setShowAddFriendModal}
          error={error}
          setError={setError}
          newFriend = {newFriend}
          setNewFriend = {setNewFriend}
          setRequestSent={setRequestSent}
        />
      )}

      {showFriendRequestModal && (
        <FriendRequestModal
          friendRequested = {friendRequested}
          friendRequestedUsername = {friendRequestedUsername}
          handleFriendRequest = {handleFriendRequest}
          setShowFriendRequestModal={setShowFriendRequestModal}
        />
      )}

      {showAddGroupModal && (
        <AddGroupModal 
          setGroupName={setGroupName}
          error={error}
          setShowAddGroupMembers={setShowAddGroupMembers}
          setShowAddGroupModal={setShowAddGroupModal}
          setNewGroup={setNewGroup}
          setError={setError}
        />
      )}



      {showAddGroupMembers && (
        <AddGroupMembersModal 
          newGroup={newGroup}
          setNewGroup={setNewGroup}
          error={error}
          setError={setError}
          setShowAddGroupMembers={setShowAddGroupMembers}
          groupName={groupName}
          setGroupName = {setGroupName}
          friends={friends}
          friendUsernames={friendUsernames}
          createGroup = {createGroup}
        />
      )}

      {showRemoveFriendModal && (
        <RemoveFriendModal 
          friendUsernames={friendUsernames}
          friendToRemove={friendToRemove}
          handleRemoveFriend={handleRemoveFriend}
          setShowRemoveFriendModal={setShowRemoveFriendModal}
        />
      )}

      {showRemoveGroupModal &&
        <RemoveGroupModal
        groupNames = {groupNames} 
        groupToRemove = {groupToRemove}
        handleRemoveFromGroup = {handleRemoveFromGroup} 
        setShowRemoveGroupModal ={setShowRemoveGroupModal}
        />
      }

      {showlogoutModal && (
        <LogoutModal 
          handlelogout={handlelogout}
          setShowlogoutModal={setShowlogoutModal}
        />
      )}

      {requestSent && (
        <RequestSentModal 
          setRequestSent={setRequestSent}
        />
      )}

      {showDeleteMessageModal && (
        <DeleteMessageModal 
          handleDeleteMessage={handleDeleteMessage}
          setShowDeleteMessageModal={setShowDeleteMessageModal}
        />
      )}
    </div>
  );
};

export default HomePage;