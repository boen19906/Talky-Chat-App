import {React, useState} from "react";


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
  // New props for groups
  groups,
  groupNames,
  handleGroupClick,
  selectedGroup
}) => {

    const [activeTab, setActiveTab] = useState("friends");
  return (
    <div className="friends-list">
      <h3 className="username">{userUsername}</h3>
      <img src="logo.png" alt="logo" className="logo" onClick={handleImageClick}/>
      <button className="add-friend-button" onClick={handleAddFriend}>
        Add Friend
      </button>
      <button className="add-group-button" onClick={() => setShowAddGroupModal(true)}>
        Add Group Chat
      </button>

      <div className="tab-container">
      {/* Tab navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === "friends" ? "active" : ""}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </button>
        <button 
          className={activeTab === "groups" ? "active" : ""}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        <div className={`tab-pane ${activeTab === "friends" ? "active" : ""}`}>
          {/* Your friends content here */}
      <ul className="friends-container">
        {friends && friends.length > 0 ? (
            [...friends].reverse().map((friendId, index) => (
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
              ))
            ) : (
              <li className="no-groups">No groups yet</li>
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
              onClick={() => handleGroupClick(groupId)}
              className={`friend-list-item${selectedGroup === groupId ? "selected" : ""}`}
            >
             {groupNames[groupId] || "Loading..."}
              {unreadMessages[groupId] > 0 && (
                <div className="new-message-indicator">{unreadMessages[groupId]}</div>
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
      
      
      
      
      {activeTab == "groups" &&
      <>
      {/* Groups Section */}
      {/*<h2>Groups</h2>*/}
      
      </>
      }
      
      
      
    </div>
  );
};

export default FriendsList;