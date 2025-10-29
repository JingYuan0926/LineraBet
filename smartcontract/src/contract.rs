#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use smartcontract::Operation;

use self::state::{SmartcontractState, Game};

pub struct SmartcontractContract {
    state: SmartcontractState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(SmartcontractContract);

impl WithContractAbi for SmartcontractContract {
    type Abi = smartcontract::SmartcontractAbi;
}

impl Contract for SmartcontractContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = SmartcontractState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        SmartcontractContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
        self.state.deck_seed.set(0);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        let owner = self.runtime
            .authenticated_signer()
            .expect("Operation must be authenticated");

        match operation {
            Operation::StartGame { bet_amount } => {
                self.start_game(owner, bet_amount).await
            }
            Operation::Hit => {
                self.hit(owner).await
            }
            Operation::Stay => {
                self.stay(owner).await
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl SmartcontractContract {
    fn draw_card(&mut self) -> u8 {
        let seed = self.state.deck_seed.get();
        let card = (seed % 52) as u8;
        self.state.deck_seed.set(seed.wrapping_mul(1103515245).wrapping_add(12345));
        card
    }

    async fn start_game(&mut self, owner: linera_sdk::linera_base_types::AccountOwner, bet_amount: u64) -> String {
        // Check if player has active game
        if let Some(game) = self.state.games.get(&owner).await.expect("Failed to get game") {
            if game.is_active {
                return "You already have an active game. Finish it first.".to_string();
            }
        }

        // Check balance
        let balance = self.state.balances.get(&owner).await.expect("Failed to get balance").unwrap_or(1000);
        if balance < bet_amount {
            return format!("Insufficient balance. You have {} but tried to bet {}", balance, bet_amount);
        }

        // Deduct bet from balance
        self.state.balances.insert(&owner, balance - bet_amount).expect("Failed to update balance");

        // Deal initial cards
        let player_card1 = self.draw_card();
        let player_card2 = self.draw_card();
        let dealer_card = self.draw_card();
        let dealer_hidden = self.draw_card();

        let game = Game {
            player_hand: vec![player_card1, player_card2],
            dealer_hand: vec![dealer_card],
            dealer_hidden_card: dealer_hidden,
            bet_amount,
            is_active: true,
            player_stayed: false,
        };

        let player_value = Game::calculate_hand_value(&game.player_hand);
        
        // Check for blackjack
        if player_value == 21 {
            let result = self.resolve_game(owner, &game).await;
            self.state.games.insert(&owner, Game {
                is_active: false,
                ..game
            }).expect("Failed to save game");
            return result;
        }

        self.state.games.insert(&owner, game.clone()).expect("Failed to save game");
        
        format!("Game started! Your cards: {:?}, value: {}. Dealer shows: {:?}", 
            game.player_hand, player_value, game.dealer_hand)
    }

    async fn hit(&mut self, owner: linera_sdk::linera_base_types::AccountOwner) -> String {
        let mut game = match self.state.games.get(&owner).await.expect("Failed to get game") {
            Some(g) if g.is_active && !g.player_stayed => g,
            Some(_) => return "Game is not active or you already stayed.".to_string(),
            None => return "No active game. Start a new game first.".to_string(),
        };

        // Draw card
        let card = self.draw_card();
        game.player_hand.push(card);
        
        let player_value = Game::calculate_hand_value(&game.player_hand);

        // Check for bust
        if player_value > 21 {
            let result = self.resolve_game(owner, &game).await;
            game.is_active = false;
            self.state.games.insert(&owner, game).expect("Failed to save game");
            return result;
        }

        self.state.games.insert(&owner, game.clone()).expect("Failed to save game");
        format!("Drew card. Your hand: {:?}, value: {}", game.player_hand, player_value)
    }

    async fn stay(&mut self, owner: linera_sdk::linera_base_types::AccountOwner) -> String {
        let mut game = match self.state.games.get(&owner).await.expect("Failed to get game") {
            Some(g) if g.is_active && !g.player_stayed => g,
            Some(_) => return "Game is not active or you already stayed.".to_string(),
            None => return "No active game. Start a new game first.".to_string(),
        };

        game.player_stayed = true;
        
        // Dealer plays
        game.dealer_hand.push(game.dealer_hidden_card);
        
        while Game::calculate_hand_value(&game.dealer_hand) < 17 {
            let card = self.draw_card();
            game.dealer_hand.push(card);
        }

        let result = self.resolve_game(owner, &game).await;
        game.is_active = false;
        self.state.games.insert(&owner, game).expect("Failed to save game");
        result
    }

    async fn resolve_game(&mut self, owner: linera_sdk::linera_base_types::AccountOwner, game: &Game) -> String {
        let player_value = Game::calculate_hand_value(&game.player_hand);
        let dealer_value = Game::calculate_hand_value(&game.dealer_hand);
        
        let balance = self.state.balances.get(&owner).await.expect("Failed to get balance").unwrap_or(0);

        let result = if player_value > 21 {
            format!("BUST! You lost {} chips. Player: {}, Dealer: {:?} ({})", 
                game.bet_amount, player_value, game.dealer_hand, dealer_value)
        } else if dealer_value > 21 {
            let winnings = game.bet_amount * 2;
            self.state.balances.insert(&owner, balance + winnings).expect("Failed to update balance");
            format!("Dealer BUST! You won {} chips! Player: {}, Dealer: {:?} ({})", 
                game.bet_amount, player_value, game.dealer_hand, dealer_value)
        } else if player_value > dealer_value {
            let winnings = game.bet_amount * 2;
            self.state.balances.insert(&owner, balance + winnings).expect("Failed to update balance");
            format!("YOU WIN! Won {} chips! Player: {}, Dealer: {:?} ({})", 
                game.bet_amount, player_value, game.dealer_hand, dealer_value)
        } else if player_value < dealer_value {
            format!("Dealer wins. You lost {} chips. Player: {}, Dealer: {:?} ({})", 
                game.bet_amount, player_value, game.dealer_hand, dealer_value)
        } else {
            self.state.balances.insert(&owner, balance + game.bet_amount).expect("Failed to update balance");
            format!("PUSH (tie). Bet returned. Player: {}, Dealer: {:?} ({})", 
                player_value, game.dealer_hand, dealer_value)
        };

        result
    }
}

#[cfg(test)]
mod tests {
    use futures::FutureExt as _;
    use linera_sdk::{util::BlockingWait, views::View, Contract, ContractRuntime};

    use super::{SmartcontractContract, SmartcontractState};

    fn create_and_instantiate_app() -> SmartcontractContract {
        let runtime = ContractRuntime::new().with_application_parameters(());
        let mut contract = SmartcontractContract {
            state: SmartcontractState::load(runtime.root_view_storage_context())
                .blocking_wait()
                .expect("Failed to read from mock key value store"),
            runtime,
        };

        contract
            .instantiate(())
            .now_or_never()
            .expect("Initialization of application state should not await anything");

        contract
    }

    #[test]
    fn test_instantiate() {
        let app = create_and_instantiate_app();
        assert_eq!(*app.state.deck_seed.get(), 0);
    }
}
