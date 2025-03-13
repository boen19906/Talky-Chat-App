import {React, useEffect} from "react";

const GamesModal = ({setShowGamesModal, setModalOn}) => {
    return (
<div className="modal-overlay">
    <div className="modal game">
      <h3>Choose a Game</h3>
      <p>Select a game below!</p>
      
      <div className="games-grid">
        <div className="game-box">
          <div className="game-icon">🎲</div>
          <h4>Coup</h4>
          <p>Bluffing, deception, and strategy.</p>
        </div>
  
        <div className="game-box" >
          <div className="game-icon">♟️</div>
          <h4>Chess</h4>
          <p>Classic strategy game</p>
        </div>
      </div>
      <div className="button-container">

      <button
            type="button"
            onClick={() => 
              {setShowGamesModal(false); setModalOn(false);}
            }
            className="comfirm-button game"
          >
            Confirm
      </button>
      <button
            type="button"
            onClick={() => 
              {setShowGamesModal(false); setModalOn(false);}
            }
            className="cancel-button game"
          >
            Cancel
      </button>
      

      </div>
      
      
    </div>
  </div>
    );
    

}

export default GamesModal