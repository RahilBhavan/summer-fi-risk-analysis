# Summer.fi Risk Analysis: Dynamic Stop-Loss Optimization

## Project Overview
This project performs a high-fidelity stress-test analysis of Summer.fi's automation features (Stop-Loss, Auto-Buy/Sell) during extreme market volatility. Specifically, we investigate the **"August 5, 2024 Flash Crash"** to determine how gas price spikes and liquidity depth affect the execution of automated safety triggers.

The goal is to provide a data-backed recommendation for **Optimal Stop-Loss Buffers** for institutional and retail users on Aave vs. Morpho.

## Case Study: August 5, 2024 ("Black Monday")
*   **ETH Price Action:** -22% drop ($2,923 -> ~$2,100) in <24 hours.
*   **Gas Environment:** Surged from <10 Gwei to **710 Gwei** (peak) and ~350 Gwei (average).
*   **Systemic Stress:** Aave v3 handled 59% of its total historical liquidation volume in this single window.
*   **The Problem:** Standard static Stop-Loss triggers may fail if the cost of execution (gas + slippage) exceeds the remaining collateral value, or if network congestion delays the transaction until the position is already underwater.

## Methodology: "Dynamic Risk Simulation"
We employ a Gauntlet-style simulation framework:
1.  **Data Ingestion:** Historical ETH/USD price data (1-minute intervals) and Etherscan gas price data for August 5, 2024.
2.  **Protocol Modeling:**
    *   **Aave v3:** Modeling liquidation thresholds and penalty (5%).
    *   **Morpho:** Modeling the specific vault/market parameters.
3.  **Automation Simulation:**
    *   **Static Triggers:** Simulation of 10%, 15%, and 20% Stop-Loss buffers.
    *   **Dynamic Triggers:** Modeling a "Gas-Aware" Stop-Loss that adjusts the trigger LTV based on real-time network congestion and slippage estimates.
4.  **Backtesting:** Comparing "Capital Saved" vs. "Liquidation Occurred" for both strategies.

## Project Structure
*   `data/`: Historical price and gas data (CSV/JSON).
*   `scripts/`: Python models for simulation and backtesting.
*   `notebooks/`: Exploratory Data Analysis (EDA) and visualization.
*   `reports/`: Final Consulting PDF and executive summary.

## How to Run
(Instructions to follow as scripts are developed)
