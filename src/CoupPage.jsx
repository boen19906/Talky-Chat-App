import React, { useState, useEffect, useRef } from "react";
 
// Define Roles as constants
const Role = {
  DUKE: "DUKE",
  ASSASSIN: "ASSASSIN",
  CAPTAIN: "CAPTAIN",
  AMBASSADOR: "AMBASSADOR",
  CONTESSA: "CONTESSA",
};
 
// Deck class to manage cards
class Deck {
  constructor() {
    this.cards = [];
    // Add 3 copies of each role
    for (let i = 0; i < 3; i++) {
      for (let role of Object.values(Role)) {
        this.cards.push(role);
      }
    }
    this.shuffle();
  }
 
  shuffle() {
    // Simple Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
 
  draw() {
    return this.cards.pop() || null;
  }
 
  returnCard(role) {
    this.cards.push(role);
    this.shuffle();
  }
}
 
// Player class holds player data and actions
class Player {
  constructor(name) {
    this.name = name;
    this.coins = 2;
    this.cards = [];
    this.alive = true;
  }
 
  addCard(card) {
    this.cards.push(card);
  }
 
  loseCard() {
    if (this.cards.length === 0) return;
    const cardOptions = this.cards.join(", ");
    const choice = window.prompt(
      `${this.name}, choose a card to lose:\nOptions: ${cardOptions}`
    );
    if (choice) {
      const index = this.cards.indexOf(choice);
      if (index !== -1) {
        const removed = this.cards.splice(index, 1)[0];
        window.alert(`${this.name} loses ${removed}`);
      }
    }
    if (this.cards.length === 0) {
      this.alive = false;
      window.alert(`${this.name} is eliminated!`);
    }
  }
 
  hasRole(role) {
    return this.cards.includes(role);
  }
}
 
function CoupGame() {
  const [deck] = useState(new Deck());
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameLog, setGameLog] = useState("");
 
  useEffect(() => {
    initPlayers();
  }, []);
  
 
  function initPlayers() {
    let numPlayers = 0;
  
    // Ensure valid number of players
    while (numPlayers < 2 || numPlayers > 6) {
      const input = window.prompt("Enter number of players (2-6):");
      if (input === null) return; // Exit if the user cancels
      numPlayers = parseInt(input, 10);
    }
  
    const newPlayers = [];
    for (let i = 0; i < numPlayers; i++) {
      let name = window.prompt(`Enter name for Player ${i + 1}:`);
      if (!name || name.trim() === "") {
        name = `Player ${i + 1}`;
      }
  
      const player = new Player(name);
      player.addCard(deck.draw()); // Assuming Player class has addCard method
      player.addCard(deck.draw());
      newPlayers.push(player);
    }
  
    setPlayers(newPlayers);
    logMessage(`Game started! It's ${newPlayers[0].name}'s turn.`);
  }
  
 
  function logMessage(message) {
    setGameLog((prev) => prev + message + "\n");
  }
 
  function getCurrentPlayer() {
    return players[currentPlayerIndex];
  }
 
  function activePlayers() {
    return players.filter((p) => p.alive);
  }
 
  function nextTurn() {
    if (activePlayers().length <= 1) {
      logMessage(`Game Over! Winner: ${activePlayers()[0].name}`);
      return;
    }
    let nextIndex = currentPlayerIndex;
    do {
      nextIndex = (nextIndex + 1) % players.length;
    } while (!players[nextIndex].alive);
    setCurrentPlayerIndex(nextIndex);
    logMessage(`It's now ${players[nextIndex].name}'s turn.`);
  }
 
  // Game action functions
 
  function income(player) {
    player.coins += 1;
    logMessage(`${player.name} takes Income and now has ${player.coins} coins.`);
  }
 
  function foreignAid(player) {
    logMessage(`${player.name} attempts Foreign Aid (2 coins).`);
    const blocked = anyBlock(player, Role.DUKE, "Foreign Aid");
    if (blocked) {
      logMessage("Foreign Aid was blocked.");
      return;
    }
    player.coins += 2;
    logMessage(
      `Foreign Aid successful. ${player.name} now has ${player.coins} coins.`
    );
  }
 
  function coup(player) {
    if (player.coins < 7) {
      logMessage("Not enough coins for Coup.");
      return;
    }
    const target = chooseTarget(player);
    if (!target) return;
    player.coins -= 7;
    logMessage(`${player.name} coups ${target.name}!`);
    target.loseCard();
  }
 
  function tax(player) {
    logMessage(`${player.name} claims DUKE for Tax (3 coins).`);
    if (performChallenge(player, Role.DUKE)) {
      logMessage("Tax canceled due to successful challenge.");
      return;
    }
    player.coins += 3;
    logMessage(`${player.name} now has ${player.coins} coins.`);
  }
 
  function assassinate(player) {
    if (player.coins < 3) {
      logMessage("Not enough coins to Assassinate.");
      return;
    }
    const target = chooseTarget(player);
    if (!target) return;
    logMessage(
      `${player.name} claims ASSASSIN to assassinate ${target.name} (3 coins).`
    );
    if (performChallenge(player, Role.ASSASSIN)) {
      logMessage("Assassination canceled due to successful challenge.");
      return;
    }
    const block = window.confirm(
      `${target.name}, do you want to block the Assassination by claiming CONTESSA?`
    );
    if (block) {
      const blockFailed = performBlockChallenge(target, Role.CONTESSA);
      if (blockFailed) {
        logMessage(`Block by ${target.name} failed. Assassination proceeds.`);
        player.coins -= 3;
        target.loseCard();
      } else {
        logMessage(`Assassination blocked by ${target.name}.`);
        player.coins -= 3;
      }
    } else {
      player.coins -= 3;
      logMessage(`Assassination goes through. ${target.name} loses a card.`);
      target.loseCard();
    }
  }
 
  function exchange(player) {
    logMessage(`${player.name} claims AMBASSADOR to Exchange cards.`);
    if (performChallenge(player, Role.AMBASSADOR)) {
      logMessage("Exchange canceled due to successful challenge.");
      return;
    }
    let tempCards = [...player.cards];
    const card1 = deck.draw();
    const card2 = deck.draw();
    tempCards.push(card1, card2);
 
    let newHand = [];
    while (newHand.length < 2 && tempCards.length > 0) {
      const choice = window.prompt(
        `Choose card ${newHand.length + 1} to keep from: ${tempCards.join(
          ", "
        )}`
      );
      if (choice) {
        const index = tempCards.indexOf(choice);
        if (index !== -1) {
          newHand.push(tempCards.splice(index, 1)[0]);
        }
      } else {
        break;
      }
    }
    // Return any unchosen cards to the deck
    for (let card of tempCards) {
      deck.returnCard(card);
    }
    player.cards = newHand;
    logMessage(`${player.name} finishes Exchange.`);
  }
 
  function steal(player) {
    const target = chooseTarget(player);
    if (!target) return;
    logMessage(`${player.name} claims CAPTAIN to steal from ${target.name}.`);
    if (performChallenge(player, Role.CAPTAIN)) {
      logMessage("Steal canceled due to successful challenge.");
      return;
    }
    const block = window.confirm(
      `${target.name}, do you want to block the Steal by claiming CAPTAIN or AMBASSADOR?`
    );
    if (block) {
      const blockChoice = window.prompt("Choose role to block with: CAPTAIN or AMBASSADOR");
      if (
        blockChoice &&
        (blockChoice === Role.CAPTAIN || blockChoice === Role.AMBASSADOR)
      ) {
        const blockFailed = performBlockChallenge(target, blockChoice);
        if (blockFailed) {
          logMessage(`Block by ${target.name} failed. Steal proceeds.`);
        } else {
          logMessage(`Steal blocked by ${target.name}.`);
          return;
        }
      }
    }
    const stolen = Math.min(2, target.coins);
    target.coins -= stolen;
    player.coins += stolen;
    logMessage(`${player.name} steals ${stolen} coins from ${target.name}.`);
  }
 
  // Helper functions for target selection and challenges
 
  function chooseTarget(actingPlayer) {
    const available = players.filter((p) => p !== actingPlayer && p.alive);
    if (available.length === 0) {
      logMessage("No available targets.");
      return null;
    }
    const targetStr = available
      .map(
        (p, index) =>
          `${index}: ${p.name} (Coins: ${p.coins}, Cards: ${p.cards.length})`
      )
      .join("\n");
    const choice = window.prompt(`Choose a target by number:\n${targetStr}`);
    const index = parseInt(choice, 10);
    if (!isNaN(index) && index >= 0 && index < available.length) {
      return available[index];
    }
    return null;
  }
 
  function performChallenge(actingPlayer, claimedRole) {
    for (let challenger of players) {
      if (challenger === actingPlayer || !challenger.alive) continue;
      const challenge = window.confirm(
        `${challenger.name}, do you want to challenge ${actingPlayer.name}'s claim of ${claimedRole}? (OK for Yes, Cancel for No)`
      );
      if (challenge) {
        if (actingPlayer.hasRole(claimedRole)) {
          window.alert(
            `${actingPlayer.name} reveals they DO have ${claimedRole}. Challenge fails!`
          );
          // Remove the revealed card and draw a new one
          const index = actingPlayer.cards.indexOf(claimedRole);
          if (index !== -1) {
            actingPlayer.cards.splice(index, 1);
            actingPlayer.addCard(deck.draw());
          }
          window.alert(`${challenger.name} loses a card for the failed challenge.`);
          challenger.loseCard();
          return false;
        } else {
          window.alert(
            `${actingPlayer.name} does NOT have ${claimedRole}. Challenge succeeds!`
          );
          actingPlayer.loseCard();
          return true;
        }
      }
    }
    return false;
  }
 
  function performBlockChallenge(blocker, claimedRole) {
    for (let challenger of players) {
      if (challenger === blocker || !challenger.alive) continue;
      const challenge = window.confirm(
        `${challenger.name}, do you want to challenge ${blocker.name}'s block claim of ${claimedRole}? (OK for Yes, Cancel for No)`
      );
      if (challenge) {
        if (blocker.hasRole(claimedRole)) {
          window.alert(
            `${blocker.name} reveals they DO have ${claimedRole}. Challenge on block fails!`
          );
          const index = blocker.cards.indexOf(claimedRole);
          if (index !== -1) {
            blocker.cards.splice(index, 1);
            blocker.addCard(deck.draw());
          }
          window.alert(`${challenger.name} loses a card for the failed challenge.`);
          challenger.loseCard();
          return false;
        } else {
          window.alert(
            `${blocker.name} does NOT have ${claimedRole}. Block challenge succeeds!`
          );
          blocker.loseCard();
          return true;
        }
      }
    }
    return false;
  }
 
  function anyBlock(actingPlayer, blockingRole, actionDescription) {
    for (let p of players) {
      if (p === actingPlayer || !p.alive) continue;
      const block = window.confirm(
        `${p.name}, do you want to block ${actingPlayer.name}'s ${actionDescription} by claiming ${blockingRole}? (OK for Yes, Cancel for No)`
      );
      if (block) {
        const blockFailed = performBlockChallenge(p, blockingRole);
        if (blockFailed) {
          window.alert(`Block attempt by ${p.name} failed. Action proceeds.`);
          continue;
        } else {
          window.alert(
            `Block by ${p.name} stands. ${actionDescription} is canceled.`
          );
          return true;
        }
      }
    }
    return false;
  }
 
  return (
    <div style={{ padding: "20px" }}>
      <h1>Coup Game</h1>
      <div style={{ marginBottom: "10px" }}>
        <strong>Game Log:</strong>
        <br />
        <textarea
          readOnly
          value={gameLog}
          style={{ width: "100%", height: "200px" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <strong>Players:</strong>
        <br />
        {players.map((player, index) => (
          <button
            key={index}
            onClick={() =>
              window.alert(`${player.name}'s cards: ${player.cards.join(", ")}`)
            }
            style={{ marginRight: "5px" }}
          >
            {player.name}'s Cards
          </button>
        ))}
      </div>
      <div>
        <strong>
          Actions (Current Turn:{" "}
          {players[currentPlayerIndex] ? players[currentPlayerIndex].name : ""}
          )
        </strong>
        <br />
        <button
          onClick={() => {
            income(getCurrentPlayer());
            nextTurn();
          }}
        >
          Income
        </button>
        <button
          onClick={() => {
            foreignAid(getCurrentPlayer());
            nextTurn();
          }}
        >
          Foreign Aid
        </button>
        <button
          onClick={() => {
            coup(getCurrentPlayer());
            nextTurn();
          }}
        >
          Coup
        </button>
        <button
          onClick={() => {
            tax(getCurrentPlayer());
            nextTurn();
          }}
        >
          Tax
        </button>
        <button
          onClick={() => {
            assassinate(getCurrentPlayer());
            nextTurn();
          }}
        >
          Assassinate
        </button>
        <button
          onClick={() => {
            exchange(getCurrentPlayer());
            nextTurn();
          }}
        >
          Exchange
        </button>
        <button
          onClick={() => {
            steal(getCurrentPlayer());
            nextTurn();
          }}
        >
          Steal
        </button>
      </div>
    </div>
  );
}
 
export default CoupGame;