import React from "react";

const AddGroupModal = ({ 
  setGroupName, 
  error, 
  setShowAddGroupMembers, 
  setShowAddGroupModal, 
  setNewGroup, 
  setError 
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create Group Chat</h3>
        <form>
          <input
            type="text"
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group chat name"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="button" 
            onClick={() => {
              setShowAddGroupMembers(true);
              setShowAddGroupModal(false);
            }}
          >
            Continue to Add Members
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddGroupModal(false);
              setNewGroup([]);
              setError(null);
            }}
            className="cancel-button"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddGroupModal;