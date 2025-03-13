import React, { useEffect, useRef, useState } from "react";

const ReactionsModal = ({ setShowReactionsModal, handleSendReaction}) => {
  const modalRef = useRef(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  
  // Array of emoji reactions to choose from
  const emojis = [
    "😂", "❤️", "👍", "🤣", "😭", "😊", "🙏", "😍", "💕", "🥰",
    "😘", "😎", "😢", "🤔", "🙄", "😮", "😡", "🎉", "🤗", "💪",
    "🔥", "💖", "😜", "👏", "😆", "🌟", "💯", "😴", "🤩", "💔",
    "😋", "🤯", "😇", "😷", "🤤", "💤", "👀", "🤑", "🙃", "😈",
    "🥳", "🤓", "😌", "💗", "🤡", "💀", "🐶", "🐱", "🦄", "🍕",
    "🚀", "🎶", "🏆", "📸", "🎮", "🎭", "🎨", "⚡", "🌍", "⏳"
  ];
  
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
    <div className="modal-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="reactions-modal bg-white rounded-lg shadow-lg p-4 max-w-xs w-full" ref={modalRef}
      style={{height:'320px'}}>
        <h3>Choose a reaction</h3>
        <div className="emoji-container grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2"
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            overflowY: 'auto',
            maxHeight: '240px'
          }}>
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