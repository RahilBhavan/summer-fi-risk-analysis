export interface MarketData {
  Hour_UTC: string;
  Price_USD: number;
  Gas_Gwei: number;
}

export type Protocol = 'AaveV3' | 'Morpho';
export type SimulationStatus = 'liquidated' | 'sl_triggered' | 'active';

export interface SimulationResult {
  protocol: Protocol;
  status: SimulationStatus;
  triggerHour: string | null;
  finalValue: number;
  endOfDayUnprotectedValue: number;
  history: Array<{ hour: string; ltv: number; price: number; gas: number; slippage: number; status: SimulationStatus }>;
}

const PARAMETERS: Record<Protocol, { liquidationThreshold: number; liquidationPenalty: number }> = {
  AaveV3: { liquidationThreshold: 0.825, liquidationPenalty: 0.05 },
  Morpho: { liquidationThreshold: 0.945, liquidationPenalty: 0.01 },
};

export class DeFiRiskModel {
  private readonly collateral: number;
  private readonly debt: number;
  private readonly liquidationThreshold: number;
  private readonly liquidationPenalty: number;
  private readonly protocol: Protocol;

  constructor(initialCollateral: number, initialDebt: number, protocol: Protocol) {
    if (!Number.isFinite(initialCollateral) || initialCollateral <= 0) throw new Error('Collateral must be positive.');
    if (!Number.isFinite(initialDebt) || initialDebt < 0) throw new Error('Debt must be non-negative.');
    if (!(protocol in PARAMETERS)) throw new Error('Unsupported protocol.');
    this.collateral = initialCollateral;
    this.debt = initialDebt;
    this.protocol = protocol;
    this.liquidationThreshold = PARAMETERS[protocol].liquidationThreshold;
    this.liquidationPenalty = PARAMETERS[protocol].liquidationPenalty;
  }

  calculateLTV(price: number): number {
    if (!Number.isFinite(price) || price <= 0) throw new Error('Price must be positive.');
    return this.debt / (this.collateral * price);
  }

  private estimateSlippage(gasPrice: number): number {
    return Math.min(0.001 + (gasPrice / 100) * 0.005, 0.05);
  }

  private exitValue(price: number, gasPrice: number, status: SimulationStatus): number {
    const collateralValue = this.collateral * price;
    if (status === 'liquidated') return Math.max(collateralValue - this.debt - this.debt * this.liquidationPenalty, 0);
    if (status === 'sl_triggered') {
      const gasCostUsd = gasPrice * 1e-9 * 300000 * price;
      return Math.max(collateralValue * (1 - this.estimateSlippage(gasPrice)) - this.debt - gasCostUsd, 0);
    }
    return Math.max(collateralValue - this.debt, 0);
  }

  simulate(data: MarketData[], slTriggerBuffer: number): SimulationResult {
    if (!Array.isArray(data) || data.length === 0) throw new Error('Market data must be non-empty.');
    if (!Number.isFinite(slTriggerBuffer) || slTriggerBuffer <= 0 || slTriggerBuffer >= this.liquidationThreshold) throw new Error('Buffer must be sensible.');
    const threshold = this.liquidationThreshold - slTriggerBuffer;
    let status: SimulationStatus = 'active';
    let triggerHour: string | null = null;
    const history: SimulationResult['history'] = [];
    for (const step of data) {
      if (!Number.isFinite(step.Price_USD) || step.Price_USD <= 0 || !Number.isFinite(step.Gas_Gwei) || step.Gas_Gwei < 0) throw new Error('Market data contains invalid values.');
      const ltv = this.calculateLTV(step.Price_USD);
      if (status === 'active') {
        // Conservative hourly ordering: an observed liquidation breach wins over stop-loss.
        if (ltv >= this.liquidationThreshold) { status = 'liquidated'; triggerHour = step.Hour_UTC; }
        else if (ltv >= threshold) { status = 'sl_triggered'; triggerHour = step.Hour_UTC; }
      }
      history.push({ hour: step.Hour_UTC, ltv, price: step.Price_USD, gas: step.Gas_Gwei, slippage: this.estimateSlippage(step.Gas_Gwei), status });
    }
    const exit = triggerHour ? data.find((step) => step.Hour_UTC === triggerHour) ?? data[data.length - 1] : data[data.length - 1];
    const end = data[data.length - 1];
    return { protocol: this.protocol, status, triggerHour, finalValue: this.exitValue(exit.Price_USD, exit.Gas_Gwei, status), endOfDayUnprotectedValue: this.exitValue(end.Price_USD, end.Gas_Gwei, 'active'), history };
  }
}
