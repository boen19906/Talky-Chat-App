import React, { useRef, useEffect } from "react";
import MessageList from "./MessageArea";
import MessageInput from "./MessageInput";

const ChatArea = ({ 
  selectedFriend, 
  selectedGroup,
  groupNames,
  friendUsernames, 
  messages, 
  message, 
  setMessage, 
  handleSendMessage,
  setShowDeleteMessageModal,
  setDeletedMessageIndex
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-area">
  {selectedGroup ? (
    <>
      <div className="chat-header">
        <h3>Chat with {groupNames[selectedGroup] || "Unknown Group"}</h3>
      </div>
      <div className="chat-messages">
        <MessageList 
          messages={messages} 
          setShowDeleteMessageModal={setShowDeleteMessageModal}
          setDeletedMessageIndex={setDeletedMessageIndex}
        />
        <div ref={messagesEndRef}/>
      </div>
      <MessageInput 
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
      />
    </>
  ) : selectedFriend ? (
    <>
      <div className="chat-header">
        <h3>Chat with {friendUsernames[selectedFriend] || "Unknown"}</h3>
      </div>
      <div className="chat-messages">
        <MessageList 
          messages={messages} 
          setShowDeleteMessageModal={setShowDeleteMessageModal}
          setDeletedMessageIndex={setDeletedMessageIndex}
        />
        <div ref={messagesEndRef}/>
      </div>
      <MessageInput 
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
      />
    </>
  ) : (
    <div className="chat-header">
      <p>Select a friend or group to start chatting</p>
    </div>
  )}
</div>
  );
};

export default ChatArea;