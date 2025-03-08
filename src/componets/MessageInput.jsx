import {React, useState} from "react";

const MessageInput = ({ message, setMessage, handleSendMessage, handleImageChange, handleUploadImage, handleCancelImage, imageFile, fileInputRef, imagePreview}) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <form onSubmit={handleSendMessage} className="chat-input">
      <div className="file-upload-wrapper">
        <input
          type="file"
          id="file-upload"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden-file-input"
        />
        <label htmlFor="file-upload" className="file-upload-button">
          Attach
        </label>
      </div>
  
      {imageFile ? (
        <div className="image-preview-container">
          <div className="preview-frame">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="constrained-preview"
          />
        </div>

          <div className="image-action-buttons">
            <button
              type="button"
              onClick={handleCancelImage}
              className="cancel-image-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadImage}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </>
      )}
    </form>
  );
};

export default MessageInput;