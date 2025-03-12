import React, { useEffect, useRef } from "react";
import MessageList from "./MessageArea";
import MessageInput from "./MessageInput";

const ChatArea = ({
    selectedFriend,
    selectedGroup,
    selectedGroupMembers,
    groupNames,
    friendUsernames,
    messages,
    message,
    setMessage,
    handleSendMessage,
    handleImageChange,
    handleUploadImage,
    handleCancelImage,
    imageFile,
    imagePreview,
    fileInputRef,
    isLoading,
    setShowDeleteMessageModal,
    setDeletedMessageIndex,
    isProcessing,
    setSelectedImage,
    setShowImageModal,
    modalOn,
    setModalOn,
    setShowReactionsModal,
    setReactionIndex,
    setShowEmojiModal
}) => {
    const chatMessagesRef = useRef(null);

    useEffect(() => {
        const scrollToBottom = () => {
            if (!chatMessagesRef.current) return;
            
            // Use smooth scrolling for better UX
            chatMessagesRef.current.scrollTo({
                top: chatMessagesRef.current.scrollHeight,
                behavior: 'smooth'
            });
        };
    
        const observer = new MutationObserver((mutations) => {
            // Check if any added nodes contain images
            const hasImages = mutations.some(mutation => 
                Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    node.querySelector('img')
                )
            );
    
            if (hasImages) {
                // Wait for images to load and layout to stabilize
                const checkImages = () => {
                    const images = chatMessagesRef.current.querySelectorAll('img');
                    const loadedImages = Array.from(images).filter(img => img.complete);
                    
                    if (loadedImages.length === images.length) {
                        scrollToBottom();
                    } else {
                        requestAnimationFrame(checkImages);
                    }
                };
                
                requestAnimationFrame(checkImages);
            } else {
                scrollToBottom();
            }
        });
    
        if (chatMessagesRef.current) {
            observer.observe(chatMessagesRef.current, {
                childList: true,
                subtree: true
            });
        }
    
        // Initial scroll with double check
        requestAnimationFrame(() => {
            scrollToBottom();
            // Fallback check after 500ms
            setTimeout(scrollToBottom, 500);
        });
    
        return () => observer.disconnect();
    }, [messages]);

    return (
        <div className="chat-area">
            {selectedGroup ? (
                <>
                    <div className="chat-header">
                        <h3>Chat with {groupNames[selectedGroup] || "Unknown Group"}</h3>
                        <div className="members-list">
                            Members: {selectedGroupMembers?.map((member, index) => (
                                <span key={index} className="member-name">
                                {member}
                                {/* Add comma except for last member */}
                                {index < selectedGroupMembers.length - 1 ? ", " : ""}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div
                        ref={chatMessagesRef}
                        className="chat-messages overflow-y-auto max-h-[calc(100vh-200px)]"
                    >
                        <MessageList
                            messages={messages}
                            setShowDeleteMessageModal={setShowDeleteMessageModal}
                            setDeletedMessageIndex={setDeletedMessageIndex}
                            isGroup={true}
                            setSelectedImage={setSelectedImage}
                            setShowImageModal={setShowImageModal}
                            setModalOn={setModalOn}
                            setShowReactionsModal={setShowReactionsModal}
                            setReactionIndex={setReactionIndex}
                        />
                    </div>
                    <MessageInput
                       message={message}
                       setMessage={setMessage}
                       handleSendMessage={handleSendMessage}
                       handleImageChange={handleImageChange}
                       handleUploadImage={handleUploadImage}
                       handleCancelImage={handleCancelImage}
                       imageFile={imageFile}
                       fileInputRef={fileInputRef}
                       imagePreview={imagePreview}
                       isLoading={isLoading}
                       modalOn={modalOn}
                       setShowEmojiModal={setShowEmojiModal}
                    
                    />
                </>
            ) : selectedFriend ? (
                <>
                    <div className="chat-header">
                        <h3>Chat with {friendUsernames[selectedFriend] || "Unknown"}</h3>
                    </div>
                    <div
                        ref={chatMessagesRef}
                        className="chat-messages overflow-y-auto max-h-[calc(100vh-200px)]"
                    >
                        <MessageList
                            messages={messages}
                            setShowDeleteMessageModal={setShowDeleteMessageModal}
                            setDeletedMessageIndex={setDeletedMessageIndex}
                            isGroup={false}
                            setSelectedImage={setSelectedImage}
                            setShowImageModal={setShowImageModal}
                            setModalOn={setModalOn}
                            setShowReactionsModal={setShowReactionsModal}
                            setReactionIndex={setReactionIndex}
                        />
                    </div>
                    <MessageInput
                        message={message}
                        setMessage={setMessage}
                        handleSendMessage={handleSendMessage}
                        handleImageChange={handleImageChange}
                        handleUploadImage={handleUploadImage}
                        handleCancelImage={handleCancelImage}
                        imageFile={imageFile}
                        fileInputRef={fileInputRef}
                        imagePreview={imagePreview}
                        isLoading={isLoading}
                        modalOn={modalOn}
                        setShowEmojiModal={setShowEmojiModal}
                        
                    />
                </>
            ) : (
                <div className="chat-header">
                    <p>Select a friend or group to start chatting</p>
                </div>
            )}

{isProcessing && (
      <div className="typing-indicator">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <span className="typing-text">HoodGPT Typing...</span>
      </div>
    )}
        </div>
    );
};

export default ChatArea;