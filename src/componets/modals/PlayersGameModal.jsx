import React, { useState, useEffect, useRef } from "react";

const PlayersGameModal = ({
  setShowPlayersGameModal,
  error,
  setError,
  friends,
  friendUsernames
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowPlayersGameModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [selectedFriends, setSelectedFriends] = useState([]);

  const handleCheckboxChange = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  

  const handleCancel = () => {
    setShowPlayersGameModal(false);
    setError("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <h2>Add members to the game!</h2>
        <p>Select friends to add to your game:</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="friends-list-container">
          {friends && friends.length > 0 ? (
            <ul className="friends-select-list">
              {friends.reverse().map((friendId) => (
                <li key={friendId} className="friend-select-item">
                  <label className="friend-select-label">
                    <div 
                      className={`friend-select-box ${selectedFriends.includes(friendId) ? 'selected' : ''}`}
                      onClick={() => handleCheckboxChange(friendId)}
                    >
                      <span className="friend-name">
                        {friendUsernames[friendId] || "Loading..."}
                      </span>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-friends-message">No friends available to add</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayersGameModal;