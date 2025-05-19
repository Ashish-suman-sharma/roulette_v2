const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
const GREEN_NUMBERS = [0];
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
  13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const BET_AMOUNT = 10; // Amount deducted per bet (in rupees)
const COLOR_PAYOUT = 2; // Multiplier for color bets (red/black)
const EVEN_ODD_PAYOUT = 2; // Multiplier for even/odd bets
const HIGH_LOW_PAYOUT = 2; // Multiplier for high/low bets
const ROW_COLUMN_PAYOUT = 3; // Multiplier for row/column bets (1st/2nd/3rd row, dozens)
const BASE_DALEMBERT_AMOUNT = 10; // Base amount for D'Alembert system
const DALEMBERT_STEP = 10; // Amount to increase/decrease after loss/win
const MAIN_BET_TYPES = ['red', 'black', 'even', 'odd', 'high', 'low']; // Valid bet types for D'Alembert

let numbers = [];
let walletBalance = 2000; // Initial wallet balance
let currentBets = {}; // Track active bets
let dalembertAmount = BASE_DALEMBERT_AMOUNT; // Current D'Alembert recommendation amount
let recommendedBetType = 'red'; // Default recommended bet type

function isRed(num) {
  return RED_NUMBERS.includes(num);
}

function getDozen(num) {
  if (num >= 1 && num <= 12) return 1;
  if (num >= 13 && num <= 24) return 2;
  return 3;
}

function getRow(num) {
  if (num === 0) return 0;
  return ((num - 1) % 3) + 1;
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
}

function checkConsecutive(arr, count) {
  for (let i = 0; i <= arr.length - count; i++) {
    if (arr.slice(i, i + count).every((val, _, subArr) => val === subArr[0])) {
      return true;
    }
  }
  return false;
}

function checkPatterns(newNumbers) {
  clearHighlights();
  
  // Advanced statistical analysis for more profitable betting
  if (newNumbers.length < 5) {
    // Require at least 5 numbers for pattern analysis
    console.log("Need at least 5 numbers for prediction algorithm");
    return;
  }
  
  // Track frequencies
  const numberFrequencies = {};
  const dozenFrequencies = { 1: 0, 2: 0, 3: 0 };
  const rowFrequencies = { 1: 0, 2: 0, 3: 0 };
  let redCount = 0;
  let blackCount = 0;
  let evenCount = 0;
  let oddCount = 0;
  let lowCount = 0;  // 1-18
  let highCount = 0; // 19-36
  let zeroCount = 0;
  
  // Heat map analysis - last 15 numbers
  newNumbers.forEach(num => {
    numberFrequencies[num] = (numberFrequencies[num] || 0) + 1;
    
    if (num === 0) {
      zeroCount++;
      return;
    }
    
    // Track dozens
    const dozen = getDozen(num);
    dozenFrequencies[dozen]++;
    
    // Track rows
    const row = getRow(num);
    rowFrequencies[row]++;
    
    // Track color
    if (isRed(num)) redCount++;
    else blackCount++;
    
    // Track even/odd
    if (num % 2 === 0) evenCount++;
    else oddCount++;
    
    // Track high/low
    if (num >= 1 && num <= 18) lowCount++;
    else highCount++;
  });
  
  // Advanced pattern detection - Sleeper numbers
  const coldNumbers = findColdNumbers(numberFrequencies);
  
  // Sector analysis - Find missing sectors
  const sectorsData = analyzeSectors(newNumbers);
  
  // Bias detection - Find biases in mechanical roulettes
  const biasedBets = detectBias(newNumbers, redCount, blackCount, evenCount, oddCount);
  
  // Martingale-resistant strategy - Find underrepresented patterns
  const streakAnalysis = analyzeStreaks(newNumbers);
  
  // Combine all analyses for final recommendations
  const finalRecommendations = combineAnalyses(
    coldNumbers,
    sectorsData,
    biasedBets,
    streakAnalysis,
    { red: redCount, black: blackCount, even: evenCount, odd: oddCount, low: lowCount, high: highCount },
    dozenFrequencies,
    rowFrequencies
  );
  
  // Highlight recommended bets
  finalRecommendations.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.classList.add('highlight');
  });
}

// Find numbers that haven't appeared recently
function findColdNumbers(frequencies) {
  // Start with all numbers
  const allNumbers = Array.from({length: 37}, (_, i) => i);
  
  // Find numbers that appear less frequently or not at all
  const coldNumbers = allNumbers.filter(num => !frequencies[num] || frequencies[num] < 2);
  
  // Find overdue dozens and rows
  let coldDozens = [];
  if (Object.values(frequencies).filter(f => f > 0).length >= 15) {
    // We have enough data to determine cold dozens
    if (!coldNumbers.some(n => n > 0 && n <= 12)) coldDozens.push('dozen-1');
    if (!coldNumbers.some(n => n > 12 && n <= 24)) coldDozens.push('dozen-2');
    if (!coldNumbers.some(n => n > 24 && n <= 36)) coldDozens.push('dozen-3');
  }
  
  return { numbers: coldNumbers, dozens: coldDozens };
}

// Analyze wheel sectors that might be underrepresented
function analyzeSectors(numbers) {
  // Wheel sectors (groups of adjacent numbers on the wheel)
  const sectors = [
    { name: 'neighbors-of-zero', numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15] },
    { name: 'third-of-wheel', numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33] }
  ];
  
  let recommendedSector = null;
  let lowestHitCount = Infinity;
  
  // Find sector with lowest hit count
  sectors.forEach(sector => {
    const hitCount = numbers.filter(n => sector.numbers.includes(n)).length;
    if (hitCount < lowestHitCount) {
      lowestHitCount = hitCount;
      recommendedSector = sector.name;
    }
  });
  
  // Convert sector recommendation to bets - only return one recommendation
  if (recommendedSector === 'neighbors-of-zero') {
    return ['low'];
  } else if (recommendedSector === 'third-of-wheel') {
    return ['high'];
  }
  
  return [];
}

// Detect bias in the roulette outcomes
function detectBias(numbers, redCount, blackCount, evenCount, oddCount) {
  const recommendations = [];
  
  // Check if there's a strong color bias
  if (redCount > blackCount * 1.5) recommendations.push('black');
  if (blackCount > redCount * 1.5) recommendations.push('red');
  
  // Check if there's a strong even/odd bias
  if (evenCount > oddCount * 1.5) recommendations.push('odd');
  if (oddCount > evenCount * 1.5) recommendations.push('even');
  
  // Check for repeating numbers (clumping)
  let repeats = 0;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === numbers[i-1]) repeats++;
  }
  
  // If we see clumping behavior, look for recent numbers
  if (repeats > 2) {
    // Find most frequent numbers in the recent history
    const recent = numbers.slice(0, 5);
    let mostFrequent = {}; 
    recent.forEach(n => {
      mostFrequent[n] = (mostFrequent[n] || 0) + 1;
    });
    
    // Bet on proven repeaters
    const repeatingNumbers = Object.entries(mostFrequent)
      .filter(([_, count]) => count > 1)
      .map(([num, _]) => parseInt(num));
    
    if (repeatingNumbers.length > 0) {
      // Indicate hot sections rather than specific numbers
      if (repeatingNumbers.some(n => n >= 1 && n <= 18)) recommendations.push('low');
      if (repeatingNumbers.some(n => n >= 19 && n <= 36)) recommendations.push('high');
    }
  }
  
  return recommendations;
}

// Analyze streaks and patterns in the sequence
function analyzeStreaks(numbers) {
  // Get last 10 numbers only for streak analysis
  const recent = numbers.slice(0, 10);
  const recommendations = [];
  
  // Check for color streaks
  let redStreak = 0;
  let blackStreak = 0;
  let currentRedStreak = 0;
  let currentBlackStreak = 0;
  
  for (let i = 0; i < recent.length; i++) {
    if (recent[i] === 0) {
      currentRedStreak = 0;
      currentBlackStreak = 0;
      continue;
    }
    
    if (isRed(recent[i])) {
      currentRedStreak++;
      currentBlackStreak = 0;
      redStreak = Math.max(redStreak, currentRedStreak);
    } else {
      currentBlackStreak++;
      currentRedStreak = 0;
      blackStreak = Math.max(blackStreak, currentBlackStreak);
    }
  }
  
  // Check for strong streaks and bet against them (mean reversion)
  if (redStreak > 3 && currentRedStreak > 2) recommendations.push('black');
  if (blackStreak > 3 && currentBlackStreak > 2) recommendations.push('red');

  // Check for row patterns
  const rowCounts = [0, 0, 0, 0]; // Index 0 is for zero
  for (let i = 0; i < recent.length; i++) {
    rowCounts[getRow(recent[i])]++;
  }
  
  // Find rows that haven't hit recently
  const maxRowCount = Math.max(...rowCounts.slice(1));
  const minRowCount = Math.min(...rowCounts.slice(1));
  
  if (maxRowCount >= 3 * minRowCount) {
    // Strong disparity between rows
    for (let r = 1; r <= 3; r++) {
      if (rowCounts[r] === minRowCount) recommendations.push(`row-${r}`);
    }
  }
  
  return recommendations;
}

// Combine all analyses for final betting recommendations
function combineAnalyses(coldNumbers, sectorData, biasedBets, streakAnalysis, distributionCounts, dozenFreqs, rowFreqs) {
  // Focus only on the six main bet types (red, black, even, odd, high, low)
  const mainBetTypes = ['red', 'black', 'even', 'odd', 'high', 'low'];
  
  // Calculate probability scores for each bet type
  const scores = {
    'red': 0,
    'black': 0, 
    'even': 0,
    'odd': 0,
    'high': 0,
    'low': 0,
    'dozen-1': 0,
    'dozen-2': 0,
    'dozen-3': 0,
    'row-1': 0,
    'row-2': 0,
    'row-3': 0
  };
  
  // Score based on distribution ratios
  const redBlackRatio = distributionCounts.black > 0 ? distributionCounts.red / distributionCounts.black : 1;
  const evenOddRatio = distributionCounts.odd > 0 ? distributionCounts.even / distributionCounts.odd : 1;
  const lowHighRatio = distributionCounts.high > 0 ? distributionCounts.low / distributionCounts.high : 1;
  
  // Higher score means more likely to win
  scores['black'] += redBlackRatio * 10;
  scores['red'] += (1/redBlackRatio) * 10;
  scores['odd'] += evenOddRatio * 10;
  scores['even'] += (1/evenOddRatio) * 10;
  scores['high'] += lowHighRatio * 10;
  scores['low'] += (1/lowHighRatio) * 10;
  
  // Add scores from streak analysis (higher weight)
  streakAnalysis.forEach(rec => {
    if (scores.hasOwnProperty(rec)) {
      scores[rec] += 15;
    }
  });
  
  // Add scores from bias detection
  biasedBets.forEach(rec => {
    if (scores.hasOwnProperty(rec)) {
      scores[rec] += 12;
    }
  });
  
  // Add scores from sector analysis (lower weight for these)
  sectorData.forEach(rec => {
    if (scores.hasOwnProperty(rec)) {
      scores[rec] += 8;
    }
  });
  
  // Filter to only include main bet types
  const mainBetScores = {};
  mainBetTypes.forEach(bet => {
    mainBetScores[bet] = scores[bet];
  });
  
  // Find bet with highest score
  let bestBet = null;
  let highestScore = 0;
  
  Object.entries(mainBetScores).forEach(([bet, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestBet = bet;
    }
  });
  
  // Only return a recommendation if we have enough data and confidence
  if (bestBet && highestScore > 15) {
    return [bestBet];
  }
  
  // Return empty array if not enough confidence
  return [];
}

// Wallet management functions
function updateWalletDisplay() {
  document.getElementById('wallet-amount').textContent = '₹' + walletBalance;
  document.getElementById('current-bet').textContent = '₹' + calculateTotalBet();
}

function calculateTotalBet() {
  return Object.values(currentBets).reduce((total, betCount) => total + (betCount * BET_AMOUNT), 0);
}

function updateDalembertDisplay(isWin) {
  const recommendedBetElement = document.getElementById('recommended-bet');
  const recommendedBetTypeElement = document.getElementById('recommended-bet-type');
  
  // Update the amount displayed
  recommendedBetElement.textContent = '₹' + dalembertAmount;
  
  // Update the bet type (if needed after a result)
  if (isWin !== undefined) {
    // Choose a new recommended bet type based on recent results
    updateRecommendedBetType();
    recommendedBetTypeElement.textContent = recommendedBetType.toUpperCase();
  }
  
  // Add animation class based on win/loss
  recommendedBetElement.classList.remove('winning-animation', 'lose-animation');
  
  if (isWin !== undefined) { // Only add animation if we're updating after a game result
    if (isWin) {
      recommendedBetElement.classList.add('winning-animation');
    } else {
      recommendedBetElement.classList.add('lose-animation');
    }
  }
}

function updateRecommendedBetType() {
  // Analyze the recent numbers to make a recommendation
  if (numbers.length > 3) {
    // Count occurrences of each bet type in the last few spins
    const counts = {
      red: 0,
      black: 0,
      even: 0,
      odd: 0,
      high: 0,
      low: 0
    };
    
    // Check last 5 numbers (or fewer if we don't have 5 yet)
    const recentNumbers = numbers.slice(0, Math.min(5, numbers.length));
    
    recentNumbers.forEach(num => {
      // Skip 0 for most analyses
      if (num === 0) return;
      
      // Color counts
      if (isRed(num)) counts.red++;
      else counts.black++;
      
      // Even/odd counts
      if (num % 2 === 0) counts.even++;
      else counts.odd++;
      
      // High/low counts
      if (num >= 1 && num <= 18) counts.low++;
      else counts.high++;
    });
    
    // Find the least frequent outcome (D'Alembert strategy often bets against streaks)
    let minCount = Infinity;
    let bestBetTypes = [];
    
    for (const [betType, count] of Object.entries(counts)) {
      if (count < minCount) {
        minCount = count;
        bestBetTypes = [betType];
      } else if (count === minCount) {
        bestBetTypes.push(betType);
      }
    }
    
    // Choose a bet type randomly from the least frequent ones
    if (bestBetTypes.length > 0) {
      recommendedBetType = bestBetTypes[Math.floor(Math.random() * bestBetTypes.length)];
    }
  } else {
    // Not enough data yet, just pick a random bet type
    recommendedBetType = MAIN_BET_TYPES[Math.floor(Math.random() * MAIN_BET_TYPES.length)];
  }
}

function placeDalembertBet() {
  // Check if we have enough wallet balance to place the bet
  if (walletBalance < dalembertAmount) {
    alert(`Insufficient wallet balance! You need ₹${dalembertAmount} to place the D'Alembert bet.`);
    return;
  }
  
  // Clear any existing bets first
  clearBetsWithoutRefund();
  
  // Place the D'Alembert recommended bet
  currentBets[recommendedBetType] = Math.floor(dalembertAmount / BET_AMOUNT);
  
  // Deduct from wallet
  walletBalance -= dalembertAmount;
  
  // Update display
  updateWalletDisplay();
  
  // Highlight the recommended bet button
  const button = document.getElementById(recommendedBetType);
  if (button) {
    button.classList.add('active-bet');
  }
  
  // Show a confirmation message
  const messageContainer = document.createElement('div');
  messageContainer.className = 'dalembert-message';
  messageContainer.innerHTML = `
    <div class="dalembert-text">D'ALEMBERT BET PLACED</div>
    <div class="dalembert-details">₹${dalembertAmount} on ${recommendedBetType.toUpperCase()}</div>
  `;
  
  // Add to DOM
  document.querySelector('.main-container').appendChild(messageContainer);
  
  // Remove after animation
  setTimeout(() => {
    messageContainer.classList.add('fade-out');
    setTimeout(() => messageContainer.remove(), 500);
  }, 1500);
}

function placeBet(betType) {
  if (walletBalance >= BET_AMOUNT) {
    // Add bet to current bets
    currentBets[betType] = (currentBets[betType] || 0) + 1;
    
    // Deduct from wallet
    walletBalance -= BET_AMOUNT;
    
    // Update display
    updateWalletDisplay();
    
    // Highlight button
    const button = document.getElementById(betType);
    if (button) {
      button.classList.add('active-bet');
    }
    
    // Show which bets are placed in console (for debugging)
    console.log('Current bets:', currentBets, 'Total bet amount: ₹' + calculateTotalBet());
    
    return true;
  } else {
    alert('Insufficient wallet balance!');
    return false;
  }
}

function clearBets() {
  // Calculate total bet amount to refund
  const refundAmount = calculateTotalBet();
  
  // Add the bet amount back to the wallet
  walletBalance += refundAmount;
  
  // Remove active bet highlights
  Object.keys(currentBets).forEach(betType => {
    const button = document.getElementById(betType);
    if (button) {
      button.classList.remove('active-bet');
    }
  });
  
  // Clear bets object
  currentBets = {};
  
  // Update display
  updateWalletDisplay();
  
  // Show refund message if any bets were cleared
  if (refundAmount > 0) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'refund-message';
    messageContainer.innerHTML = `
      <div class="refund-text">BETS CLEARED</div>
      <div class="refund-details">₹${refundAmount} returned to wallet</div>
    `;
    
    // Add to DOM
    document.querySelector('.main-container').appendChild(messageContainer);
    
    // Remove after animation
    setTimeout(() => {
      messageContainer.classList.add('fade-out');
      setTimeout(() => messageContainer.remove(), 500);
    }, 1500);
  }
}

// Function to clear bets without refunding money (for when bets are settled)
function clearBetsWithoutRefund() {
  // Remove active bet highlights
  Object.keys(currentBets).forEach(betType => {
    const button = document.getElementById(betType);
    if (button) {
      button.classList.remove('active-bet');
    }
  });
  
  // Clear bets object
  currentBets = {};
}

function processBets(winningNumber) {
  if (Object.keys(currentBets).length === 0) return;
  
  const winningBets = [];
  const losingBets = [];
  let totalWinnings = 0;
  
  // Check each bet type
  Object.keys(currentBets).forEach(betType => {
    let isWin = false;
    let payout = 0;
    
    // Process color bets (red/black)
    if (betType === 'red' && isRed(winningNumber)) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * COLOR_PAYOUT;
    } else if (betType === 'black' && BLACK_NUMBERS.includes(winningNumber)) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * COLOR_PAYOUT;
    }
    
    // Process even/odd bets
    else if (betType === 'even' && winningNumber % 2 === 0 && winningNumber !== 0) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * EVEN_ODD_PAYOUT;
    } else if (betType === 'odd' && winningNumber % 2 === 1) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * EVEN_ODD_PAYOUT;
    }
    
    // Process high/low bets
    else if (betType === 'low' && winningNumber >= 1 && winningNumber <= 18) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * HIGH_LOW_PAYOUT;
    } else if (betType === 'high' && winningNumber >= 19 && winningNumber <= 36) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * HIGH_LOW_PAYOUT;
    }
    
    // Process dozen bets
    else if (betType === 'dozen-1' && winningNumber >= 1 && winningNumber <= 12) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * ROW_COLUMN_PAYOUT;
    } else if (betType === 'dozen-2' && winningNumber >= 13 && winningNumber <= 24) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * ROW_COLUMN_PAYOUT;
    } else if (betType === 'dozen-3' && winningNumber >= 25 && winningNumber <= 36) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * ROW_COLUMN_PAYOUT;
    }
    
    // Process row bets
    else if (betType === 'row-1' && getRow(winningNumber) === 1) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * ROW_COLUMN_PAYOUT;
    } else if (betType === 'row-2' && getRow(winningNumber) === 2) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * ROW_COLUMN_PAYOUT;
    } else if (betType === 'row-3' && getRow(winningNumber) === 3) {
      isWin = true;
      payout = currentBets[betType] * BET_AMOUNT * ROW_COLUMN_PAYOUT;
    }
    
    if (isWin) {
      winningBets.push(betType);
      totalWinnings += payout;
    } else {
      losingBets.push(betType);
    }
  });
  
  // Update D'Alembert recommendation based on results
  if (totalWinnings > 0) {
    // After a win, decrease bet by DALEMBERT_STEP
    dalembertAmount = Math.max(BASE_DALEMBERT_AMOUNT, dalembertAmount - DALEMBERT_STEP);
    updateDalembertDisplay(true); // true indicates a win
  } else if (Object.keys(currentBets).length > 0) {
    // After a loss, increase bet by DALEMBERT_STEP
    dalembertAmount += DALEMBERT_STEP;
    updateDalembertDisplay(false); // false indicates a loss
  }
  
  // Add winnings to wallet
  if (totalWinnings > 0) {
    walletBalance += totalWinnings;
    displayWinMessage(winningBets, totalWinnings);
  }
  
  // Display losing message if there were bets but no wins
  if (winningBets.length === 0 && Object.keys(currentBets).length > 0) {
    displayLoseMessage(losingBets);
  }
  
  // Clear bets without refunding money (since bets are already settled)
  clearBetsWithoutRefund();
  updateWalletDisplay();
  
  // Add winning animation
  const walletAmount = document.getElementById('wallet-amount');
  if (totalWinnings > 0) {
    walletAmount.classList.add('winning-animation');
    setTimeout(() => walletAmount.classList.remove('winning-animation'), 1500);
  }
}

function displayWinMessage(winningBets, amount) {
  // Create a win message
  const messageContainer = document.createElement('div');
  messageContainer.className = 'win-message';
  messageContainer.innerHTML = `
    <div class="win-text">WIN! +₹${amount}</div>
    <div class="win-details">${winningBets.join(', ')}</div>
  `;
  
  // Add to DOM
  document.querySelector('.main-container').appendChild(messageContainer);
  
  // Remove after animation
  setTimeout(() => {
    messageContainer.classList.add('fade-out');
    setTimeout(() => messageContainer.remove(), 500);
  }, 2500);
}

function displayLoseMessage(losingBets) {
  // Create a lose message
  const messageContainer = document.createElement('div');
  messageContainer.className = 'lose-message';
  messageContainer.innerHTML = `
    <div class="lose-text">LOST!</div>
    <div class="lose-details">${losingBets.join(', ')}</div>
  `;
  
  // Add to DOM
  document.querySelector('.main-container').appendChild(messageContainer);
  
  // Remove after animation
  setTimeout(() => {
    messageContainer.classList.add('fade-out');
    setTimeout(() => messageContainer.remove(), 500);
  }, 2000);
}

function handleSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('number-input');
  const num = parseInt(input.value);

  if (num >= 0 && num <= 36) {
    addNumber(num);
    input.value = '';
  }
}

function addNumber(num) {
  if (num >= 0 && num <= 36) {
    // Process bets before adding the new number
    processBets(num);
    
    numbers.unshift(num); // Add new number to the beginning of the array
    numbers = numbers.slice(0, 12); // Keep only the last 12 numbers
    checkPatterns(numbers);
    updateNumbersDisplay();
  }
}

function deleteLast() {
  if (numbers.length > 0) {
    numbers.shift(); // Remove the first (most recent) number
    checkPatterns(numbers);
    updateNumbersDisplay();
  }
}

function updateNumbersDisplay() {
  // Simply display the last numbers without hot/cold information
  document.getElementById('last-numbers').textContent = 'Last ' + (numbers.length > 0 ? numbers.length : 10) + ' numbers: ' + numbers.join(', ');
}

document.getElementById('number-form').addEventListener('submit', handleSubmit);
document.getElementById('delete-last').addEventListener('click', deleteLast);

function renderNumbers() {
  const container = document.getElementById('roulette-numbers');
  const positions = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
  ];

  positions.forEach(row => {
    row.forEach(num => {
      const button = document.createElement('button');
      button.textContent = num;
      button.className = 'w-12 h-12 border font-bold hover:opacity-80';
      if (GREEN_NUMBERS.includes(num)) {
        button.classList.add('green-number');
      } else if (isRed(num)) {
        button.classList.add('red-number');
      } else {
        button.classList.add('black-number');
      }
      // Add click event to directly add the number
      button.addEventListener('click', () => addNumber(num));
      container.appendChild(button);
    });
  });
  
  // Add click event to zero button as well
  document.querySelector('.zero-button').addEventListener('click', () => addNumber(0));

  // Add click events to betting buttons
  document.getElementById('red').addEventListener('click', () => placeBet('red'));
  document.getElementById('black').addEventListener('click', () => placeBet('black'));
  document.getElementById('even').addEventListener('click', () => placeBet('even'));
  document.getElementById('odd').addEventListener('click', () => placeBet('odd'));
  document.getElementById('low').addEventListener('click', () => placeBet('low'));
  document.getElementById('high').addEventListener('click', () => placeBet('high'));
  document.getElementById('dozen-1').addEventListener('click', () => placeBet('dozen-1'));
  document.getElementById('dozen-2').addEventListener('click', () => placeBet('dozen-2'));
  document.getElementById('dozen-3').addEventListener('click', () => placeBet('dozen-3'));
  document.getElementById('row-1').addEventListener('click', () => placeBet('row-1'));
  document.getElementById('row-2').addEventListener('click', () => placeBet('row-2'));
  document.getElementById('row-3').addEventListener('click', () => placeBet('row-3'));
}

renderNumbers();
updateWalletDisplay(); // Initialize wallet display

document.addEventListener('keydown', function (e) {
  if (e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
    (e.ctrlKey && (e.key === "U" || e.key === "S" || e.key === "P"))) {
    e.preventDefault();
  }
});

document.oncontextmenu = function (e) {
  e.preventDefault();
};

document.addEventListener('mousedown', function (e) {
  if (e.button === 2) {
    e.preventDefault();
  }
});

document.addEventListener('mouseup', function (e) {
  if (e.button === 2) {
    e.preventDefault();
  }
});

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize wallet display
  updateWalletDisplay();
  
  // Initialize D'Alembert recommendation display
  updateRecommendedBetType();
  updateDalembertDisplay();
  
  // Add clear bets button with more styling to match the theme
  const clearBetsButton = document.createElement('button');
  clearBetsButton.textContent = 'CLEAR ALL BETS';
  clearBetsButton.id = 'clear-bets';
  clearBetsButton.className = 'p-3 bg-red-600 bg-opacity-80 text-white font-bold hover:opacity-80 rounded-md mt-4 w-full border border-opacity-50 border-red-400';
  clearBetsButton.innerHTML = '<i class="fas fa-trash-alt mr-2"></i> CLEAR ALL BETS';
  clearBetsButton.addEventListener('click', () => clearBets());
  
  // Add it to the DOM immediately after the board container
  const boardContainer = document.querySelector('.board-container');
  if (boardContainer) {
    boardContainer.appendChild(clearBetsButton);
  }
  
  // Add a D'Alembert betting button to quickly place recommended bet
  const dalembertButton = document.createElement('button');
  dalembertButton.id = 'dalembert-bet-btn';
  dalembertButton.className = 'p-3 bg-purple-600 bg-opacity-80 text-white font-bold hover:opacity-80 rounded-md mt-2 w-full border border-opacity-50 border-purple-400';
  dalembertButton.innerHTML = '<i class="fas fa-robot mr-2"></i> PLACE D\'ALEMBERT BET';
  dalembertButton.addEventListener('click', placeDalembertBet);
  
  // Add it below the clear bets button
  if (boardContainer) {
    boardContainer.appendChild(dalembertButton);
  }
});
