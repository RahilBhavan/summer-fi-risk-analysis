# August 5, 2024 ETH Crash Backtest

## Scope
This report uses the 24 hourly observations in `data/aug_5_crash_data.csv` and the validated static stop-loss model. Results are reproducible with:

```bash
python3 scripts/risk_model.py --combined-sweep
python3 -m pytest
```

## Observed facts
- The dataset contains 24 hourly rows from 00:00 through 23:00 UTC.
- ETH price starts at $2,910, reaches a trough of $2,120, and closes at $2,450.
- Recorded gas reaches 681.4 Gwei.
- These are observations in the supplied CSV, not claims about minute-level execution or the broader market.

## Model assumptions
- AaveV3 uses a 0.825 liquidation threshold and 5% liquidation penalty.
- Morpho uses a 0.945 liquidation threshold and 1% liquidation penalty.
- The model uses one static stop-loss trigger: liquidation threshold minus the configured buffer.
- At each hourly observation, liquidation eligibility is evaluated before the configured stop-loss. Since the data is hourly, it cannot prove an automation exit occurred before an already-observed threshold breach; this conservative ordering keeps liquidation outcomes reachable.
- Exit value is a simplified estimate including modeled slippage and gas; it is not an execution record.

## Reproducible results
The generated sweep contains 25 static rows for each protocol (5 LTV values × 5 buffers × 1 static strategy), or 50 rows combined. AaveV3 has 21 `sl_triggered` and 4 `liquidated` rows. Morpho has 7 `active`, 12 `sl_triggered`, and 6 `liquidated` rows. Protocol identity is retained in every row and no dynamic-strategy rows are generated. Representative simulations and the complete matrix are in `reports/sweep_results.csv`.

## Recommendations
Use the sweep as a scenario-analysis input when selecting stop-loss buffers. Validate thresholds, transaction execution, and operational controls against current protocol configuration and finer-grained market and transaction data before operational use.

## Limitations
This is an hourly historical scenario model. It does not establish within-hour ordering, forecast prices, reproduce transaction execution, or provide production or client advice. No minute-level data or external performance claims are included.
