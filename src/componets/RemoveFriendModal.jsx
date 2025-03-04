import React from "react";

const RemoveFriendModal = ({ 
  friendUsernames, 
  friendToRemove, 
  handleRemoveFriend, 
  setShowRemoveFriendModal 
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Remove Friend</h3>
        <p>
          Are you sure you want to remove{" "}
          <strong>{friendUsernames[friendToRemove] || "Unknown"}</strong> from your
          friends list?
        </p>
        <div className="modal-buttons">
          <button
            onClick={() => {handleRemoveFriend()
                setShowRemoveFriendModal(false)}}
            className="confirm-button"
          >
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
  );
};

export default RemoveFriendModal;