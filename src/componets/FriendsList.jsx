import React, { useState, useRef, useEffect, useMemo } from "react";

const FriendsList = ({ 
  userUsername, 
  handleImageClick, 
  handleAddFriend, 
  friends, 
  handleFriendClick, 
  selectedFriend, 
  friendUsernames, 
  unreadMessages,
  setShowAddGroupModal,
  setUnreadMessages,
  activeTab,
  setActiveTab,
  // Group-related props
  groups,
  groupNames,
  handleGroupClick,
  selectedGroup,
  friendToTop,
  setFriendToTop,
  setModalOn,
  // New prop for group unread messages
  groupUnreadMessages,
  setGroupUnreadMessages
}) => {

  const friendsListRef = useRef(null);

  // Calculate total unread counts for friends and groups
  const totalFriendsUnread = useMemo(() => {
    if (!unreadMessages) return 0;
    return Object.keys(unreadMessages).reduce((total, friendId) => 
      total + (unreadMessages[friendId] || 0), 0);
  }, [unreadMessages]);

  const totalGroupsUnread = useMemo(() => {
    if (!groupUnreadMessages) return 0;
    return Object.keys(groupUnreadMessages).reduce((total, groupId) => 
      total + (groupUnreadMessages[groupId] || 0), 0);
  }, [groupUnreadMessages]);

  useEffect(() => {
    if (friendToTop && friendsListRef.current) {
      console.log("yo scrol");
      // Scroll to top with smooth behavior
      friendsListRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Reset the trigger after scrolling
      setFriendToTop(false);
    }
  }, [friendToTop, friendsListRef]);
  
  return (
    <div className="friends-list">
      <h3 className="username">{userUsername}</h3>
      <img src="logo.png" alt="logo" className="logo" onClick={handleImageClick}/>
      <button className="add-friend-button" onClick={handleAddFriend}>
        Add Friend
      </button>
      <button className="add-group-button" onClick={() => {setShowAddGroupModal(true); setModalOn(true);}}>
        Add Group Chat
      </button>

      <div className="tab-container">
        {/* Tab navigation */}
        <div className="tab-navigation">
          <button 
            className={activeTab === "friends" ? "active" : ""}
            onClick={() => setActiveTab("friends")}
          >
            <span style={{ fontWeight: 900 }}>
              Friends ({friends.length})
            </span>


            {totalFriendsUnread > 0 && (
              <div className="new-message-indicator tab-indicator">{totalFriendsUnread}</div>
            )}
          </button>
          <button 
            className={activeTab === "groups" ? "active" : ""}
            onClick={() => setActiveTab("groups")}
          >
            <span>Groups ({groups.length})</span>
            {totalGroupsUnread > 0 && (
              <div className="new-message-indicator tab-indicator">{totalGroupsUnread}</div>
            )}
          </button>
        </div>
        
        {/* Tab content */}
        <div className="tab-content" ref={friendsListRef}>
          <div className={`tab-pane ${activeTab === "friends" ? "active" : ""}`}>
            <ul className="friends-container" >
              {friends && friends.length > 0 ? (
                [...friends].reverse().map((friendId, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      handleFriendClick(friendId);
                      // Clear unread messages when clicking the friend
                      setUnreadMessages(prev => ({
                        ...prev,
                        [friendId]: 0
                      }));
                    }}
                    className={`friend-list-item ${selectedFriend === friendId ? "selected" : ""}`}
                  >
                    {friendUsernames[friendId] || "Loading..."}
                    {/* Only show if there are unreads AND it's not the selected friend */}
                    {unreadMessages && unreadMessages[friendId] > 0 && selectedFriend !== friendId && (
                      <div className="new-message-indicator">{unreadMessages[friendId]}</div>
                    )}
                  </li>
                ))
              ) : (
                <li className="no-groups">No friends yet</li>
              )}
            </ul>
          </div>
          <div className={`tab-pane ${activeTab === "groups" ? "active" : ""}`}>
            <ul className="friends-container">
              {groups && groups.length > 0 ? (
                groups.reverse().map((groupId, index) => (
                  <li
                    key={groupId}
                    onClick={() => {
                      handleGroupClick(groupId); 
                      setModalOn(true);
                      // Clear unread messages when clicking the group
                      setGroupUnreadMessages(prev => ({
                        ...prev,
                        [groupId]: 0
                      }));
                    }}
                    className={`friend-list-item ${selectedGroup === groupId ? "selected" : ""}`}
                  >
                    {groupNames[groupId] || "Loading..."}
                    {/* Display unread count for groups */}
                    {groupUnreadMessages && groupUnreadMessages[groupId] > 0 && selectedGroup !== groupId && (
                      <div className="new-message-indicator">{groupUnreadMessages[groupId]}</div>
                    )}
                  </li>
                ))
              ) : (
                <li className="no-groups">No groups yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsList;