import React from "react";

const MessageInput = ({ message, setMessage, handleSendMessage, handleImageChange, handleUploadImage, imageFile }) => {
  return (
    <form onSubmit={handleSendMessage} className="chat-input">
      <div className="file-upload-wrapper">
        <input
          type="file"
          id="file-upload"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden-file-input"
        />
        <label htmlFor="file-upload" className="file-upload-button">
          Attach
        </label>
      </div>

      {imageFile ? (
        <button
          type="button"
          onClick={handleUploadImage}
          className="send-button"
        >
          Send
        </button>
      ) : (
        <>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            required
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