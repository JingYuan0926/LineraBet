# Blackjack Smart Contract

A simple blackjack game implementation for the Linera blockchain.

## Features

- **Bet**: Start a new game with a bet amount
- **Hit**: Draw another card
- **Stay**: End your turn and let the dealer play
- **Balance Tracking**: Each player starts with 1000 chips

## Game Rules

1. Players start with 1000 chips
2. Place a bet to start a game
3. Receive 2 cards, dealer shows 1 card
4. Choose to Hit (draw card) or Stay (end turn)
5. If you bust (go over 21), you lose automatically
6. When you Stay, dealer plays (hits until 17+)
7. Highest hand without busting wins
8. Blackjack (21) wins immediately
9. Tie returns your bet

## Card Values

- Number cards (2-10): Face value
- Face cards (J, Q, K): 10 points
- Aces: 11 points (automatically becomes 1 if hand would bust)

## Operations

### StartGame
Start a new blackjack game with a bet.

```graphql
mutation {
  startGame(betAmount: 100)
}
```

### Hit
Draw another card in the current game.

```graphql
mutation {
  hit
}
```

### Stay
End your turn and resolve the game.

```graphql
mutation {
  stay
}
```

## Queries

### Balance
Get your current chip balance.

```graphql
query {
  balance(owner: "YOUR_OWNER_ADDRESS")
}
```

### Game
Get the current game state.

```graphql
query {
  game(owner: "YOUR_OWNER_ADDRESS") {
    playerHand
    dealerVisibleHand
    playerValue
    dealerVisibleValue
    betAmount
    isActive
    playerStayed
  }
}
```

## Deployment

### Build the contract
```bash
cd smartcontract
cargo build --target wasm32-unknown-unknown --release
```

### Publish and create the application
```bash
linera publish-and-create \
  target/wasm32-unknown-unknown/release/smartcontract_{contract,service}.wasm \
  --json-argument "null"
```

## Example Gameplay

1. **Start a game with 50 chips bet:**
   ```graphql
   mutation { startGame(betAmount: 50) }
   ```
   Response: "Game started! Your cards: [3, 15], value: 13. Dealer shows: [27]"

2. **Check game state:**
   ```graphql
   query { game(owner: "YOUR_OWNER") { playerValue dealerVisibleValue isActive } }
   ```

3. **Hit to draw a card:**
   ```graphql
   mutation { hit }
   ```
   Response: "Drew card. Your hand: [3, 15, 8], value: 21"

4. **Stay to end and resolve:**
   ```graphql
   mutation { stay }
   ```
   Response: "YOU WIN! Won 50 chips! Player: 21, Dealer: [27, 12, 5] (20)"

5. **Check balance:**
   ```graphql
   query { balance(owner: "YOUR_OWNER") }
   ```
   Response: 1050 (started with 1000, bet 50, won 100 back)

## Notes

- Each player can only have one active game at a time
- The dealer must hit until reaching 17 or higher
- Cards are represented as numbers 0-51 (52 card deck)
- The random number generator uses a simple linear congruential generator (not cryptographically secure)
- Players start with 1000 chips if they haven't played before

