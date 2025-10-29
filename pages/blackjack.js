import { useState, useEffect } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import Card from "../components/Card";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// All possible card values and suits
const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king', 'ace'];

// Create a full deck of cards
const createDeck = () => {
  const deck = [];
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      deck.push({ suit, value, id: `${value}_of_${suit}` });
    });
  });
  return deck;
};

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calculate hand value for blackjack
const calculateHandValue = (cards) => {
  let sum = 0;
  let aces = 0;

  cards.forEach(card => {
    if (card.value === 'ace') {
      aces += 1;
      sum += 11;
    } else if (['jack', 'queen', 'king'].includes(card.value)) {
      sum += 10;
    } else {
      sum += card.value;
    }
  });

  // Adjust for aces if bust
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces -= 1;
  }

  return sum;
};

export default function Blackjack() {
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [deck, setDeck] = useState(createDeck());
  const [gameStarted, setGameStarted] = useState(false);
  const [playerStood, setPlayerStood] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const dealInitialCards = () => {
    // Create and shuffle a fresh deck
    const newDeck = shuffleArray(createDeck());
    
    // Deal 2 cards to player and 2 to dealer
    const playerCards = [newDeck[0], newDeck[1]];
    const dealerCards = [newDeck[2], newDeck[3]];
    
    // Update state
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);
    setDeck(newDeck.slice(4)); // Remove dealt cards from deck
    setGameStarted(true);
  };

  const hitPlayer = () => {
    if (deck.length > 0 && !gameOver) {
      const newCard = deck[0];
      const newPlayerHand = [...playerHand, newCard];
      setPlayerHand(newPlayerHand);
      setDeck(deck.slice(1));
      
      // Check if player busts
      if (calculateHandValue(newPlayerHand) > 21) {
        setGameOver(true);
      }
    }
  };

  const stand = () => {
    setPlayerStood(true);
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setDeck(createDeck());
    setGameStarted(false);
    setPlayerStood(false);
    setGameOver(false);
  };

  // Automatic dealer play when player stands
  useEffect(() => {
    if (playerStood && !gameOver && gameStarted) {
      const dealerValue = calculateHandValue(dealerHand);
      
      // Dealer must hit on less than 17, stay on all 17s
      if (dealerValue < 17 && deck.length > 0) {
        const timer = setTimeout(() => {
          const newCard = deck[0];
          const newDealerHand = [...dealerHand, newCard];
          setDealerHand(newDealerHand);
          setDeck(deck.slice(1));
          
          // Check if dealer busts
          if (calculateHandValue(newDealerHand) > 21) {
            setGameOver(true);
          }
        }, 1000); // 1 second delay between dealer hits for visual effect
        
        return () => clearTimeout(timer);
      } else if (dealerValue >= 17) {
        setGameOver(true);
      }
    }
  }, [playerStood, dealerHand, gameOver, gameStarted, deck]);

  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);
  const playerBust = playerValue > 21;
  const dealerBust = dealerValue > 21;

  // Determine winner
  let result = '';
  if (gameOver) {
    if (playerBust) {
      result = 'Dealer Wins - You Bust!';
    } else if (dealerBust) {
      result = 'You Win - Dealer Bust!';
    } else if (playerValue > dealerValue) {
      result = 'You Win!';
    } else if (dealerValue > playerValue) {
      result = 'Dealer Wins!';
    } else {
      result = 'Push (Tie)';
    }
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} h-screen overflow-hidden bg-gradient-to-br from-green-800 to-green-950 font-sans`}
    >
      <main className="flex h-screen flex-col items-center justify-center gap-3 py-4 px-4">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-1">Blackjack</h1>
          <p className="text-green-200 text-sm">Try to get as close to 21 as possible!</p>
        </div>

        {/* Dealer's Hand */}
        <div className="w-full max-w-4xl bg-green-900/50 rounded-lg p-3 backdrop-blur-sm border border-green-700/50">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-semibold text-white">Dealer's Hand</h2>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {dealerHand.length > 0 ? dealerValue : '-'}
                </div>
                {dealerBust && (
                  <div className="text-red-400 text-sm font-semibold">BUST!</div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center min-h-[120px] items-center">
              {dealerHand.length > 0 ? (
                dealerHand.map((card, index) => (
                  <div key={`${card.id}-${index}`} className="transform hover:scale-105 transition-transform">
                    <Card suit={card.suit} value={card.value} width={80} height={112} />
                  </div>
                ))
              ) : (
                <p className="text-green-300 text-sm">No cards dealt</p>
              )}
            </div>
            {playerStood && !gameOver && dealerValue < 17 && (
              <div className="text-yellow-400 text-sm font-semibold animate-pulse">
                Dealer is playing...
              </div>
            )}
          </div>
        </div>

        {/* Game Result & Action Buttons */}
        <div className="flex flex-col items-center gap-2">
          {gameOver && result && (
            <div className={`text-xl font-bold ${
              result.includes('You Win') ? 'text-green-400' : 
              result.includes('Push') ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {result}
            </div>
          )}
          
          <div className="flex gap-3">
            {!gameStarted ? (
              <button
                onClick={dealInitialCards}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                Deal Cards
              </button>
            ) : gameOver ? (
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                New Game
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Player's Hand */}
        <div className="w-full max-w-4xl bg-green-900/50 rounded-lg p-3 backdrop-blur-sm border border-green-700/50">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-semibold text-white">Your Hand</h2>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {playerHand.length > 0 ? playerValue : '-'}
                </div>
                {playerBust && (
                  <div className="text-red-400 text-sm font-semibold">BUST!</div>
                )}
                {playerValue === 21 && !playerBust && (
                  <div className="text-yellow-400 text-sm font-semibold">BLACKJACK!</div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center min-h-[120px] items-center">
              {playerHand.length > 0 ? (
                playerHand.map((card, index) => (
                  <div key={`${card.id}-${index}`} className="transform hover:scale-105 transition-transform">
                    <Card suit={card.suit} value={card.value} width={80} height={112} />
                  </div>
                ))
              ) : (
                <p className="text-green-300 text-sm">No cards dealt</p>
              )}
            </div>
            {gameStarted && !gameOver && !playerStood && (
              <div className="flex gap-3">
                <button
                  onClick={hitPlayer}
                  disabled={playerBust || deck.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Stand
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        {gameStarted && (
          <div className="text-center text-green-200">
            <p className="text-xs">Cards remaining: {deck.length}</p>
          </div>
        )}
      </main>
    </div>
  );
}

