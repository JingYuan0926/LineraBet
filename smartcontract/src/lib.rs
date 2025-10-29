use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct SmartcontractAbi;

impl ContractAbi for SmartcontractAbi {
    type Operation = Operation;
    type Response = String;
}

impl ServiceAbi for SmartcontractAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Start a new blackjack game with a bet
    StartGame { bet_amount: u64 },
    /// Hit - draw another card
    Hit,
    /// Stay - end turn and resolve game
    Stay,
}
