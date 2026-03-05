# Summer.fi Risk Analysis: Dynamic Stop-Loss Optimization
**Whitepaper & Technical Overview**

## 1. Project Goal
The primary goal of this project is to **quantify the reliability of DeFi automation features** during extreme market stress. Specifically, we aim to move beyond "theoretical safety" by simulating the execution of Stop-Loss triggers during the **August 5, 2024 "Black Monday" crash**. 

By the end of this analysis, we provide data-backed recommendations on:
*   **Optimal Buffer Sizes:** What is the "Safe Zone" for LTV/Buffer combinations?
*   **Dynamic Triggers:** Can "Gas-Aware" logic preserve more user capital than static triggers?
*   **Protocol Resilience:** How do different liquidation structures (Aave V3 vs. Morpho) impact user outcomes?

---

## 2. Why This Project Matters (The "Why")
In DeFi, automation (Stop-Loss, Auto-Buy/Sell) is a critical safety net. However, most users set these triggers based on **price alone**, ignoring two systemic "killers":
1.  **Price Velocity:** When prices drop 10% in a single hour, they often "jump" over a user's Stop-Loss trigger, landing straight into the liquidation zone.
2.  **The Gas Paradox:** During a crash, gas prices spike (700+ Gwei). If a Stop-Loss transaction isn't priced aggressively, it sits in the mempool while liquidators (who pay any price to win) seize the collateral.

**The Stake:** On August 5th, Aave V3 handled 59% of its total historical liquidation volume. If our automation fails during these windows, users lose not just their position, but an additional **5% liquidation penalty**.

---

## 3. How It Works (The "How")
We utilize a **Gauntlet-style simulation framework** that models the interaction between market data and protocol logic.

### A. Data-Driven Backtesting
We use high-resolution data from the August 5th crash:
*   **Price Ingestion:** 1-minute ETH/USD price action.
*   **Network Stress:** Real-time Etherscan gas price spikes.

### B. The Simulation Engine (`risk_model.py`)
Our engine simulates the lifecycle of a vault through every hour of the crash:
1.  **LTV Tracking:** Continuously calculates the Loan-to-Value ratio based on fluctuating prices.
2.  **Slippage Heuristic:** We model "Market Stress Slippage." As gas prices rise (indicating congestion), the engine increases the expected slippage (up to 5%), reflecting the difficulty of executing large trades in a panicked market.
3.  **Liquidation vs. Stop-Loss Logic:** 
    *   If LTV > Liquidation Threshold: **Total Failure** (Position Liquidated + 5% Penalty).
    *   If LTV > SL Trigger: **Successful Exit** (Position Closed - Gas - Slippage).

### C. Protocol Diversity
The model isn't generic; it adapts to specific protocol architectures:
*   **Aave V3:** 0.825 Liquidation Threshold | 5% Penalty.
*   **Morpho Blue:** 0.945 LLTV | 1% Penalty.

---

## 4. Key Innovation: Dynamic (Gas-Aware) Triggers
The project explores a **"Dynamic Strategy"** where the Stop-Loss trigger is not static. 
*   **Logic:** If the system detects gas > 150 Gwei, it preemptively lowers the SL trigger by 3%.
*   **Result:** This allows the automation to "front-run" the price crash before the network becomes too congested to land a transaction, effectively saving positions that would otherwise be liquidated.

---

## 5. Deliverables & Insights
The project provides three layers of analysis:
1.  **The Engine:** A reusable Python framework for testing any historical crash data.
2.  **The Heatmap:** A visual matrix (`notebooks/aug5_analysis.ipynb`) showing the "Dead Zone" (Red) where liquidations occur and the "Safe Zone" (Green) where buffers held.
3.  **The Sweep Results:** A granular CSV (`reports/sweep_results.csv`) quantifying the exact USD equity preserved by different strategies.

---

## 6. Conclusion
This project transforms "Risk Management" from a marketing term into a rigorous, verifiable engineering standard. By understanding the failure points of August 5th, Summer.fi can build automation that doesn't just work in the "happy path," but remains resilient during the most volatile days in crypto history.
