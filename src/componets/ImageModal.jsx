import React, { useEffect, useRef } from 'react';

const ImageModal = ({ selectedImage, setShowImageModal, setModalOn }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowImageModal(false);
        setModalOn(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //if (!imageUrl) return null;

  return (
    <div className="modal-overlay">
      <div className="modal image" ref={modalRef}>
      <button 
          className="close-button" 
          onClick={() => {setShowImageModal(false); setModalOn(false);}}
        >
          &times;
        </button>
        <img 
          src={selectedImage} 
          alt="Full size" 
          className="modal-image"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default ImageModal;