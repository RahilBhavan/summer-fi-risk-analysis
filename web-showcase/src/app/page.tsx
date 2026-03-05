'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import { AlertCircle, Zap, Shield, TrendingDown, ExternalLink } from 'lucide-react';
import { DeFiRiskModel, MarketData, SimulationResult } from './riskModel';
import crashData from './data.json';

const marketData = crashData as MarketData[];

export default function RiskShowcase() {
  const [ltv, setLtv] = useState(0.70);
  const [buffer, setBuffer] = useState(0.05);
  const [strategy, setStrategy] = useState<'static' | 'dynamic'>('static');

  const simulation = useMemo(() => {
    const initialPrice = marketData[0].Price_USD;
    const model = new DeFiRiskModel(1.0, initialPrice * ltv);
    return model.simulate(marketData, buffer, strategy);
  }, [ltv, buffer, strategy]);

  return (
    <main>
      <section className="hero">
        <Zap color="#00ffba" size={48} style={{ marginBottom: '1rem' }} />
        <h1>Summer.fi Risk Engine</h1>
        <p>
          A high-fidelity stress-test analysis of automated safety triggers during 
          the August 5, 2024 "Black Monday" crash.
        </p>
      </section>

      <div className="grid">
        <div className="card">
          <h3>The Crash Context</h3>
          <p>On August 5th, 2024, ETH plummeted 22% while gas spiked to 710 Gwei. We analyzed how these factors impacted Stop-Loss execution.</p>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">ETH Drop</span>
              <span className="stat-value" style={{ color: 'var(--danger)' }}>-22%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Peak Gas</span>
              <span className="stat-value">710 Gwei</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Liquidation Stress</span>
              <span className="stat-value" style={{ color: 'var(--secondary)' }}>High</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>How it Works</h3>
          <p>Our model simulates every minute of the crash, accounting for protocol-specific liquidation thresholds, gas-adjusted slippage, and execution costs.</p>
          <div className="recommendations" style={{ marginTop: '1rem' }}>
            <div className="rec-item" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
              <strong>Slippage:</strong> Dynamic based on gas price.
            </div>
            <div className="rec-item" style={{ padding: '0.75rem', fontSize: '0.85rem', borderLeftColor: 'var(--secondary)' }}>
              <strong>Triggers:</strong> Modeled on Aave v3 logic.
            </div>
          </div>
        </div>
      </div>

      <section className="simulator-container">
        <div className="card">
          <h2>Interactive Crash Simulator</h2>
          <div className="controls">
            <div className="control-group">
              <label>Initial LTV: {(ltv * 100).toFixed(0)}%</label>
              <input type="range" min="0.5" max="0.8" step="0.01" value={ltv} onChange={(e) => setLtv(parseFloat(e.target.value))} />
            </div>
            <div className="control-group">
              <label>Stop-Loss Buffer: {(buffer * 100).toFixed(0)}%</label>
              <input type="range" min="0.02" max="0.15" step="0.01" value={buffer} onChange={(e) => setBuffer(parseFloat(e.target.value))} />
            </div>
            <div className="control-group">
              <label>Trigger Strategy</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setStrategy('static')}
                  style={{ 
                    flex: 1, padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                    background: strategy === 'static' ? 'var(--primary)' : 'var(--glass)',
                    color: strategy === 'static' ? '#000' : '#fff', border: 'none'
                  }}
                >Static</button>
                <button 
                  onClick={() => setStrategy('dynamic')}
                  style={{ 
                    flex: 1, padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                    background: strategy === 'dynamic' ? 'var(--primary)' : 'var(--glass)',
                    color: strategy === 'dynamic' ? '#000' : '#fff', border: 'none'
                  }}
                >Dynamic (Gas-Aware)</button>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <span className={`result-badge badge-${simulation.status}`}>
              {simulation.status === 'liquidated' && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><AlertCircle size={16} /> LIQUIDATED</div>}
              {simulation.status === 'sl_triggered' && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Shield size={16} /> STOP-LOSS SUCCESSFUL</div>}
              {simulation.status === 'active' && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Zap size={16} /> POSITION SAFE</div>}
            </span>
            <div style={{ marginTop: '0.5rem', color: '#888' }}>
              Final Capital Value: <strong>${simulation.finalValue.toFixed(2)}</strong>
              {simulation.triggerHour && <p>Triggered at {simulation.triggerHour} UTC</p>}
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulation.history}>
                <defs>
                  <linearGradient id="colorLtv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--primary)'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--primary)'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" stroke="#666" fontSize={12} tickCount={6} />
                <YAxis domain={[0.5, 1.0]} stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Area 
                  type="monotone" dataKey="ltv" stroke={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--primary)'} 
                  fillOpacity={1} fill="url(#colorLtv)" strokeWidth={3}
                />
                <ReferenceLine y={0.825} label={{ value: 'Liquidation', position: 'right', fill: 'var(--danger)', fontSize: 10 }} stroke="var(--danger)" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section style={{ margin: '4rem 0' }}>
        <h2 style={{ textAlign: 'center' }}>Strategic Recommendations</h2>
        <div className="recommendations">
          <div className="rec-item">
            <h4>Dynamic Volatility Buffers</h4>
            <p>Automatically widen Stop-Loss distance when realized volatility exceeds 5% in 1 hour.</p>
          </div>
          <div className="rec-item" style={{ borderLeftColor: 'var(--secondary)' }}>
            <h4>Gas-Aware Preemption</h4>
            <p>Trigger Stop-Losses 2-3% earlier when gas exceeds 150 Gwei to ensure transaction finality before liquidation.</p>
          </div>
          <div className="rec-item" style={{ borderLeftColor: 'var(--warning)' }}>
            <h4>The 10% Rule</h4>
            <p>During high-gas environments, positions with buffers under 10% are at high risk of execution failure.</p>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '4rem 0', color: '#666', borderTop: '1px solid var(--border)' }}>
        <p>Built for Summer.fi Risk Analysis • March 2026</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <a href="#" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ExternalLink size={16} /> Research Paper
          </a>
          <a href="#" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={16} /> Methodolgy
          </a>
        </div>
      </footer>
    </main>
  );
}
