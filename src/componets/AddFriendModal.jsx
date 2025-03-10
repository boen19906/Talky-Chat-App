import React, { useState, useEffect, useRef } from "react";

const AddFriendModal = ({ handleAddFriendSubmit, setShowAddFriendModal, error, setError, newFriend, setNewFriend, setRequestSent, setModalOn }) => {
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddFriendModal(false);
        setModalOn(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
  
    const handleKeyDown = (e) => {
      if (inputRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current.focus();
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
  
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <h3>Send Friend Request</h3>
        <form onSubmit={() => {handleAddFriendSubmit()
            setShowAddFriendModal(false)
            setRequestSent(true)
            setModalOn(false)

        }}>
          <input
            type="text"
            value={newFriend}
            ref={inputRef}
            onChange={(e) => {
                
                setNewFriend(e.target.value) // Clear error when closing
                
              }}
            placeholder="Enter friend's username"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Send</button>
          <button
            type="button"
            onClick={() => {
              setShowAddFriendModal(false);
              setError(null); // Clear error when closing
              setModalOn(false);
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