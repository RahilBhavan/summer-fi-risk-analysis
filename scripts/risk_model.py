"""Static stop-loss risk simulation for the August 5, 2024 hourly dataset."""

import argparse
from pathlib import Path
from typing import Literal

import pandas as pd

Protocol = Literal["AaveV3", "Morpho"]
Status = Literal["active", "safe", "sl_triggered", "liquidated"]


def validate_data(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        raise ValueError("DataFrame must contain at least one observation")
    required = {"Price_USD", "Gas_Gwei", "Hour_UTC"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"DataFrame missing required columns: {sorted(missing)}")
    validated = df.copy()
    for column in ("Price_USD", "Gas_Gwei"):
        validated[column] = pd.to_numeric(validated[column], errors="coerce")
        if validated[column].isna().any():
            raise ValueError(f"DataFrame column {column} contains malformed values")
    if (validated["Price_USD"] <= 0).any():
        raise ValueError("DataFrame prices must be greater than zero")
    if (validated["Gas_Gwei"] < 0).any():
        raise ValueError("DataFrame gas prices must be non-negative")
    return validated


class DeFiRiskModel:
    def __init__(self, initial_collateral: float, initial_debt: float,
                 protocol: Protocol = "AaveV3") -> None:
        if initial_collateral <= 0:
            raise ValueError("Collateral must be greater than zero")
        if initial_debt < 0:
            raise ValueError("Debt must be non-negative")
        self.collateral = initial_collateral
        self.debt = initial_debt
        self.protocol = protocol

        if protocol == "AaveV3":
            self.liquidation_threshold = 0.825
            self.liquidation_penalty = 0.05
        elif protocol == "Morpho":
            self.liquidation_threshold = 0.945
            self.liquidation_penalty = 0.01
        else:
            raise ValueError(f"Unsupported protocol: {protocol}")

    def calculate_ltv(self, price: float) -> float:
        if price <= 0:
            raise ValueError("Price must be greater than zero")
        return self.debt / (self.collateral * price)

    def is_liquidated(self, price: float) -> bool:
        return self.calculate_ltv(price) >= self.liquidation_threshold

    def estimate_slippage(self, price: float, gas_price: float) -> float:
        self.calculate_ltv(price)
        if gas_price < 0:
            raise ValueError("Gas price must be non-negative")
        base_slippage = 0.001
        stress_factor = (gas_price / 100.0) * 0.005
        return min(base_slippage + stress_factor, 0.05)

    def calculate_exit_value(self, price: float, gas_price: float,
                             status: Literal["liquidated", "sl_triggered", "safe"]) -> float:
        if price <= 0:
            raise ValueError("Price must be greater than zero")
        if gas_price < 0:
            raise ValueError("Gas price must be non-negative")
        collateral_value = self.collateral * price
        slippage = self.estimate_slippage(price, gas_price)
        gas_cost_usd = (gas_price * 1e-9) * 300000 * price

        if status == "liquidated":
            remaining = collateral_value - self.debt - self.debt * self.liquidation_penalty
        elif status == "sl_triggered":
            remaining = collateral_value * (1 - slippage) - self.debt - gas_cost_usd
        else:
            remaining = collateral_value - self.debt
        return max(remaining, 0)

    def simulate_step(self, price: float, gas_price: float, sl_trigger_ltv: float,
                      strategy: Literal["static"] = "static") -> Literal["safe", "sl_triggered", "liquidated"]:
        if strategy != "static":
            raise ValueError("Only the validated static strategy is supported")
        if not 0 < sl_trigger_ltv < self.liquidation_threshold:
            raise ValueError("Stop-loss LTV must be greater than zero and below liquidation threshold")
        if gas_price < 0:
            raise ValueError("Gas price must be non-negative")
        current_ltv = self.calculate_ltv(price)
        # Hourly observations cannot prove an automation exit preceded a breach.
        if current_ltv >= self.liquidation_threshold:
            return "liquidated"
        if current_ltv >= sl_trigger_ltv:
            return "sl_triggered"
        return "safe"


def run_backtest(df: pd.DataFrame, initial_collateral: float, initial_debt: float,
                 sl_trigger_ltv: float, strategy: Literal["static"] = "static",
                 protocol: Protocol = "AaveV3") -> dict[str, object]:
    df = validate_data(df)
    model = DeFiRiskModel(initial_collateral, initial_debt, protocol)
    status: Status = "active"
    exit_value = 0.0
    trigger_hour = None

    for _, row in df.iterrows():
        if status == "active":
            step_status = model.simulate_step(row["Price_USD"], row["Gas_Gwei"], sl_trigger_ltv, strategy)
            if step_status != "safe":
                status = step_status
                trigger_hour = row["Hour_UTC"]
                exit_value = model.calculate_exit_value(row["Price_USD"], row["Gas_Gwei"], status)

    if status == "active":
        exit_value = model.calculate_exit_value(df.iloc[-1]["Price_USD"], df.iloc[-1]["Gas_Gwei"], status)
    return {"strategy": strategy, "status": status, "trigger_hour": trigger_hour, "final_value": exit_value}


def parameter_sweep(df: pd.DataFrame, protocol: Protocol = "AaveV3") -> pd.DataFrame:
    df = validate_data(df)
    ltvs = [0.60, 0.65, 0.70, 0.75, 0.80]
    buffers = [0.02, 0.05, 0.08, 0.10, 0.12]
    rows = []
    initial_price = df.iloc[0]["Price_USD"]

    for ltv in ltvs:
        for buffer in buffers:
            model = DeFiRiskModel(1.0, initial_price * ltv, protocol)
            result = run_backtest(df, 1.0, initial_price * ltv,
                                  model.liquidation_threshold - buffer, protocol=protocol)
            rows.append({"Protocol": protocol, "Initial_LTV": ltv, "Buffer": buffer,
                         "Strategy": "static", "Status": result["status"],
                         "Trigger_Hour": result["trigger_hour"], "Final_Value_USD": result["final_value"]})
    return pd.DataFrame(rows)


def sweep_output_path() -> Path:
    return Path(__file__).resolve().parent.parent / "reports" / "sweep_results.csv"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Static risk simulator")
    parser.add_argument("--ltv", type=float, default=0.75)
    parser.add_argument("--buffer", type=float, default=0.05)
    parser.add_argument("--protocol", choices=["AaveV3", "Morpho"], default="AaveV3")
    parser.add_argument("--sweep", action="store_true")
    parser.add_argument("--combined-sweep", action="store_true")
    args = parser.parse_args()
    data_path = Path(__file__).resolve().parent.parent / "data" / "aug_5_crash_data.csv"
    df = pd.read_csv(data_path)

    if args.sweep or args.combined_sweep:
        protocols: list[Protocol] = ["AaveV3", "Morpho"] if args.combined_sweep else [args.protocol]
        output = pd.concat([parameter_sweep(df, protocol) for protocol in protocols], ignore_index=True)
        output_path = sweep_output_path()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output.to_csv(output_path, index=False)
        print(f"Results saved to {output_path}")
    else:
        model = DeFiRiskModel(1.0, df.iloc[0]["Price_USD"] * args.ltv, args.protocol)
        result = run_backtest(df, 1.0, model.debt,
                              model.liquidation_threshold - args.buffer,
                              protocol=args.protocol)
        print(f"[{args.protocol}] Status: {result['status']} | Exit Hour: "
              f"{result['trigger_hour']} | Equity: ${result['final_value']:.2f}")
