import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import HamburgerMenu from "./componets/HamburgerMenu";
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
import ImageModal from "./componets/ImageModal";
import GamesModal from "./componets/GamesModal";
import ReactionsModal from "./componets/ReactionsModal";

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
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [deletedMessageIndex, setDeletedMessageIndex] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [newGroup, setNewGroup] = useState([]);
  const [error, setError] = useState("");
  const [isNewLogin, setIsNewLogin] = useState(true);
  const [modalOn, setModalOn] = useState(false);

  // Custom hooks
  const { user } = useAuth();
  const { userUsername } = useUsername();
  const { selectedGroup, setSelectedGroup, selectedGroupMembers, setSelectedGroupMembers, groupNames, setGroupNames, groups, setGroups, createGroup, selectedFriend, setSelectedFriend, friends, friendToRemove, setFriendToRemove, 
          newFriend, setNewFriend, groupToRemove, setGroupToRemove, friendRequested, setFriendRequested, friendRequestedUsername, friendUsernames, handleAddFriendSubmit, handleRemoveFriend, handleRemoveFromGroup, handleFriendRequest,
        activeTab, setActiveTab } = useFriends(setShowFriendRequestModal);
  const { message, setMessage, messages, handleSendMessage, handleImageChange, handleUploadImage, handleDeleteMessage, handleCancelImage, imageFile, fileInputRef, imagePreview, isLoading,
    friendToTop, setFriendToTop, isProcessing, selectedImage, setSelectedImage,handleSendReaction, reactionIndex, setReactionIndex
   } = useMessages(
    selectedFriend,
    selectedGroup,
    friendUsernames, 
    deletedMessageIndex,
    userUsername
  );
  const { unreadMessages, setUnreadMessages } = useUnreadMessages(friends, selectedFriend, groups, selectedGroup, isNewLogin, audioRef);


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
    setModalOn(true);
  };

  const handleImageClick = () => {
    console.log(showImageModal);
    setSelectedFriend(null);
    setSelectedGroup(null);
  };

  const handleFriendClick = (friendId) => {
    setSelectedGroup(null);
    if (selectedFriend === friendId) {
      setFriendToRemove(friendId);
      setShowRemoveFriendModal(true);
      setModalOn(true);
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
      {/*Hamburger Menu*/}
      <HamburgerMenu
        handleAddFriend={handleAddFriend}
        setShowAddGroupModal={setShowAddGroupModal}
        setShowGamesModal={setShowGamesModal}
        setModalOn={setModalOn}
      />
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
        setUnreadMessages={setUnreadMessages}
        groups = {groups}
        groupNames = {groupNames}
        handleGroupClick = {handleGroupClick}
        activeTab = {activeTab}
        setActiveTab = {setActiveTab}
        friendToTop={friendToTop}
        setFriendToTop={setFriendToTop}
        setModalOn={setModalOn}
        
      />
      

      {/* Chat Area */}
      <ChatArea 
        selectedFriend={selectedFriend}
        selectedGroup = {selectedGroup}
        selectedGroupMembers={selectedGroupMembers}
        groupNames = {groupNames}
        friendUsernames={friendUsernames}
        messages={messages}
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        handleImageChange = {handleImageChange}
        handleUploadImage = {handleUploadImage}
        handleCancelImage={handleCancelImage}
        imageFile={imageFile}
        imagePreview={imagePreview}
        fileInputRef={fileInputRef}
        isLoading={isLoading}
        setShowDeleteMessageModal={setShowDeleteMessageModal}
        setDeletedMessageIndex={setDeletedMessageIndex}
        isProcessing = {isProcessing}
        setSelectedImage = {setSelectedImage}
        setShowImageModal={setShowImageModal}
        modalOn={modalOn}
        setModalOn={setModalOn}
        setShowReactionsModal={setShowReactionsModal}
        setReactionIndex={setReactionIndex}
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
          setModalOn={setModalOn}
        />
      )}

      {showFriendRequestModal && (
        <FriendRequestModal
          friendRequested = {friendRequested}
          friendRequestedUsername = {friendRequestedUsername}
          handleFriendRequest = {handleFriendRequest}
          setShowFriendRequestModal={setShowFriendRequestModal}
          setModalOn={setModalOn}
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
          setModalOn={setModalOn}
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
          setModalOn={setModalOn}
        />
      )}

      {showRemoveFriendModal && (
        <RemoveFriendModal 
          friendUsernames={friendUsernames}
          friendToRemove={friendToRemove}
          handleRemoveFriend={handleRemoveFriend}
          setShowRemoveFriendModal={setShowRemoveFriendModal}
          setModalOn={setModalOn}
        />
      )}

      {showRemoveGroupModal &&
        <RemoveGroupModal
        groupNames = {groupNames} 
        groupToRemove = {groupToRemove}
        handleRemoveFromGroup = {handleRemoveFromGroup} 
        setShowRemoveGroupModal ={setShowRemoveGroupModal}
        setModalOn={setModalOn}
        />
      }

      {showlogoutModal && (
        <LogoutModal 
          handlelogout={handlelogout}
          setShowlogoutModal={setShowlogoutModal}
          setModalOn={setModalOn}
        />
      )}

      {requestSent && (
        <RequestSentModal 
          setRequestSent={setRequestSent}
          setModalOn={setModalOn}
        />
      )}

      {showDeleteMessageModal && (
        <DeleteMessageModal 
          handleDeleteMessage={handleDeleteMessage}
          setShowDeleteMessageModal={setShowDeleteMessageModal}
          setModalOn={setModalOn}
        />
      )}

      {showGamesModal && (
        <GamesModal 
          setShowGamesModal={setShowGamesModal}
          setModalOn={setModalOn}
        />
      )}

      {showImageModal && (
        <ImageModal
          selectedImage={selectedImage}
          setShowImageModal={setShowImageModal}
          setModalOn={setModalOn}
        />
      )}

      {showReactionsModal && (
        <ReactionsModal
          setShowReactionsModal={setShowReactionsModal}
          handleSendReaction={handleSendReaction}
        />
      )}
    </div>
  );
};

export default HomePage;