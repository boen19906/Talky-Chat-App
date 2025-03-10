import {React, useEffect, useRef} from "react";

const LogoutModal = ({ handlelogout, setShowlogoutModal, setModalOn }) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowlogoutModal(false);
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
            onClick={() => {setShowlogoutModal(false); setModalOn(false);}}
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