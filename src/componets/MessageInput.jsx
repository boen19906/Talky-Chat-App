import { React, useState, useRef, useEffect } from "react";
import { IoImagesSharp } from "react-icons/io5";
import { CiFaceSmile } from "react-icons/ci";
import { FaFile } from "react-icons/fa";

const MessageInput = ({
  message,
  setMessage,
  handleSendMessage,
  handleImageChange,
  handleUploadImage,
  handleCancelImage,
  imageFile,
  fileInputRef,
  imagePreview,
  isLoading,
  modalOn,
  setShowEmojiModal,
  inputRef
}) => {
  // Add event listener for keydown events
  useEffect(() => {
    if (modalOn) return;
  
    const handleKeyDown = (e) => {
      if (inputRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current.focus();
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
  
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOn]);
  
  return (
    <form onSubmit={handleSendMessage} className="chat-input">
      <div className="file-upload-wrapper">
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden-file-input"
        />
        <label htmlFor="file-upload" className="file-upload-button">
        <IoImagesSharp size={24} />
        </label>
      </div>

      <div className="emoji-wrapper">
        <label className="emoji-button" onClick={() => {
              setShowEmojiModal(true);
            }}>
        <CiFaceSmile size={24}/>
        </label>
      </div>

      {imageFile ? (
        <div className="file-preview-container">
          {imageFile.type.startsWith('image/') ? (
            <div className="preview-frame">
              <img
                src={imagePreview}
                alt="Preview"
                className="constrained-preview"
              />
            </div>
          ) : (
            <div className="file-preview">
              <FaFile size={24} />
              <span className="file-name">{imageFile.name}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <div className="file-action-buttons">
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
          )}
        </div>
      ) : (
        <>
          <input
            type="text"
            ref={inputRef}
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