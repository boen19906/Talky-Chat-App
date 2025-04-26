import React, { useEffect, useRef, useState, useCallback } from "react";

const EmojiModal = ({ setShowEmojiModal, message, setMessage, inputRef }) => {
  const modalRef = useRef(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  
  const emojis = [
    "😂", "❤️", "👍", "🤣", "😭", "😊", "🙏", "😍", "💕", "🥰",
    "😘", "😎", "😢", "🤔", "🙄", "😮", "😡", "🎉", "🤗", "💪",
    "🔥", "💖", "😜", "👏", "😆", "🌟", "💯", "😴", "🤩", "💔",
    "😋", "🤯", "😇", "😷", "🤤", "💤", "👀", "🤑", "🙃", "😈",
    "🥳", "🤓", "😌", "💗", "🤡", "💀", "🐶", "🐱", "🦄", "🍕",
    "🚀", "🎶", "🏆", "📸", "🎮", "🎭", "🎨", "⚡", "🌍", "⏳"
  ];
  
  // Create the focus function with useCallback to avoid dependency issues
  const focusInputAtEnd = useCallback(() => {
    if (inputRef && inputRef.current) {
      // Focus the input field
      inputRef.current.focus();
      
      // Need a slight delay to ensure focus is set before positioning cursor
      setTimeout(() => {
        if (inputRef.current) {
          // Get the current length and set cursor position to the end
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 50);
    }
  }, [inputRef]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // Close the modal
        setShowEmojiModal(false);
        // Focus the input with cursor at the end after a slight delay
        setTimeout(focusInputAtEnd, 50);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowEmojiModal, focusInputAtEnd]);
  
  const handleReactionClick = (emoji) => {
    setSelectedEmoji(emoji);
    
    // Update the message state with the emoji
    setMessage(prevMessage => prevMessage + emoji);
    
    
    // Focus the input with cursor at the end
    setTimeout(focusInputAtEnd, 100);
  };

  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div 
        className="reactions-modal bg-white rounded-lg shadow-lg p-4 max-w-xs w-full" 
        ref={modalRef}
      >
        <div 
          className="emoji-container grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            overflowY: 'auto',
            maxHeight: '240px'
          }}
        >
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className={`emoji-button flex items-center justify-center h-10 w-10 rounded hover:bg-gray-100 ${
                selectedEmoji === emoji ? "bg-gray-200" : ""
              }`}
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