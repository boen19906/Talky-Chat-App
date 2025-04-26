import React from "react";

const RequestSentModal = ({ setRequestSent, setModalOn}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Request Sent!</h3>
        <div className="modal-buttons">
          <button
            onClick={() => {setRequestSent(false); setModalOn(false);}}
            className="confirm-button"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestSentModal;