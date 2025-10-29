use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};
use linera_sdk::linera_base_types::AccountOwner;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Game {
    pub player_hand: Vec<u8>,
    pub dealer_hand: Vec<u8>,
    pub dealer_hidden_card: u8,
    pub bet_amount: u64,
    pub is_active: bool,
    pub player_stayed: bool,
}

impl Game {
    pub fn calculate_hand_value(hand: &[u8]) -> u8 {
        let mut value = 0u8;
        let mut aces = 0u8;
        
        for &card in hand {
            let card_value = card % 13 + 1;
            if card_value == 1 {
                aces += 1;
                value += 11;
            } else if card_value > 10 {
                value += 10;
            } else {
                value += card_value;
            }
        }
        
        while value > 21 && aces > 0 {
            value -= 10;
            aces -= 1;
        }
        
        value
    }
}

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct SmartcontractState {
    pub balances: MapView<AccountOwner, u64>,
    pub games: MapView<AccountOwner, Game>,
    pub deck_seed: RegisterView<u64>,
}
