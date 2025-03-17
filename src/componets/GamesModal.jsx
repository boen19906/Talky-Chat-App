import {React, useEffect} from "react";
import { useNavigate } from "react-router-dom";

const GamesModal = ({setShowGamesModal, setModalOn}) => {
  const navigate = useNavigate();
    return (
<div className="modal-overlay">
    <div className="modal game">
      <h3>Talky Games</h3>
      <p>Select a game below!</p>
      
      <div className="games-grid">
        <div className="game-box">
          <div className="game-icon" onClick={() => {navigate('/coup')}}>🎲</div>
          <h4>Coup</h4>
          <p>Bluffing, deception, and strategy.</p>
        </div>
  
        <div className="game-box" >
          <div className="game-icon">♟️</div>
          <h4>Chess</h4>
          <p>Classic strategy game</p>
        </div>
      </div>
      
      
    </div>
  </div>
    );
    

}

export default GamesModal