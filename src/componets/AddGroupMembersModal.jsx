import React, { useState, useEffect, useRef } from "react";

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
  createGroup,
  setModalOn
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddGroupMembers(false);
        setModalOn(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [selectedFriends, setSelectedFriends] = useState([]);

  const handleCheckboxChange = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleCreateGroup = async () => {
    setError("");
    
    // Validate minimum 3 members (creator + 2 friends)
    if (selectedFriends.length < 2) {
      setError("Please select at least two friends for the group");
      return;
    }
    
    if (!groupName.trim()) {
      setError("Please provide a group name");
      return;
    }
    
    const groupId = await createGroup(groupName, selectedFriends);
    console.log(groupId);
    if (groupId == null) {
      setError("Group already exists!");
    }
    if (groupId) {
      setShowAddGroupMembers(false);
      setError("");
      setGroupName("");
      setModalOn(false);
    }
  };

  const handleCancel = () => {
    setShowAddGroupMembers(false);
    setError("");
    setModalOn(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <h2>Add Members to "{groupName}"</h2>
        <p>Select friends to add to your group:</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="friends-list-container">
          {friends && friends.length > 0 ? (
            <ul className="friends-select-list">
              {friends.reverse().map((friendId) => (
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