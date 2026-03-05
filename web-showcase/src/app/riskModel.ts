export interface MarketData {
  Hour_UTC: string;
  Price_USD: number;
  Gas_Gwei: number;
}

export interface SimulationResult {
  strategy: 'static' | 'dynamic';
  status: 'liquidated' | 'sl_triggered' | 'active';
  triggerHour: string | null;
  finalValue: number;
  history: Array<{
    hour: string;
    ltv: number;
    status: 'active' | 'liquidated' | 'sl_triggered';
  }>;
}

export class DeFiRiskModel {
  private collateral: number;
  private debt: number;
  private liquidationThreshold: number;
  private liquidationPenalty: number;

  constructor(initialCollateral: number, initialDebt: number, protocol = 'AaveV3') {
    this.collateral = initialCollateral;
    this.debt = initialDebt;
    
    if (protocol === 'AaveV3') {
      this.liquidationThreshold = 0.825;
      this.liquidationPenalty = 0.05;
    } else {
      this.liquidationThreshold = 0.945;
      this.liquidationPenalty = 0.01;
    }
  }

  calculateLTV(price: number): number {
    return price <= 0 ? Infinity : this.debt / (this.collateral * price);
  }

  private estimateSlippage(price: number, gasPrice: number): number {
    const baseSlippage = 0.001;
    const stressFactor = (gasPrice / 100.0) * 0.005;
    return Math.min(baseSlippage + stressFactor, 0.05);
  }

  calculateExitValue(price: number, gasPrice: number, status: 'liquidated' | 'sl_triggered' | 'active'): number {
    const collateralValue = this.collateral * price;
    const slippage = this.estimateSlippage(price, gasPrice);
    const gasCostUsd = (gasPrice * 1e-9) * 300000 * price;

    if (status === 'liquidated') {
      const penaltyAmount = this.debt * this.liquidationPenalty;
      return Math.max(collateralValue - this.debt - penaltyAmount, 0);
    } else if (status === 'sl_triggered') {
      return Math.max((collateralValue * (1 - slippage)) - this.debt - gasCostUsd, 0);
    }
    return Math.max(collateralValue - this.debt, 0);
  }

  simulate(data: MarketData[], slTriggerBuffer: number, strategy: 'static' | 'dynamic' = 'static'): SimulationResult {
    let status: 'active' | 'liquidated' | 'sl_triggered' = 'active';
    let triggerHour: string | null = null;
    const history: SimulationResult['history'] = [];

    const slTriggerLtv = this.liquidationThreshold - slTriggerBuffer;

    for (const step of data) {
      const currentLtv = this.calculateLTV(step.Price_USD);
      
      if (status === 'active') {
        if (currentLtv >= this.liquidationThreshold) {
          status = 'liquidated';
          triggerHour = step.Hour_UTC;
        } else {
          let effectiveSlTrigger = slTriggerLtv;
          if (strategy === 'dynamic' && step.Gas_Gwei > 150) {
            effectiveSlTrigger -= 0.03;
          }

          if (currentLtv >= effectiveSlTrigger) {
            status = 'sl_triggered';
            triggerHour = step.Hour_UTC;
          }
        }
      }

      history.push({
        hour: step.Hour_UTC,
        ltv: currentLtv,
        status: status
      });
    }

    const lastStep = data[data.length - 1];
    const finalPrice = triggerHour ? data.find(d => d.Hour_UTC === triggerHour)!.Price_USD : lastStep.Price_USD;
    const finalGas = triggerHour ? data.find(d => d.Hour_UTC === triggerHour)!.Gas_Gwei : lastStep.Gas_Gwei;

    return {
      strategy,
      status,
      triggerHour,
      finalValue: this.calculateExitValue(finalPrice, finalGas, status),
      history
    };
  }
}
