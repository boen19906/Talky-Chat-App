import React, { useEffect, useRef, useState } from "react";

const ReactionsModal = ({ setShowReactionsModal, handleSendReaction}) => {
  const modalRef = useRef(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  
  // Array of emoji reactions to choose from
  const emojis = ["👍", "❤️", "😂", "😮", "😢"];
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowReactionsModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowReactionsModal]);
  
  const handleReactionClick = (emoji) => {
    setSelectedEmoji(emoji);
    handleSendReaction(emoji);
    setShowReactionsModal(false);
  };

  const handleRemoveReaction = () => {
    setSelectedEmoji(null);
    handleSendReaction(null);
    setShowReactionsModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="reactions-modal" ref={modalRef}>
        <h3>Choose a reaction</h3>
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
        <button className="remove-button" onClick={handleRemoveReaction}>
          Remove Reaction
        </button>
      </div>
    </div>
  );
};

export default ReactionsModal;