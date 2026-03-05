import pytest
from scripts.risk_model import DeFiRiskModel

def test_ltv_calculation():
    # Initial price $2000, 1 ETH collateral, $1000 debt
    model = DeFiRiskModel(initial_collateral=1.0, initial_debt=1000)
    assert model.calculate_ltv(2000) == 0.5
    assert model.calculate_ltv(1000) == 1.0
    assert model.calculate_ltv(500) == 2.0

def test_liquidation_trigger():
    # Aave V3 threshold is 0.825
    model = DeFiRiskModel(initial_collateral=1.0, initial_debt=825)
    assert model.is_liquidated(1000) == True
    assert model.is_liquidated(1001) == False

def test_static_stop_loss():
    model = DeFiRiskModel(initial_collateral=1.0, initial_debt=800)
    # Trigger at 0.81 LTV ($800 / $987.65)
    # Price $988 -> LTV = 800 / 988 = 0.809 (safe)
    # Price $987 -> LTV = 800 / 987 = 0.8105 (sl_triggered)
    assert model.simulate_step(price=988, gas_price=10, sl_trigger_ltv=0.81) == "safe"
    assert model.simulate_step(price=987, gas_price=10, sl_trigger_ltv=0.81) == "sl_triggered"

def test_dynamic_stop_loss_gas_aware():
    model = DeFiRiskModel(initial_collateral=1.0, initial_debt=800)
    # Trigger at 0.81 LTV. With high gas, it should trigger earlier (0.79)
    # Price $1010 -> LTV = 800 / 1010 = 0.792
    
    # 1. Low gas: should be safe at 0.792 LTV
    assert model.simulate_step(price=1010, gas_price=10, sl_trigger_ltv=0.81, strategy="dynamic") == "safe"
    
    # 2. High gas (>100): trigger shifts to 0.79. 0.792 > 0.79, so it triggers.
    assert model.simulate_step(price=1010, gas_price=150, sl_trigger_ltv=0.81, strategy="dynamic") == "sl_triggered"
