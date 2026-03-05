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
        self.liquidation_threshold = 0.825  # Aave V3 ETH default
        self.liquidation_penalty = 0.05     # 5%
        
    def calculate_ltv(self, price):
        return self.debt / (self.collateral * price)

    def is_liquidated(self, price):
        return self.calculate_ltv(price) >= self.liquidation_threshold

class Backtester:
    def __init__(self, df_prices_gas):
        self.data = df_prices_gas

    def run_simulation(self, initial_ltv=0.65, stop_loss_buffer=0.05, is_dynamic=False, gas_units=300000):
        """
        initial_ltv: starting health of the position
        stop_loss_buffer: distance from liquidation threshold
        """
        model = DeFiRiskModel(initial_collateral=100, initial_debt=200000, protocol="AaveV3")
        initial_price = self.data.iloc[0]['Price_USD']
        model.collateral = (model.debt / initial_ltv) / initial_price
        
        trigger_ltv = model.liquidation_threshold - stop_loss_buffer
        
        status = "Active"
        exit_price = None
        exit_hour = None
        total_gas_cost_usd = 0
        
        for index, row in self.data.iterrows():
            current_price = row['Price_USD']
            current_gas = row['Gas_Gwei']
            current_ltv = model.calculate_ltv(current_price)
            
            # Check for Liquidation first (System Failure)
            if model.is_liquidated(current_price):
                status = "LIQUIDATED"
                exit_price = current_price
                exit_hour = row['Hour_UTC']
                break
                
            # Dynamic adjustment (Example: move trigger earlier if gas is high)
            effective_trigger = trigger_ltv
            if is_dynamic:
                # Heuristic: trigger 0.5% earlier for every 50 gwei above 50
                if current_gas > 50:
                    gas_adjustment = ((current_gas - 50) / 50) * 0.005
                    effective_trigger = trigger_ltv - gas_adjustment
            
            # Check for Stop-Loss Trigger (Success)
            if current_ltv >= effective_trigger:
                status = "STOP_LOSS_SUCCESS"
                exit_price = current_price
                exit_hour = row['Hour_UTC']
                total_gas_cost_usd = (current_gas * 1e-9) * gas_units * current_price
                break
        
        return {
            "Status": status,
            "Exit_Hour": exit_hour,
            "Exit_Price": exit_price,
            "Gas_Cost_USD": round(total_gas_cost_usd, 2),
            "Strategy": "Dynamic" if is_dynamic else "Static",
            "Initial_LTV": initial_ltv,
            "Buffer": stop_loss_buffer
        }

if __name__ == "__main__":
    data_path = 'projects/summer-fi-risk-analysis/data/aug_5_crash_data.csv'
    if os.path.exists(data_path):
        data = pd.read_csv(data_path)
        backtester = Backtester(data)
        
        print(f"{'Strategy':<10} | {'Buffer':<6} | {'Init LTV':<8} | {'Status':<18} | {'Hour':<6} | {'Gas USD'}")
        print("-" * 80)
        
        for ltv in [0.60, 0.65, 0.70]:
            for buffer in [0.03, 0.05, 0.10]:
                for dynamic in [False, True]:
                    res = backtester.run_simulation(initial_ltv=ltv, stop_loss_buffer=buffer, is_dynamic=dynamic)
                    strat_name = "Dynamic" if dynamic else "Static"
                    print(f"{strat_name:<10} | {buffer:<6.2f} | {ltv:<8.2f} | {res['Status']:<18} | {res['Exit_Hour'] or 'N/A':<6} | ${res['Gas_Cost_USD']}")
    else:
        print(f"Data not found at {data_path}")
