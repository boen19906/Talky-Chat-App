import {React, useEffect, useRef} from "react";

const RemoveFriendModal = ({ 
  friendUsernames, 
  friendToRemove, 
  handleRemoveFriend, 
  setShowRemoveFriendModal ,
  setModalOn
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowRemoveFriendModal(false);
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
        <h3>Remove Friend</h3>
        <p>
          Are you sure you want to remove{" "}
          <strong>{friendUsernames[friendToRemove] || "Unknown"}</strong> from your
          friends list?
        </p>
        <div className="modal-buttons">
          <button
            onClick={() => {handleRemoveFriend();
                setShowRemoveFriendModal(false);
                setModalOn(false);}}
            className="confirm-button"
          >
            Yes, Remove
          </button>
          <button
            onClick={() => {
              setShowRemoveFriendModal(false);
              setModalOn(false);
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