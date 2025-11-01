import { useState, useEffect } from 'react';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Roulette wheel numbers in order (European roulette)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers in roulette
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Chip values and colors
const CHIP_VALUES = [
  { value: 1, color: 'bg-white text-black border-gray-400' },
  { value: 5, color: 'bg-red-600 text-white border-red-400' },
  { value: 10, color: 'bg-blue-600 text-white border-blue-400' },
  { value: 25, color: 'bg-green-600 text-white border-green-400' },
  { value: 50, color: 'bg-orange-600 text-white border-orange-400' },
  { value: 100, color: 'bg-black text-white border-gray-600' },
];

// Determine if number is red or black
const getNumberColor = (num) => {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

// Check if bet wins
const checkWin = (bet, result) => {
  return bet.numbers.includes(result);
};

// Calculate payout multiplier based on how many numbers are covered
const getPayoutMultiplier = (numbersCount) => {
  if (numbersCount === 1) return 35; // Straight up
  if (numbersCount === 2) return 17; // Split
  if (numbersCount === 3) return 11; // Street
  if (numbersCount === 4) return 8; // Corner
  if (numbersCount === 6) return 5; // Line
  if (numbersCount === 12) return 2; // Dozen/Column
  if (numbersCount === 18) return 1; // Red/Black, Odd/Even, High/Low
  return 0;
};

export default function Roulette() {
  const [balance, setBalance] = useState(1000);
  const [selectedChip, setSelectedChip] = useState(5);
  const [bets, setBets] = useState({}); // Key: bet position, Value: { amount, numbers, label }
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const placeBet = (betKey, numbers, label) => {
    if (balance < selectedChip) {
      alert('Insufficient balance!');
      return;
    }

    setBets(prevBets => {
      const newBets = { ...prevBets };
      if (newBets[betKey]) {
        newBets[betKey] = {
          ...newBets[betKey],
          amount: newBets[betKey].amount + selectedChip
        };
      } else {
        newBets[betKey] = {
          amount: selectedChip,
          numbers: numbers,
          label: label
        };
      }
      return newBets;
    });
    
    setBalance(balance - selectedChip);
  };

  const clearBets = () => {
    const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet.amount, 0);
    setBalance(balance + totalBetAmount);
    setBets({});
  };

  const spin = () => {
    if (Object.keys(bets).length === 0) {
      alert('Please place at least one bet!');
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Simulate spinning for 3 seconds
    setTimeout(() => {
      const spinResult = WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)];
      setResult(spinResult);
      setIsSpinning(false);
      setShowResult(true);
      setHistory([spinResult, ...history.slice(0, 9)]); // Keep last 10 results

      // Calculate winnings
      let totalWinnings = 0;
      Object.values(bets).forEach(bet => {
        if (checkWin(bet, spinResult)) {
          const payout = bet.amount * getPayoutMultiplier(bet.numbers.length);
          totalWinnings += bet.amount + payout; // Original bet + winnings
        }
      });

      if (totalWinnings > 0) {
        setBalance(balance => balance + totalWinnings);
      }

      // Clear bets after spin
      setTimeout(() => {
        setBets({});
      }, 2000);
    }, 3000);
  };

  const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet.amount, 0);

  // Generate number grid (3 rows x 12 columns) - matching real roulette layout
  const numberGrid = [];
  for (let row = 0; row < 3; row++) {
    const rowNumbers = [];
    for (let col = 0; col < 12; col++) {
      const num = (2 - row) + (col * 3) + 1; // Top row: 3,6,9... Middle: 2,5,8... Bottom: 1,4,7...
      rowNumbers.push(num);
    }
    numberGrid.push(rowNumbers);
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen overflow-auto bg-gradient-to-br from-green-800 to-green-950 font-sans`}
    >
      <main className="flex flex-col items-center justify-center gap-4 py-8 px-4">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Roulette</h1>
          <p className="text-green-200 text-sm">Select chips and place your bets on the table!</p>
        </div>

        {/* Balance */}
        <div className="w-full max-w-6xl bg-green-900/50 rounded-lg p-4 backdrop-blur-sm border border-green-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">Balance:</span>
              <span className="text-2xl font-bold text-yellow-400">${balance}</span>
            </div>
            {totalBetAmount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">Total Bet:</span>
                <span className="text-xl font-bold text-orange-400">${totalBetAmount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Roulette Wheel Display */}
        <div className="w-full max-w-6xl bg-green-900/50 rounded-lg p-6 backdrop-blur-sm border border-green-700/50">
          <div className="flex flex-col items-center gap-4">
            {/* Wheel */}
            <div className={`w-48 h-48 rounded-full border-8 border-yellow-600 bg-gradient-to-br from-yellow-800 to-yellow-950 flex items-center justify-center shadow-2xl ${
              isSpinning ? 'animate-spin' : ''
            }`}>
              <div className="text-center">
                {isSpinning ? (
                  <div className="text-white text-xl font-bold animate-pulse">
                    SPINNING...
                  </div>
                ) : result !== null && showResult ? (
                  <div className="flex flex-col items-center">
                    <div className={`text-6xl font-bold ${
                      getNumberColor(result) === 'red' ? 'text-red-500' :
                      getNumberColor(result) === 'black' ? 'text-black' :
                      'text-green-400'
                    }`}>
                      {result}
                    </div>
                    <div className={`text-sm font-semibold mt-1 ${
                      getNumberColor(result) === 'red' ? 'text-red-300' :
                      getNumberColor(result) === 'black' ? 'text-gray-400' :
                      'text-green-300'
                    }`}>
                      {getNumberColor(result).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-xl font-semibold">
                    Place Bets
                  </div>
                )}
              </div>
            </div>

            {/* Result Message */}
            {showResult && result !== null && (
              <div className="text-center">
                {Object.values(bets).some(bet => checkWin(bet, result)) ? (
                  <div className="text-2xl font-bold text-green-400 animate-pulse">
                    🎉 YOU WIN! 🎉
                  </div>
                ) : (
                  <div className="text-xl font-bold text-red-400">
                    Better luck next time!
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="flex flex-col items-center gap-2 w-full">
                <span className="text-white text-sm font-semibold">Recent Results:</span>
                <div className="flex gap-2 flex-wrap justify-center">
                  {history.map((num, idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 ${
                        getNumberColor(num) === 'red' ? 'bg-red-600 border-red-400' :
                        getNumberColor(num) === 'black' ? 'bg-black border-gray-400' :
                        'bg-green-600 border-green-400'
                      }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chip Selection */}
        <div className="w-full max-w-6xl bg-green-900/50 rounded-lg p-4 backdrop-blur-sm border border-green-700/50">
          <h3 className="text-white font-semibold mb-3 text-center">Select Your Chip</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {CHIP_VALUES.map(chip => (
              <button
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                disabled={isSpinning || balance < chip.value}
                className={`w-16 h-16 rounded-full border-4 font-bold text-lg shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  chip.color
                } ${
                  selectedChip === chip.value ? 'ring-4 ring-yellow-400 scale-110' : 'hover:scale-105'
                }`}
              >
                ${chip.value}
              </button>
            ))}
          </div>
        </div>

        {/* Roulette Table with Interactive Betting Zones */}
        <div className="w-full max-w-6xl bg-green-900/50 rounded-lg p-6 backdrop-blur-sm border border-green-700/50">
          <h3 className="text-white font-semibold text-lg mb-4 text-center">Betting Table</h3>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex gap-0">
                {/* Zero Column */}
                <div className="flex flex-col mr-1">
                  <div className="relative h-[192px]">
                    <button
                      onClick={() => placeBet('num-0', [0], '0')}
                      disabled={isSpinning}
                      className="relative w-16 h-full bg-green-600 hover:bg-green-500 text-white font-bold text-2xl rounded border-2 border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="inline-block rotate-90">0</span>
                      {bets['num-0'] && (
                        <div className={`absolute top-2 right-2 w-10 h-10 rounded-full ${CHIP_VALUES.find(c => c.value <= bets['num-0'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                          ${bets['num-0'].amount}
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Number Grid with Betting Zones */}
                <div className="flex-1">
                  <div className="relative inline-block">
                    {/* Number rows */}
                    {numberGrid.map((row, rowIdx) => (
                      <div key={rowIdx} className="flex gap-0">
                        {/* Street bet (left edge - 3 numbers in a row) */}
                        <div className="relative w-4 h-16">
                          <button
                            onClick={() => {
                              const streetNums = row.slice(0, 1).map(n => [n, n-1, n-2]).flat();
                              const sortedNums = streetNums.sort((a, b) => a - b);
                              placeBet(`street-row${rowIdx}`, sortedNums, `${sortedNums[0]}-${sortedNums[2]} Street`);
                            }}
                            disabled={isSpinning}
                            className="absolute inset-0 w-full h-full bg-green-700/30 hover:bg-yellow-500/50 border border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                          >
                            {bets[`street-row${rowIdx}`] && (
                              <div className={`absolute inset-0 w-8 h-8 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`street-row${rowIdx}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-[10px] font-bold z-20 shadow-lg`}>
                                ${bets[`street-row${rowIdx}`].amount}
                              </div>
                            )}
                          </button>
                        </div>

                        {row.map((num, colIdx) => {
                          const isRed = RED_NUMBERS.includes(num);
                          return (
                            <div key={num} className="relative">
                              {/* Main number cell */}
                              <button
                                onClick={() => placeBet(`num-${num}`, [num], num.toString())}
                                disabled={isSpinning}
                                className={`relative w-16 h-16 font-bold text-white text-lg border border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10 ${
                                  isRed 
                                    ? 'bg-red-600 hover:bg-red-500' 
                                    : 'bg-black hover:bg-gray-800'
                                }`}
                              >
                                {num}
                                {bets[`num-${num}`] && (
                                  <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`num-${num}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                                    ${bets[`num-${num}`].amount}
                                  </div>
                                )}
                              </button>

                              {/* Horizontal split (right edge between this and next number) */}
                              {colIdx < row.length - 1 && (
                                <div className="absolute -right-2 top-0 w-4 h-16 z-30">
                                  <button
                                    onClick={() => {
                                      const nextNum = row[colIdx + 1];
                                      placeBet(`split-h-${num}-${nextNum}`, [num, nextNum], `${num}/${nextNum}`);
                                    }}
                                    disabled={isSpinning}
                                    className="w-full h-full bg-green-700/30 hover:bg-yellow-500/70 border border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {bets[`split-h-${num}-${row[colIdx + 1]}`] && (
                                      <div className={`absolute inset-0 w-8 h-8 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`split-h-${num}-${row[colIdx + 1]}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-[10px] font-bold z-20 shadow-lg`}>
                                        ${bets[`split-h-${num}-${row[colIdx + 1]}`].amount}
                                      </div>
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Vertical split (bottom edge between this and number below) */}
                              {rowIdx < numberGrid.length - 1 && (
                                <div className="absolute left-0 -bottom-2 w-16 h-4 z-30">
                                  <button
                                    onClick={() => {
                                      const belowNum = numberGrid[rowIdx + 1][colIdx];
                                      placeBet(`split-v-${num}-${belowNum}`, [num, belowNum], `${num}/${belowNum}`);
                                    }}
                                    disabled={isSpinning}
                                    className="w-full h-full bg-green-700/30 hover:bg-yellow-500/70 border border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {bets[`split-v-${num}-${numberGrid[rowIdx + 1][colIdx]}`] && (
                                      <div className={`absolute inset-0 w-8 h-8 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`split-v-${num}-${numberGrid[rowIdx + 1][colIdx]}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-[10px] font-bold z-20 shadow-lg`}>
                                        ${bets[`split-v-${num}-${numberGrid[rowIdx + 1][colIdx]}`].amount}
                                      </div>
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Corner (intersection of 4 numbers) */}
                              {rowIdx < numberGrid.length - 1 && colIdx < row.length - 1 && (
                                <div className="absolute -right-2 -bottom-2 w-4 h-4 z-40">
                                  <button
                                    onClick={() => {
                                      const corner = [
                                        num,
                                        row[colIdx + 1],
                                        numberGrid[rowIdx + 1][colIdx],
                                        numberGrid[rowIdx + 1][colIdx + 1]
                                      ].sort((a, b) => a - b);
                                      placeBet(`corner-${corner.join('-')}`, corner, `${corner.join('/')} Corner`);
                                    }}
                                    disabled={isSpinning}
                                    className="w-full h-full bg-green-700/30 hover:bg-yellow-500/90 rounded-full border border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {bets[`corner-${[num, row[colIdx + 1], numberGrid[rowIdx + 1][colIdx], numberGrid[rowIdx + 1][colIdx + 1]].sort((a, b) => a - b).join('-')}`] && (
                                      <div className={`absolute inset-0 w-8 h-8 -m-2 rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`corner-${[num, row[colIdx + 1], numberGrid[rowIdx + 1][colIdx], numberGrid[rowIdx + 1][colIdx + 1]].sort((a, b) => a - b).join('-')}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-[10px] font-bold z-20 shadow-lg`}>
                                        ${bets[`corner-${[num, row[colIdx + 1], numberGrid[rowIdx + 1][colIdx], numberGrid[rowIdx + 1][colIdx + 1]].sort((a, b) => a - b).join('-')}`].amount}
                                      </div>
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Line bet (6 numbers - between two rows at left edge) */}
                              {rowIdx < numberGrid.length - 1 && colIdx === 0 && (
                                <div className="absolute -left-4 -bottom-2 w-4 h-4 z-40">
                                  <button
                                    onClick={() => {
                                      const lineNums = [
                                        ...row.slice(0, 1).map(n => [n, n-1, n-2]).flat(),
                                        ...numberGrid[rowIdx + 1].slice(0, 1).map(n => [n, n-1, n-2]).flat()
                                      ].sort((a, b) => a - b);
                                      placeBet(`line-row${rowIdx}-${rowIdx+1}`, lineNums, `${lineNums[0]}-${lineNums[5]} Line`);
                                    }}
                                    disabled={isSpinning}
                                    className="w-full h-full bg-green-700/30 hover:bg-yellow-500/90 rounded-full border border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {bets[`line-row${rowIdx}-${rowIdx+1}`] && (
                                      <div className={`absolute inset-0 w-8 h-8 -m-2 rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`line-row${rowIdx}-${rowIdx+1}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-[10px] font-bold z-20 shadow-lg`}>
                                        ${bets[`line-row${rowIdx}-${rowIdx+1}`].amount}
                                      </div>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 2 to 1 column bet */}
                        <div className="ml-1">
                          <button
                            onClick={() => {
                              const columnNums = [];
                              for (let i = 0; i < 12; i++) {
                                columnNums.push((2 - rowIdx) + (i * 3) + 1);
                              }
                              placeBet(`col-${rowIdx}`, columnNums, `Column ${rowIdx + 1} (2:1)`);
                            }}
                            disabled={isSpinning}
                            className="relative w-20 h-16 bg-yellow-700 hover:bg-yellow-600 text-white font-bold text-sm rounded border-2 border-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            2:1
                            {bets[`col-${rowIdx}`] && (
                              <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`col-${rowIdx}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                                ${bets[`col-${rowIdx}`].amount}
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Dozens row */}
                    <div className="flex gap-0 mt-1">
                      <div className="w-4"></div>
                      {[1, 2, 3].map(dozen => {
                        const dozenNums = Array.from({ length: 12 }, (_, i) => (dozen - 1) * 12 + i + 1);
                        return (
                          <button
                            key={dozen}
                            onClick={() => placeBet(`dozen-${dozen}`, dozenNums, `${dozen === 1 ? '1st' : dozen === 2 ? '2nd' : '3rd'} 12 (2:1)`)}
                            disabled={isSpinning}
                            className="relative flex-1 h-12 bg-yellow-700 hover:bg-yellow-600 text-white font-semibold text-sm rounded border-2 border-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-px"
                          >
                            {dozen === 1 ? '1st 12' : dozen === 2 ? '2nd 12' : '3rd 12'}
                            {bets[`dozen-${dozen}`] && (
                              <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets[`dozen-${dozen}`].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                                ${bets[`dozen-${dozen}`].amount}
                              </div>
                            )}
                          </button>
                        );
                      })}
                      <div className="w-20 ml-1"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outside bets */}
              <div className="grid grid-cols-6 gap-1 mt-2">
                <button
                  onClick={() => {
                    const lowNums = Array.from({ length: 18 }, (_, i) => i + 1);
                    placeBet('low', lowNums, '1-18');
                  }}
                  disabled={isSpinning}
                  className="relative py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm rounded border-2 border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  1-18
                  {bets['low'] && (
                    <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets['low'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                      ${bets['low'].amount}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    const oddNums = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 1);
                    placeBet('odd', oddNums, 'Odd');
                  }}
                  disabled={isSpinning}
                  className="relative py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold text-sm rounded border-2 border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ODD
                  {bets['odd'] && (
                    <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets['odd'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                      ${bets['odd'].amount}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => placeBet('red', RED_NUMBERS, 'Red')}
                  disabled={isSpinning}
                  className="relative py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded border-2 border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  RED
                  {bets['red'] && (
                    <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets['red'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                      ${bets['red'].amount}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    const blackNums = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => !RED_NUMBERS.includes(n));
                    placeBet('black', blackNums, 'Black');
                  }}
                  disabled={isSpinning}
                  className="relative py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded border-2 border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  BLACK
                  {bets['black'] && (
                    <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets['black'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                      ${bets['black'].amount}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    const evenNums = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 0);
                    placeBet('even', evenNums, 'Even');
                  }}
                  disabled={isSpinning}
                  className="relative py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold text-sm rounded border-2 border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  EVEN
                  {bets['even'] && (
                    <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets['even'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                      ${bets['even'].amount}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    const highNums = Array.from({ length: 18 }, (_, i) => i + 19);
                    placeBet('high', highNums, '19-36');
                  }}
                  disabled={isSpinning}
                  className="relative py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm rounded border-2 border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  19-36
                  {bets['high'] && (
                    <div className={`absolute inset-0 w-10 h-10 m-auto rounded-full ${CHIP_VALUES.find(c => c.value <= bets['high'].amount)?.color || CHIP_VALUES[0].color} border-2 flex items-center justify-center text-xs font-bold z-20 shadow-lg`}>
                      ${bets['high'].amount}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={spin}
            disabled={isSpinning || Object.keys(bets).length === 0}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </button>
          <button
            onClick={clearBets}
            disabled={isSpinning || Object.keys(bets).length === 0}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            Clear Bets
          </button>
        </div>
      </main>
    </div>
  );
}
