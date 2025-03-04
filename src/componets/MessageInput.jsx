import React from "react";

const MessageInput = ({ message, setMessage, handleSendMessage }) => {
  return (
    <form onSubmit={handleSendMessage} className="chat-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        required
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default MessageInput;