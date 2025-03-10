import {React, useEffect, useRef} from "react";

const FriendRequestModal = ({ 
  friendRequested, 
  friendRequestedUsername, 
  handleFriendRequest,
  setShowFriendRequestModal,
  setModalOn
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowFriendRequestModal(false);
        setModalOn(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <h3>You got a new Friend Request!</h3>
        <p><strong>{friendRequestedUsername}</strong> wants to be your friend.</p>
        <div className="modal-buttons">
          <button
            onClick={() => { handleFriendRequest(friendRequested, "accept"); setShowFriendRequestModal(false); setModalOn(false);}}
            className="confirm-button"
          >
            Accept
          </button>
          <button
            onClick={() => { handleFriendRequest(friendRequested, "decline"); setShowFriendRequestModal(false); setModalOn(false);}}
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