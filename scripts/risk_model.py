import pandas as pd
import numpy as np
import os
import argparse

"""
Summer.fi Risk Simulation: August 5, 2024 Backtest
-------------------------------------------------
Objective: Compare static vs. dynamic (gas-aware) stop-loss triggers.
"""

class DeFiRiskModel:
    def __init__(self, initial_collateral, initial_debt, protocol="AaveV3"):
        self.collateral = initial_collateral
        self.debt = initial_debt
        self.protocol = protocol
        
        # Protocol-specific parameters
        if protocol == "AaveV3":
            self.liquidation_threshold = 0.825  # ETH default
            self.liquidation_penalty = 0.05     # 5%
        elif protocol == "Morpho":
            # Example Morpho Blue LLTV for ETH/USDC
            self.liquidation_threshold = 0.945
            self.liquidation_penalty = 0.01     # 1%
        else: # Default/Generic
            self.liquidation_threshold = 0.85
            self.liquidation_penalty = 0.05

    def calculate_ltv(self, price):
        """Calculates current Loan-to-Value (LTV) ratio."""
        if price <= 0:
            return float('inf')
        return self.debt / (self.collateral * price)

    def is_liquidated(self, price):
        """Checks if the position is eligible for liquidation."""
        return self.calculate_ltv(price) >= self.liquidation_threshold

    def estimate_slippage(self, price, gas_price):
        """
        Heuristic for slippage based on market stress (gas as a proxy).
        In high gas (congested) markets, liquidity is usually thinner or more expensive.
        """
        base_slippage = 0.001 # 0.1% baseline
        stress_factor = (gas_price / 100.0) * 0.005 # +0.5% for every 100 gwei
        return min(base_slippage + stress_factor, 0.05) # Cap at 5%

    def calculate_exit_value(self, price, gas_price, status):
        """
        Calculates the remaining capital (collateral value - debt - costs).
        """
        collateral_value = self.collateral * price
        slippage = self.estimate_slippage(price, gas_price)
        
        # Gas units: 300k for SL execution, liquidators pay more but penalty covers it
        gas_cost_usd = (gas_price * 1e-9) * 300000 * price 

        if status == "liquidated":
            # Penalty is taken from the collateral value
            penalty_amount = self.debt * self.liquidation_penalty
            remaining = collateral_value - self.debt - penalty_amount
        elif status == "sl_triggered":
            # SL sells collateral to pay debt, subject to slippage and gas
            remaining = (collateral_value * (1 - slippage)) - self.debt - gas_cost_usd
        else:
            remaining = collateral_value - self.debt
            
        return max(remaining, 0)

    def simulate_step(self, price, gas_price, sl_trigger_ltv, strategy="static"):
        """
        Simulates one time step.
        Returns: ('liquidated', 'sl_triggered', 'safe')
        """
        current_ltv = self.calculate_ltv(price)
        
        # 1. Check for liquidation first (worst case)
        if current_ltv >= self.liquidation_threshold:
            return "liquidated"
        
        # 2. Dynamic SL adjustment: trigger earlier if gas is high
        effective_sl_trigger = sl_trigger_ltv
        if strategy == "dynamic":
            # If gas > 150 Gwei, lower the trigger LTV by 3% to stay ahead of crash
            if gas_price > 150:
                effective_sl_trigger -= 0.03
        
        # 3. Check for SL trigger
        if current_ltv >= effective_sl_trigger:
            return "sl_triggered"
            
        return "safe"

def run_backtest(df, initial_collateral, initial_debt, sl_trigger_ltv, strategy="static", protocol="AaveV3"):
    model = DeFiRiskModel(initial_collateral, initial_debt, protocol)
    results = []
    
    status = "active"
    exit_value = 0
    trigger_hour = None
    
    for _, row in df.iterrows():
        if status == "active":
            step_status = model.simulate_step(row['Price_USD'], row['Gas_Gwei'], sl_trigger_ltv, strategy)
            if step_status != "safe":
                status = step_status
                trigger_hour = row['Hour_UTC']
                exit_value = model.calculate_exit_value(row['Price_USD'], row['Gas_Gwei'], status)
        
        results.append(status)
    
    return {
        "strategy": strategy,
        "status": status,
        "trigger_hour": trigger_hour,
        "final_value": exit_value if status != "active" else model.calculate_exit_value(df.iloc[-1]['Price_USD'], df.iloc[-1]['Gas_Gwei'], "active")
    }

def parameter_sweep(df, protocol="AaveV3"):
    """Runs a matrix of simulations for different LTVs and Buffers."""
    ltvs = [0.60, 0.65, 0.70, 0.75, 0.80]
    buffers = [0.02, 0.05, 0.08, 0.10, 0.12]
    
    sweep_results = []
    initial_price = df.iloc[0]['Price_USD']
    
    for ltv in ltvs:
        for buffer in buffers:
            initial_collateral = 1.0
            initial_debt = initial_price * ltv
            
            # SL Trigger = Liquidation Threshold - Buffer
            model_dummy = DeFiRiskModel(initial_collateral, initial_debt, protocol)
            sl_trigger = model_dummy.liquidation_threshold - buffer
            
            for strategy in ["static", "dynamic"]:
                res = run_backtest(df, initial_collateral, initial_debt, sl_trigger, strategy, protocol)
                sweep_results.append({
                    "Protocol": protocol,
                    "Initial_LTV": ltv,
                    "Buffer": buffer,
                    "Strategy": strategy,
                    "Status": res['status'],
                    "Trigger_Hour": res['trigger_hour'],
                    "Final_Value_USD": res['final_value']
                })
    
    return pd.DataFrame(sweep_results)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Summer.fi Risk Simulator")
    parser.add_argument("--ltv", type=float, default=0.75, help="Initial LTV (e.g. 0.75)")
    parser.add_argument("--buffer", type=float, default=0.05, help="SL Buffer (e.g. 0.05)")
    parser.add_argument("--protocol", type=str, default="AaveV3", choices=["AaveV3", "Morpho"], help="Protocol selection")
    parser.add_argument("--sweep", action="store_true", help="Run full parameter sweep and save to CSV")
    
    args = parser.parse_args()

    data_path = os.path.join(os.path.dirname(__file__), '../data/aug_5_crash_data.csv')
    if not os.path.exists(data_path):
        print("Data file not found.")
        exit(1)
        
    df = pd.read_csv(data_path)
    
    if args.sweep:
        print(f"Running parameter sweep for {args.protocol}...")
        results_df = parameter_sweep(df, args.protocol)
        results_df.to_csv("reports/sweep_results.csv", index=False)
        print("Results saved to reports/sweep_results.csv")
    else:
        initial_price = df.iloc[0]['Price_USD']
        initial_collateral = 1.0
        initial_debt = initial_price * args.ltv
        
        # Calculate trigger
        model_dummy = DeFiRiskModel(initial_collateral, initial_debt, args.protocol)
        sl_trigger = model_dummy.liquidation_threshold - args.buffer
        
        print(f"Running simulation: {args.protocol} | LTV: {args.ltv} | Buffer: {args.buffer}")
        for strategy in ["static", "dynamic"]:
            res = run_backtest(df, initial_collateral, initial_debt, sl_trigger, strategy, args.protocol)
            print(f"[{strategy.upper()}] Status: {res['status']} | Exit Hour: {res['trigger_hour']} | Equity: ${res['final_value']:.2f}")
