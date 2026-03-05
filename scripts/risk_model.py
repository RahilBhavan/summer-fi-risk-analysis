import pandas as pd
import numpy as np
import os

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
        else: # Default Morpho-style
            self.liquidation_threshold = 0.90
            self.liquidation_penalty = 0.01

    def calculate_ltv(self, price):
        """Calculates current Loan-to-Value (LTV) ratio."""
        if price <= 0:
            return float('inf')
        return self.debt / (self.collateral * price)

    def is_liquidated(self, price):
        """Checks if the position is eligible for liquidation."""
        return self.calculate_ltv(price) >= self.liquidation_threshold

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
            # Heuristic: If gas > 100 Gwei, lower the trigger LTV by 2% to act faster
            if gas_price > 100:
                effective_sl_trigger -= 0.02
        
        # 3. Check for SL trigger
        if current_ltv >= effective_sl_trigger:
            return "sl_triggered"
            
        return "safe"

def run_backtest(df, initial_collateral, initial_debt, sl_trigger_ltv, strategy="static"):
    """
    Runs the simulation over a dataframe of price and gas data.
    """
    model = DeFiRiskModel(initial_collateral, initial_debt)
    results = []
    
    status = "active"
    for _, row in df.iterrows():
        if status == "active":
            step_status = model.simulate_step(row['Price_USD'], row['Gas_Gwei'], sl_trigger_ltv, strategy)
            if step_status != "safe":
                status = step_status
        
        results.append(status)
    
    df[f'status_{strategy}'] = results
    return df

if __name__ == "__main__":
    # Load data
    data_path = os.path.join(os.path.dirname(__file__), '../data/aug_5_crash_data.csv')
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        
        # Parameters: High leverage position (80% LTV, close to 82.5% threshold)
        # Initial price $2910 -> $2328 debt for 1 ETH
        initial_price = df.iloc[0]['Price_USD']
        initial_collateral = 1.0
        initial_debt = initial_price * 0.80
        
        sl_trigger = 0.81 # Static SL at 81% LTV
        
        df = run_backtest(df, initial_collateral, initial_debt, sl_trigger, strategy="static")
        df = run_backtest(df, initial_collateral, initial_debt, sl_trigger, strategy="dynamic")
        
        print("Backtest Summary:")
        print(f"Static SL Status: {df['status_static'].iloc[-1]}")
        print(f"Dynamic SL Status: {df['status_dynamic'].iloc[-1]}")
        
        # Show where they triggered
        static_trigger = df[df['status_static'] == 'sl_triggered'].head(1)
        dynamic_trigger = df[df['status_dynamic'] == 'sl_triggered'].head(1)
        
        if not static_trigger.empty:
            print(f"Static SL triggered at: {static_trigger['Hour_UTC'].values[0]}")
        if not dynamic_trigger.empty:
            print(f"Dynamic SL triggered at: {dynamic_trigger['Hour_UTC'].values[0]}")
    else:
        print("Data file not found.")
