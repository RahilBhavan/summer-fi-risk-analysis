# Backtesting Report: The August 5, 2024 "Black Monday" Crash
## Prepared for Summer.fi Strategy Team

### Executive Summary
Our simulation of the August 5, 2024 crash (ETH -22% in 24h, Gas peak 710 Gwei) reveals a critical vulnerability in static Stop-Loss buffers. Positions with an initial LTV of 0.65+ using standard 3% or 5% buffers were **liquidated** before automation could execute. Only positions with a **10% buffer** or lower initial LTV (0.60) successfully exited via Stop-Loss.

### Simulation Results
| Initial LTV | Buffer | Result | Exit Hour (UTC) | Gas Cost (USD) |
| :--- | :--- | :--- | :--- | :--- |
| 0.70 | 3% | **LIQUIDATED** | 04:00 | $0 |
| 0.70 | 5% | **LIQUIDATED** | 04:00 | $0 |
| 0.70 | 10% | SUCCESS | 02:00 | $15.68 |
| 0.65 | 5% | **LIQUIDATED** | 05:00 | $0 |
| 0.60 | 5% | SUCCESS | 06:00 | $91.71 |

### Key Findings
1.  **Velocity of Volatility:** Between 03:00 and 04:00 UTC, ETH dropped from $2,690 to $2,450. This 9% drop in one hour "jumped" over 3% and 5% buffers, triggering liquidations before the automation could land a transaction in the next block.
2.  **The Gas Paradox:** By the time a 0.60 LTV position triggered at 06:00 UTC, gas had risen to 144 Gwei, costing the user **$91.71** (based on 300k gas units). While successful, the delay in execution (due to the tight buffer) increased the cost of exit.
3.  **Liquidation vs. Stop-Loss:** In the 0.65 LTV case, the liquidation at 05:00 UTC cost the user ~5% in penalties (~$10,000 on a $200k debt position), whereas a successful Stop-Loss at 04:00 UTC would have cost only $25 in gas.

### Recommendations for Summer.fi
1.  **Dynamic "Volatility Buffers":** Implement a feature that automatically widens the Stop-Loss trigger distance when 1-hour realized volatility exceeds a threshold (e.g., >5%).
2.  **Gas-Aware Triggers:** If gas prices surge >100 Gwei, the system should preemptively trigger Stop-Losses for positions within 2% of their buffer to avoid the "mempool race" against liquidators.
3.  **Institutional Safeguards:** For vaults >$1M, a mandatory 10% buffer should be recommended during high-gas environments.

---
*Analysis performed using Summer.fi Risk Simulation Framework (v1.0)*
