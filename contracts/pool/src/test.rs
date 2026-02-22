use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

use crate::{PoolContract, PoolContractClient};

#[allow(dead_code)]
struct TestEnv {
    env: Env,
    admin: Address,
    pool: PoolContractClient<'static>,
    token: TokenClient<'static>,
    token_sac: StellarAssetClient<'static>,
    pool_addr: Address,
}

fn setup_env() -> TestEnv {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Create token
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_sac = StellarAssetClient::new(&env, &token_id.address());

    // Register pool (roulette set separately to match deploy flow)
    let pool_id = env.register(PoolContract, (admin.clone(), token_id.address()));

    // Set roulette mock address for auth checks
    let roulette = Address::generate(&env);
    let pool_temp = PoolContractClient::new(&env, &pool_id);
    pool_temp.set_roulette(&roulette);

    // Mint tokens to admin for testing
    token_sac.mint(&admin, &10_000_000_000);

    // Leak env for static lifetime
    let env = unsafe { core::mem::transmute::<Env, Env>(env) };
    let pool = PoolContractClient::new(&env, &pool_id);
    let token = TokenClient::new(&env, &token_id.address());
    let token_sac = StellarAssetClient::new(&env, &token_id.address());

    TestEnv {
        env,
        admin,
        pool,
        token,
        token_sac,
        pool_addr: pool_id,
    }
}

#[test]
fn test_first_deposit_1_to_1() {
    let t = setup_env();

    t.pool.deposit(&t.admin, &1_000_000_000);

    assert_eq!(t.pool.get_pool_balance(), 1_000_000_000);
    assert_eq!(t.pool.get_total_shares(), 1_000_000_000);
    assert_eq!(t.pool.get_lp_shares(&t.admin), 1_000_000_000);
}

#[test]
fn test_proportional_deposit() {
    let t = setup_env();

    t.pool.deposit(&t.admin, &1_000);
    assert_eq!(t.pool.get_total_shares(), 1_000);

    t.pool.deposit(&t.admin, &500);
    assert_eq!(t.pool.get_total_shares(), 1_500);
    assert_eq!(t.pool.get_pool_balance(), 1_500);
    assert_eq!(t.pool.get_lp_shares(&t.admin), 1_500);
}

#[test]
fn test_withdraw() {
    let t = setup_env();

    t.pool.deposit(&t.admin, &1_000_000);

    t.pool.withdraw(&t.admin, &500_000);
    assert_eq!(t.pool.get_pool_balance(), 500_000);
    assert_eq!(t.pool.get_total_shares(), 500_000);
    assert_eq!(t.pool.get_lp_shares(&t.admin), 500_000);
}

#[test]
fn test_absorb_increases_share_price() {
    let t = setup_env();

    t.pool.deposit(&t.admin, &1_000_000);

    // Simulate: roulette transfers tokens to pool, then calls absorb
    // In tests we need to mint the absorbed amount to the pool contract
    t.token_sac.mint(&t.pool_addr, &100_000);
    t.pool.absorb(&100_000);

    assert_eq!(t.pool.get_pool_balance(), 1_100_000);
    assert_eq!(t.pool.get_total_shares(), 1_000_000);
    assert_eq!(t.pool.get_share_price(), 11_000_000);
}

#[test]
fn test_withdraw_after_absorb_gets_more() {
    let t = setup_env();

    t.pool.deposit(&t.admin, &1_000_000);

    // Simulate absorbed tokens
    t.token_sac.mint(&t.pool_addr, &200_000);
    t.pool.absorb(&200_000);

    // Withdraw all shares — should get 1_200_000
    t.pool.withdraw(&t.admin, &1_000_000);
    assert_eq!(t.pool.get_pool_balance(), 0);
    assert_eq!(t.pool.get_total_shares(), 0);
}

#[test]
fn test_max_bet() {
    let t = setup_env();

    t.pool.deposit(&t.admin, &10_000_000);

    // Max bet = 2% of pool = 200_000
    assert_eq!(t.pool.get_max_bet(), 200_000);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_deposit_zero_fails() {
    let t = setup_env();
    t.pool.deposit(&t.admin, &0);
}

#[test]
#[should_panic(expected = "insufficient shares")]
fn test_withdraw_too_many_shares_fails() {
    let t = setup_env();
    t.pool.deposit(&t.admin, &1_000);
    t.pool.withdraw(&t.admin, &2_000);
}
