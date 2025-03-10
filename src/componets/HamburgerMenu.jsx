import {React, useState, useEffect, useRef} from "react";
import { FaUserFriends } from "react-icons/fa";
import { IoGameController } from "react-icons/io5";
import { MdOutlineGroups2 } from "react-icons/md";

const HamburgerMenu = ({handleAddFriend, setShowAddGroupModal, setShowGamesModal, setModalOn}) => {
    const [isOpen, setIsOpen] = useState(false); // State to manage menu visibility
    const menuRef = useRef(null);

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