import React from "react";

const RemoveGroupModal = ({ 
  groupNames, 
  groupToRemove, 
  handleRemoveFromGroup, 
  setShowRemoveGroupModal 
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Remove Group</h3>
        <p>
          Are you sure you want to leave{" "}
          <strong>{groupNames[groupToRemove] || "Unknown"}</strong>?
        </p>
        <div className="modal-buttons">
          <button
            onClick={() => {handleRemoveFromGroup()
                 setShowRemoveGroupModal(false)}}
            className="confirm-button"
          >
            Yes, leave
          </button>
          <button
            onClick={() => {
              setShowRemoveGroupModal(false);
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