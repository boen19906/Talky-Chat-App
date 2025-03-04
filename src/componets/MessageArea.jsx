import React from "react";

const MessageList = ({ messages, setShowDeleteMessageModal, setDeletedMessageIndex }) => {
  return (
    <>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender === "You" ? "user-message" : "recipient-message"}`}
        >
          <div className="message-content">
            <strong>{msg.sender}: </strong>
            {msg.text}
          </div>
          <div className="message-footer">
            <span className="timestamp">
              {msg.timestamp?.toLocaleTimeString()}
              {msg.sender === "You" && (
                <span className="read-receipt">
                  {msg.viewed ? " ✓✓" : " ✓"}
                </span>
              )}
            </span>
            {msg.sender === "You" &&
              <div className="message-actions">
                <button 
                  className="delete-button user" 
                  title="Delete message"
                  onClick={() => {
                    setShowDeleteMessageModal(true);
                    setDeletedMessageIndex(index);
                  }}
                >
                  <span className="dots">⋯</span>
                </button>
              </div>
            }
          </div>
        </div>
      ))}
    </>
  );
};

export default MessageList;