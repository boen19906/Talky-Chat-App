import {React, useEffect, useRef} from "react";

const RemoveGroupModal = ({ 
  groupNames, 
  groupToRemove, 
  handleRemoveFromGroup, 
  setShowRemoveGroupModal ,
  setModalOn
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowRemoveGroupModal(false);
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
        <h3>Remove Group</h3>
        <p>
          Are you sure you want to leave{" "}
          <strong>{groupNames[groupToRemove] || "Unknown"}</strong>?
        </p>
        <div className="modal-buttons">
          <button
            onClick={() => {handleRemoveFromGroup();
                 setShowRemoveGroupModal(false);
                 setModalOn(false);}}
            className="confirm-button"
          >
            Yes, leave
          </button>
          <button
            onClick={() => {
              setShowRemoveGroupModal(false);
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

export default RemoveGroupModal;