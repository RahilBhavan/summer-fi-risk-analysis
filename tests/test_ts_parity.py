"""The TypeScript model behind the web showcase must agree with the Python model.

The page's data.json is also checked against the CSV, so both models see the same inputs.
"""
import json
import shutil
import subprocess
from pathlib import Path

import pandas as pd
import pytest

from scripts.risk_model import DeFiRiskModel, run_backtest

ROOT = Path(__file__).resolve().parent.parent
DATA = pd.read_csv(ROOT / "data" / "aug_5_crash_data.csv")


def _cases():
    start = float(DATA.iloc[0]["Price_USD"])
    cases = []
    for protocol in ("AaveV3", "Morpho"):
        for ltv in (0.60, 0.65, 0.70, 0.75, 0.80):
            for buffer in (0.02, 0.05, 0.08, 0.10, 0.12):
                cases.append({"protocol": protocol, "collateral": 1.0, "debt": start * ltv, "buffer": buffer})
    # Off-grid inputs: other position sizes, a tiny buffer and a never-triggered low LTV.
    cases += [
        {"protocol": "AaveV3", "collateral": 2.5, "debt": 4000.0, "buffer": 0.033},
        {"protocol": "Morpho", "collateral": 10.0, "debt": 21000.0, "buffer": 0.001},
        {"protocol": "AaveV3", "collateral": 1.0, "debt": 100.0, "buffer": 0.05},
        {"protocol": "Morpho", "collateral": 0.4, "debt": 1000.0, "buffer": 0.2},
    ]
    return cases


def test_web_data_matches_csv():
    web = json.loads((ROOT / "web-showcase" / "src" / "app" / "data.json").read_text())
    csv = DATA.to_dict("records")
    assert [(r["Hour_UTC"], r["Price_USD"], r["Gas_Gwei"]) for r in web] == [
        (r["Hour_UTC"], r["Price_USD"], r["Gas_Gwei"]) for r in csv
    ]


def test_typescript_model_matches_python_model():
    node = shutil.which("node")
    assert node, "Node 22.18 or newer is required for this test"
    cases = _cases()
    proc = subprocess.run(
        [node, "--no-warnings", str(ROOT / "scripts" / "ts_model_cases.mjs")],
        input=json.dumps(cases), capture_output=True, text=True, check=True, cwd=ROOT,
    )
    ts = json.loads(proc.stdout)
    assert len(ts) == len(cases)
    for case, got in zip(cases, ts):
        model = DeFiRiskModel(case["collateral"], case["debt"], case["protocol"])
        py = run_backtest(DATA, case["collateral"], case["debt"],
                          model.liquidation_threshold - case["buffer"], protocol=case["protocol"])
        label = f"case {case}"
        assert got["status"] == py["status"], label
        assert got["triggerHour"] == py["trigger_hour"], label
        assert got["finalValue"] == pytest.approx(py["final_value"], rel=1e-9, abs=1e-6), label
        last = DATA.iloc[-1]
        unprotected = model.calculate_exit_value(last["Price_USD"], last["Gas_Gwei"], "safe")
        assert got["endOfDayUnprotectedValue"] == pytest.approx(unprotected, rel=1e-9, abs=1e-6), label
