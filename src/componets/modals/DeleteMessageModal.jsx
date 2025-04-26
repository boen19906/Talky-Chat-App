import {React, useEffect, useRef} from "react";

const DeleteMessageModal = ({ handleDeleteMessage, setShowDeleteMessageModal, setModalOn }) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDeleteMessageModal(false);
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
        <h3>Delete Message</h3>
        <p>Are you sure you want to delete message?</p>
        <div className="modal-buttons">
          <button
            onClick={() => {
              handleDeleteMessage();
              setShowDeleteMessageModal(false);
              setModalOn(false);
            }}
            className="confirm-button"
          >
            Ok
          </button>
          <button
            onClick={() => {
              setShowDeleteMessageModal(false);
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

export default DeleteMessageModal;