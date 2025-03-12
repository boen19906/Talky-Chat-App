import React, { useEffect, useRef, useState } from "react";

const EmojiModal = ({ setShowEmojiModal, message, setMessage }) => {
  const modalRef = useRef(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  
  // Array of emoji reactions to choose from
  const emojis = [
    "😂", // Face with Tears of Joy
    "❤️", // Red Heart
    "👍", // Thumbs Up
    "🤣", // Rolling on the Floor Laughing
    "😭", // Loudly Crying Face
    "😊", // Smiling Face with Smiling Eyes
    "🙏", // Folded Hands
    "😍", // Smiling Face with Heart-Eyes
    "💕", // Two Hearts
    "🥰", // Smiling Face with Hearts
    "😘", // Face Blowing a Kiss
    "😎", // Smiling Face with Sunglasses
    "😢", // Crying Face
    "🤔", // Thinking Face
    "🙄", // Face with Rolling Eyes
    "😮", // Face with Open Mouth (Surprised)
    "😡", // Pouting Face
    "🎉", // Party Popper
    "🤗", // Hugging Face
    "💪"  // Flexed Biceps
  ];
  
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowEmojiModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowEmojiModal]);
  
  const handleReactionClick = (emoji) => {
    setSelectedEmoji(emoji);
    // Add the selected emoji to the end of the message
    setMessage(prevMessage => prevMessage + emoji);
    // Close the modal after selection
    setShowEmojiModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="reactions-modal" ref={modalRef}>
        <div className="emoji-container">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className={`emoji-button ${selectedEmoji === emoji ? "selected" : ""}`}
              onClick={() => handleReactionClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiModal;