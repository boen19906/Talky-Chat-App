import React, { useState, useEffect, useRef } from "react";
import { FaUserFriends } from "react-icons/fa";
import { IoGameController } from "react-icons/io5";
import { MdOutlineGroups2 } from "react-icons/md";
import { getStorage, getDownloadURL, ref } from "firebase/storage";
import useUsername from "./hooks/useUsername";
import { useNavigate } from "react-router-dom";

const HamburgerMenu = ({handleAddFriend, setShowAddGroupModal, setShowGamesModal, setModalOn}) => {
    const [isOpen, setIsOpen] = useState(false); // State to manage menu visibility
    const menuRef = useRef(null);
    const {userUsername, profileImage} = useUsername();
    const navigate = useNavigate()

    // Toggle the menu open/close
    const toggleMenu = () => {
      setIsOpen(!isOpen);
    };

    

    useEffect(() => {
        const handleClickOutside = (event) => {
          if (menuRef.current && 
              !menuRef.current.contains(event.target) && 
              isOpen) {
            setIsOpen(false);
          }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [isOpen]);
  
    // Handle profile click - closes menu and triggers profile action
    const onProfileClick = () => {
      setIsOpen(false);
      navigate("/profile");

    };

    return (
      <div className="hamburger-menu-container" ref={menuRef}>
        {/* Hamburger Icon */}
        <div className="hamburger-icon" onClick={toggleMenu}>
          <div className={`bar ${isOpen ? "open" : ""}`} />
          <div className={`bar ${isOpen ? "open" : ""}`} />
          <div className={`bar ${isOpen ? "open" : ""}`} />
        </div>
  
        {/* Menu Content */}
        <div className={`menu ${isOpen ? "open" : ""}`}>
          {/* Enhanced Profile Section */}
          <div 
            className="profile-section" 
            onClick={onProfileClick}
          >
            <div className="profile-container-hamburger">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="profile-image-hamburger"
                />
              ) : (
                <div className="profile-placeholder-hamburger">
                  {userUsername ? userUsername.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <h3 className="profile-username-hamburger">{userUsername}</h3>
            </div>
          </div>

          <ul>
            <li onClick={() => {setShowGamesModal(true); setIsOpen(false); setModalOn(true);}}>
                <IoGameController className="menu-icon" />
                <span>Play Games</span>
            </li>
            <li onClick={() => {handleAddFriend(); setIsOpen(false)}}>
                <FaUserFriends className="menu-icon" />
                <span>Add Friend</span>
            </li>
            <li onClick={() => {setShowAddGroupModal(true); setIsOpen(false); setModalOn(true);}}>
                <MdOutlineGroups2 className="menu-icon" />
                <span>Add Group Chat</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };
  
  export default HamburgerMenu;