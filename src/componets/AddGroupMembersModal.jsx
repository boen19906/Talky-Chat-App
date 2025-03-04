import React, { useState } from "react";

const AddGroupMembersModal = ({ 
  newGroup, 
  setNewGroup, 
  error, 
  setError, 
  setShowAddGroupMembers, 
  groupName,
  setGroupName,
  friends,
  friendUsernames,
  createGroup
}) => {
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Handle checkbox changes when selecting/deselecting friends
  const handleCheckboxChange = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Create the group with selected friends
  const handleCreateGroup = async () => {
    if (selectedFriends.length === 0) {
      setError("Please select at least one friend for the group");
      return;
    }
    
    if (!groupName.trim()) {
      setError("Please provide a group name");
      return;
    }
    
    // Call createGroup function from props
    const groupId = await createGroup(groupName, selectedFriends);
    
    if (groupId) {
      setShowAddGroupMembers(false);
      setError("");
      setGroupName("");
    }
  };

  // Cancel group creation
  const handleCancel = () => {
    setShowAddGroupMembers(false);
    setError("");
  };

  return (
    <div className="modal-overlay">
  <div className="modal">
    <h2>Add Members to "{groupName}"</h2>
    <p>Select friends to add to your group:</p>
    
    {error && <div className="error-message">{error}</div>}
    
    <div className="friends-list-container">
      {friends && friends.length > 0 ? (
        <ul className="friends-select-list">
          {friends.map((friendId) => (
            <li key={friendId} className="friend-select-item">
              <label className="friend-select-label">
                <div 
                  className={`friend-select-box ${selectedFriends.includes(friendId) ? 'selected' : ''}`}
                  onClick={() => handleCheckboxChange(friendId)}
                >
                  <span className="friend-name">
                    {friendUsernames[friendId] || "Loading..."}
                  </span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-friends-message">No friends available to add</p>
      )}
    </div>

    <div className="modal-buttons">
      <button 
        className="create-button" 
        onClick={handleCreateGroup}
      >
        Create Group
      </button>
      <button 
        className="cancel-button" 
        onClick={handleCancel}
      >
        Cancel
      </button>
    </div>
  </div>
</div>
  );
};

export default AddGroupMembersModal;