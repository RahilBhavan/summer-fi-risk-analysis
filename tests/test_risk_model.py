import pandas as pd
import pytest

from scripts.risk_model import DeFiRiskModel, parameter_sweep, run_backtest, sweep_output_path, validate_data


@pytest.fixture
def crash_data():
    return pd.read_csv("data/aug_5_crash_data.csv")


def test_dataset_stats(crash_data):
    assert len(crash_data) == 24
    assert crash_data.iloc[0].Price_USD == 2910
    assert crash_data.Price_USD.min() == 2120
    assert crash_data.iloc[-1].Price_USD == 2450
    assert crash_data.Gas_Gwei.max() == 681.4


def test_protocol_parameters():
    aave = DeFiRiskModel(1, 1000, "AaveV3")
    morpho = DeFiRiskModel(1, 1000, "Morpho")
    assert (aave.liquidation_threshold, aave.liquidation_penalty) == (0.825, 0.05)
    assert (morpho.liquidation_threshold, morpho.liquidation_penalty) == (0.945, 0.01)


def test_ltv_and_liquidation():
    model = DeFiRiskModel(1, 800, "AaveV3")
    assert model.calculate_ltv(1000) == pytest.approx(0.8)
    assert model.is_liquidated(1000) is False
    assert model.is_liquidated(950) is True


def test_liquidation_precedes_stop_loss_on_same_observation():
    model = DeFiRiskModel(1, 800, "AaveV3")
    assert model.simulate_step(1000, 10, 0.80) == "sl_triggered"
    assert model.simulate_step(950, 10, 0.80) == "liquidated"


def test_earlier_buffer_exit_precedes_later_liquidation(crash_data):
    model = DeFiRiskModel(1, 2910 * 0.60, "AaveV3")
    result = run_backtest(crash_data, 1, model.debt,
                          model.liquidation_threshold - 0.05,
                          protocol="AaveV3")
    assert result["status"] == "sl_triggered"
    assert result["trigger_hour"] == "06:00"


def test_dynamic_strategy_is_not_validated():
    model = DeFiRiskModel(1, 800)
    with pytest.raises(ValueError):
        model.simulate_step(1010, 150, 0.81, strategy="dynamic")


def test_representative_backtests(crash_data):
    for protocol in ("AaveV3", "Morpho"):
        model = DeFiRiskModel(1, 2910 * 0.70, protocol)
        result = run_backtest(crash_data, 1, model.debt,
                              model.liquidation_threshold - 0.05,
                              protocol=protocol)
        expected = {
            "AaveV3": ("04:00", "liquidated", 311.15),
            "Morpho": ("06:00", "liquidated", 62.63),
        }[protocol]
        assert result["strategy"] == "static"
        assert result["status"] == expected[1]
        assert result["trigger_hour"] == expected[0]
        assert result["final_value"] == pytest.approx(expected[2])


def test_static_sweep_dimensions(crash_data):
    assert len(parameter_sweep(crash_data, "AaveV3")) == 25
    assert len(parameter_sweep(crash_data, "Morpho")) == 25
    assert sum(len(parameter_sweep(crash_data, protocol)) for protocol in ("AaveV3", "Morpho")) == 50


def test_sweep_output_path_is_repo_relative():
    assert sweep_output_path().name == "sweep_results.csv"
    assert sweep_output_path().parent.name == "reports"


def test_numeric_string_conversion_and_input_errors(crash_data):
    strings = crash_data.copy()
    strings["Price_USD"] = strings["Price_USD"].astype(str)
    strings["Gas_Gwei"] = strings["Gas_Gwei"].astype(str)
    validated = validate_data(strings)
    assert validated["Price_USD"].dtype.kind in "fi"
    assert validated["Gas_Gwei"].dtype.kind in "fi"
    with pytest.raises(ValueError, match="malformed"):
        validate_data(strings.assign(Price_USD="not-a-number"))


def test_invalid_inputs(crash_data):
    with pytest.raises(ValueError, match="Collateral"):
        DeFiRiskModel(0, 1)
    with pytest.raises(ValueError, match="Debt"):
        DeFiRiskModel(1, -1)
    with pytest.raises(ValueError, match="Price"):
        DeFiRiskModel(1, 1).calculate_ltv(0)
    with pytest.raises(ValueError, match="Gas"):
        DeFiRiskModel(1, 1).estimate_slippage(1, -1)
    with pytest.raises(ValueError, match="Stop-loss"):
        DeFiRiskModel(1, 1).simulate_step(1, 1, 0)
    with pytest.raises(ValueError, match="at least one"):
        run_backtest(crash_data.iloc[0:0], 1, 1, 0.5)
    with pytest.raises(ValueError, match="required columns"):
        run_backtest(crash_data[["Price_USD"]], 1, 1, 0.5)
