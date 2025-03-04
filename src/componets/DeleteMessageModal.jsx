import React from "react";

const DeleteMessageModal = ({ handleDeleteMessage, setShowDeleteMessageModal }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Delete Message</h3>
        <p>Are you sure you want to delete message?</p>
        <div className="modal-buttons">
          <button
            onClick={() => {
              handleDeleteMessage();
              setShowDeleteMessageModal(false);
            }}
            className="confirm-button"
          >
            Ok
          </button>
          <button
            onClick={() => {
              setShowDeleteMessageModal(false);
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

export default DeleteMessageModal;