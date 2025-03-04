import React from "react";

const LogoutModal = ({ handlelogout, setShowlogoutModal }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Log Out?</h3>
        <p>
          Are you sure you want to log out?
        </p>
        <div className="modal-buttons">
          <button
            onClick={handlelogout}
            className="confirm-button"
          >
            Log out
          </button>
          <button
            onClick={() => setShowlogoutModal(false)}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;