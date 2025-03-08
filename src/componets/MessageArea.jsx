import React from "react";

const MessageList = ({ messages, setShowDeleteMessageModal, setDeletedMessageIndex, isGroup }) => {
  return (
    <>
  {messages.map((msg, index) => {
    const getSenderColor = (sender) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
                      '#FF9999', '#99CC99', '#FFCC00', '#9999FF', '#CC99FF'];
      let hash = 0;
      for (let i = 0; i < sender.length; i++) {
        hash = sender.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    const getContrastColor = (hexColor) => {
      const r = parseInt(hexColor.substr(1, 2), 16);
      const g = parseInt(hexColor.substr(3, 2), 16);
      const b = parseInt(hexColor.substr(5, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };

    const isUser = msg.sender === "You";
    const backgroundColor = isUser ? undefined : getSenderColor(msg.sender);
    const textColor = isUser ? undefined : getContrastColor(backgroundColor);

    return (
      <div
        key={index}
        className={`message ${isUser ? "user-message" : "recipient-message"}`}
        style={!isUser ? { 
          backgroundColor
        } : undefined}
      >
        <div className="message-content">
          <strong style={{ color: !isUser ? textColor : undefined }}>
            {isUser ? "You: " : `${msg.sender}: `}
          </strong>
          {msg.imageUrl ? (
            <img
              src={msg.imageUrl}
              alt="Uploaded"
              style={{ maxWidth: "200px", margin: "8px 0" }}
            />
          ) : (
            <span style={{ color: !isUser ? textColor : undefined }}>
              {msg.text}
            </span>
          )}
        </div>
        <div className="message-footer">
          <span className="timestamp" style={{ color: !isUser ? textColor : undefined }}>
            {msg.timestamp?.toLocaleTimeString()}
            {(isUser && !isGroup) && (
              <span className="read-receipt">
                {msg.viewed ? " ✓✓" : " ✓"}
              </span>
            )}
          </span>
          {isUser && (
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
          )}
        </div>
      </div>
    );
  })}
</>
  );
};

export default MessageList;