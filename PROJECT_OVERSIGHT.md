# DeFi Risk Analysis: Project Oversight
**Independent portfolio case study**

## Project Goal
Build a reproducible decision-support analysis for evaluating automated risk controls during a sharp market move. The deliverable should help a reviewer understand the evidence, assumptions, trade-offs, recommended controls, and limits of the analysis without presenting an illustrative model as production research.

## Why This Matters
Risk decisions depend on more than a headline price change. A fast decline can coincide with higher execution costs and changing liquidity conditions. A concise scenario analysis can help stakeholders compare buffer choices, identify escalation points, and communicate what is known versus assumed.

## How the Analysis Works
The workstream uses 24 hourly observations from the supplied scenario: ETH price starts at 2,910, reaches a 2,120 trough (approximately 27.1% intraday decline), and closes at 2,450 (approximately 15.8% below the start). Peak observed gas is 681.4 Gwei.

The model applies explicit collateral, debt, loan-to-value, buffer, gas-cost, and slippage assumptions. Aave V3 and Morpho are treated as lending-market scenarios for comparison. The analysis is static and heuristic; it does not establish live-market behavior, protocol outcomes, or execution reliability.

## Deliverables
1. **Evidence summary:** A concise account of price and gas trends, including the observed start, trough, close, and peak gas values.
2. **Scenario comparison:** A combined Aave V3/Morpho sweep across documented parameter choices.
3. **Recommendation synthesis:** Practical buffer, monitoring, review, and escalation considerations tied to the assumptions.
4. **Controls record:** Clear inputs, reproducible steps, checks, and limitations so another reviewer can challenge or rerun the work.
5. **Stakeholder communication:** An executive-ready narrative that separates observed facts, model outputs, judgments, and open questions.

## Scope and Limitations
This is an independent portfolio exercise, not an organizational engagement or production implementation. The heuristic model does not replace protocol documentation, live data, transaction-level analysis, liquidity research, or independent risk review.
