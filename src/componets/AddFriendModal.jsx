import React, { useState } from "react";

const AddFriendModal = ({ handleAddFriendSubmit, setShowAddFriendModal, error, setError, newFriend, setNewFriend, setRequestSent }) => {



  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Friend</h3>
        <form onSubmit={() => {handleAddFriendSubmit()
            setShowAddFriendModal(false)
            setRequestSent(true)

        }}>
          <input
            type="text"
            value={newFriend}
            onChange={(e) => {
                
                setNewFriend(e.target.value) // Clear error when closing
                
              }}
            placeholder="Enter friend's username"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Add</button>
          <button
            type="button"
            onClick={() => {
              setShowAddFriendModal(false);
              setError(null); // Clear error when closing
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

export default AddFriendModal;