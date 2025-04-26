import React from "react";
import { FaFile, FaDownload } from "react-icons/fa";

const MessageList = ({ messages, setShowDeleteMessageModal, setDeletedMessageIndex, isGroup, setSelectedImage, setShowImageModal, setModalOn,
  setShowReactionsModal, setReactionIndex
}) => {
  // Function to determine if file is an image
  const isImageFile = (fileType) => {
    return fileType && (
      fileType.startsWith('image/jpeg') || 
      fileType.startsWith('image/png') || 
      fileType.startsWith('image/gif') ||
      fileType.startsWith('image/webp')
    );
  };

  // Function to handle file download
  const handleDownload = (url, fileName) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              backgroundColor,
              position: "relative"
            } : { 
              position: "relative"
            }}
          >
            <div className="message-content">
              <strong style={{ color: !isUser ? textColor : undefined }}>
                {isUser ? "You: " : `${msg.sender}: `}
              </strong>
              
              {/* Handle file attachments */}
              {msg.fileUrl ? (
                isImageFile(msg.fileType) ? (
                  <img
                    src={msg.fileUrl}
                    alt="Uploaded"
                    style={{ 
                      maxWidth: "200px", 
                      margin: "8px 0", 
                      cursor: "pointer" 
                    }}
                    onClick={() => {setSelectedImage(msg.fileUrl); setShowImageModal(true);}}
                  />
                ) : (
                  <div className="file-preview" 
                  onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    padding: "10px",
                    background: "rgba(0,0,0,0.05)",
                    borderRadius: "6px",
                    margin: "5px 0",
                    cursor: "pointer"
                  }}>
                    <FaFile size={60} style={{ marginRight: "10px" }} />
                    <span
                      className="file-name"
                      style={{ 
                        flexGrow: 1,
                        flexShrink: 1,
                        flexBasis: "500%", // Allows it to grow more
                        minWidth: "0", // Ensures shrinking can happen
                        maxWidth: "100%", // Prevents overflowing outside parent
                        color: !isUser ? textColor : undefined,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {msg.fileName || "File"}
                    </span>

                    <button 
                      onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <FaDownload size={16} />
                    </button>
                  </div>
                )
              ) : (
                <span style={{ color: !isUser ? textColor : undefined }}>
                  {msg.text}
                </span>
              )}
            </div>
            
            {/* Reaction bubble with improved visibility */}
            {(msg.reaction && msg.sender != "You") && (
              <div 
                className="message-reaction" 
                onClick={() => {
                  setShowReactionsModal(true);
                  setModalOn(true);
                  setReactionIndex(index);
                }}
              >
                {msg.reaction}
              </div>
            )}

            {(msg.reaction && msg.sender == "You") && (
              <div className="message-reaction">
                {msg.reaction}
              </div>
            )}
            
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
                      setModalOn(true);
                    }}
                  >
                    <span className="dots">⋯</span>
                  </button>
                </div>
              )}
        
              {!isUser && (
                <div className="message-actions">
                  <button 
                    className="delete-button user" 
                    title="React to Message"
                    onClick={() => {
                      setShowReactionsModal(true);
                      setModalOn(true);
                      setReactionIndex(index);
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