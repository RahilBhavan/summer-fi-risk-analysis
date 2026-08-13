# DeFi Risk Analysis: Stress-Test Decision Support

## Project Overview
This independent portfolio case study examines how automated risk controls can behave during a sharp Ethereum market move. It uses a compact, reproducible scenario to translate price and network conditions into decision support for buffer selection, escalation, and stakeholder communication.

The analysis compares lending-market scenarios associated with **Aave V3** and **Morpho**. These are illustrative scenarios, not claims about live protocol use or organizational work.

## Case Study: August 5, 2024 Market Stress
The model uses **24 hourly observations**:

- **ETH price:** 2,910 at the start, 2,120 at the trough (approximately a **27.1% intraday decline**), and 2,450 at the close (approximately a **15.8% close decline** from the start).
- **Network conditions:** Peak observed gas was **681.4 Gwei**.
- **Decision question:** How should a risk team evaluate stop-loss buffers when price movement, execution cost, and protocol assumptions interact?

## Methodology: Illustrative Heuristic Model
The workstream simplifies the problem to static analysis and a combined Aave V3/Morpho parameter sweep:

1. Inspect the supplied hourly price and gas observations.
2. Apply explicit assumptions for collateral, debt, loan-to-value thresholds, buffer levels, execution cost, and slippage.
3. Compare indicative outcomes across lending-market scenarios and buffer choices.
4. Synthesize recommendations, controls, trade-offs, and follow-up questions.

The model is **illustrative and heuristic**. It is not a forecast, a valuation, a liquidation simulator for live markets, or evidence of protocol performance. Results depend on the assumptions and should be independently reviewed before use.

## How to Run

### Prerequisites
Use Python 3.10+ and install the dependencies listed in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### Model Workstream
Run the risk-model script according to its available command-line options. The intended analysis is a static review with a combined Aave V3/Morpho sweep; inspect the script help for the current interface before running it:

```bash
python3 scripts/risk_model.py --combined-sweep
python3 scripts/risk_model.py --protocol AaveV3 --ltv 0.70 --buffer 0.05
python3 -m pytest tests
```

The notebook provides supplementary visual analysis:

```bash
jupyter notebook notebooks/aug5_analysis.ipynb
```

## Project Structure

- `data/`: Supplied hourly price and gas observations.
- `scripts/risk_model.py`: Heuristic risk-analysis model.
- `notebooks/`: Visual exploration and scenario analysis.
- `reports/`: Existing analysis outputs; interpret them alongside the assumptions and limitations above.
- `tests/`: Checks for the model logic.
- `web-showcase/`: Independent portfolio presentation.

## Portfolio Takeaways
This case study demonstrates trend analysis, recommendation synthesis, controls thinking, reproducibility, and clear communication of assumptions and limitations. The central recommendation is to treat buffer selection as a documented decision process: monitor trend and execution conditions, compare scenarios, record assumptions, and escalate when observed conditions exceed the model's scope.
