import {React, useEffect, useRef} from "react";

const AddGroupModal = ({ 
  setGroupName, 
  error, 
  setShowAddGroupMembers, 
  setShowAddGroupModal, 
  setNewGroup, 
  setError ,
  setModalOn
}) => {
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddGroupModal(false);
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
        <h3>Create Group Chat</h3>
        <form>
          <input
            type="text"
            ref={inputRef}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group chat name"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="button" 
            onClick={() => {
              setShowAddGroupMembers(true);
              setShowAddGroupModal(false);
              setModalOn(false);
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

export default AddGroupModal;