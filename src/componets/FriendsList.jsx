import {React, useState, useRef, useEffect} from "react";


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
  // New props for groups
  groups,
  groupNames,
  handleGroupClick,
  selectedGroup,
  friendToTop,
  setFriendToTop,
  setModalOn
}) => {

  const friendsListRef = useRef(null);

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
          <span>Friends ({friends.length})</span>
        </button>
        <button 
          className={activeTab === "groups" ? "active" : ""}
          onClick={() => setActiveTab("groups")}
        >
          <span>Groups ({groups.length})</span>
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
            {unreadMessages[friendId] > 0 && selectedFriend !== friendId && (
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
          {/* Your groups content here */}
          <ul className="friends-container">
        {groups && groups.length > 0 ? (
          groups.map((groupId, index) => (
            <li
              key={groupId}
              onClick={() => {handleGroupClick(groupId); setModalOn(true);}}
              className={`friend-list-item${selectedGroup === groupId ? "selected" : ""}`}
            >
             {groupNames[groupId] || "Loading..."}
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