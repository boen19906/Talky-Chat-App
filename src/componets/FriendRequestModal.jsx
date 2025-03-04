import React from "react";

const FriendRequestModal = ({ 
  friendRequested, 
  friendRequestedUsername, 
  handleFriendRequest,
  setShowFriendRequestModal
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>You got a new Friend Request!</h3>
        <p><strong>{friendRequestedUsername}</strong> wants to be your friend.</p>
        <div className="modal-buttons">
          <button
            onClick={() => { handleFriendRequest(friendRequested, "accept"); setShowFriendRequestModal(false)}}
            className="confirm-button"
          >
            Accept
          </button>
          <button
            onClick={() => { handleFriendRequest(friendRequested, "decline"); setShowFriendRequestModal(false)}}
            className="cancel-button"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestModal;