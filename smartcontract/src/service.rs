#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    graphql::GraphQLMutationRoot, 
    linera_base_types::{WithServiceAbi, AccountOwner}, 
    views::{View, ViewStorageContext}, 
    Service,
    ServiceRuntime,
};

use smartcontract::Operation;

use self::state::{SmartcontractState, Game};

pub struct SmartcontractService {
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(SmartcontractService);

impl WithServiceAbi for SmartcontractService {
    type Abi = smartcontract::SmartcontractAbi;
}

impl Service for SmartcontractService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        SmartcontractService {
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let storage = self.runtime.root_view_storage_context();
        let schema = Schema::build(
            QueryRoot { storage },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish();
        
        schema.execute(request).await
    }
}

struct QueryRoot {
    storage: ViewStorageContext,
}

#[derive(SimpleObject)]
struct GameState {
    player_hand: Vec<u8>,
    dealer_visible_hand: Vec<u8>,
    player_value: u8,
    dealer_visible_value: u8,
    bet_amount: u64,
    is_active: bool,
    player_stayed: bool,
}

#[Object]
impl QueryRoot {
    async fn balance(&self, owner: AccountOwner) -> u64 {
        let state = SmartcontractState::load(self.storage.clone())
            .await
            .expect("Failed to load state");
        state.balances.get(&owner).await
            .expect("Failed to get balance")
            .unwrap_or(1000)
    }

    async fn game(&self, owner: AccountOwner) -> Option<GameState> {
        let state = SmartcontractState::load(self.storage.clone())
            .await
            .expect("Failed to load state");
        let game = state.games.get(&owner).await
            .expect("Failed to get game")?;
        
        let dealer_visible_hand = if game.is_active && !game.player_stayed {
            game.dealer_hand.clone()
        } else {
            let mut full_hand = game.dealer_hand.clone();
            full_hand.push(game.dealer_hidden_card);
            full_hand
        };

        Some(GameState {
            player_hand: game.player_hand.clone(),
            dealer_visible_hand: dealer_visible_hand.clone(),
            player_value: Game::calculate_hand_value(&game.player_hand),
            dealer_visible_value: Game::calculate_hand_value(&dealer_visible_hand),
            bet_amount: game.bet_amount,
            is_active: game.is_active,
            player_stayed: game.player_stayed,
        })
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use linera_sdk::ServiceRuntime;

    use super::SmartcontractService;

    #[test]
    fn test_service_creation() {
        let runtime = Arc::new(ServiceRuntime::<SmartcontractService>::new());

        let _service = SmartcontractService {
            runtime,
        };
        
        // Service created successfully
        assert!(true);
    }
}
