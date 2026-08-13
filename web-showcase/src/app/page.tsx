'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, Shield, Zap, Cpu } from 'lucide-react';
import { CartesianGrid, ComposedChart, Area, Bar, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DeFiRiskModel, MarketData, Protocol } from './riskModel';
import crashData from './data.json';

const marketData = crashData as MarketData[];
const github = 'https://github.com/RahilBhavan/summer-fi-risk-analysis';
const money = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function CaseStudy() {
  const [protocol, setProtocol] = useState<Protocol>('AaveV3');
  const [ltv, setLtv] = useState(0.7);
  const [buffer, setBuffer] = useState(0.05);
  const simulation = useMemo(() => new DeFiRiskModel(1, marketData[0].Price_USD * ltv, protocol).simulate(marketData, buffer), [ltv, buffer, protocol]);
  const peakGas = Math.max(...marketData.map((step) => step.Gas_Gwei));
  const drawdown = ((Math.min(...marketData.map((step) => step.Price_USD)) / marketData[0].Price_USD) - 1) * 100;
  const threshold = protocol === 'AaveV3' ? 0.825 : 0.945;
  const trigger = simulation.triggerHour ? simulation.history.find((step) => step.hour === simulation.triggerHour) : null;

  return <main>
    <nav className="nav-bar"><strong>Finance Risk Study</strong><div className="nav-links"><a href="#event">The Event</a><a href="#simulator">The Model</a><a href="#methodology">Methodology</a><Link href="/docs">Docs</Link></div></nav>
    <section className="hero-section"><h1 className="hero-title">Risk Under Pressure</h1><p className="hero-subtitle">A static hourly stress test for decision support, using illustrative Aave V3 and Morpho scenarios.</p><ArrowDown size={32} aria-hidden="true" /></section>

    <section id="event" className="section-container"><div className="chapter-label">Chapter 01 / Market Dynamics</div><div className="editorial-text"><h2>The Precipice</h2><div><p>The supplied dataset contains {marketData.length} hourly observations. Across that window, price reached a {Math.abs(drawdown).toFixed(1)}% drawdown from the opening observation and gas peaked at {peakGas.toFixed(1)} Gwei.</p><p>These are observations in the supplied case-study inputs, not forecasts, live-market claims, or evidence of within-hour execution.</p></div></div><div className="stats-row"><div className="stat-box"><div className="stat-number">{marketData.length}</div><div className="stat-label">Hourly observations</div></div><div className="stat-box"><div className="stat-number">{drawdown.toFixed(1)}%</div><div className="stat-label">Observed peak-to-trough drawdown</div></div><div className="stat-box"><div className="stat-number">{peakGas.toFixed(1)}</div><div className="stat-label">Observed peak gas, Gwei</div></div></div></section>

    <section id="simulator" className="section-container"><div className="chapter-label">Chapter 02 / Simulation Engine</div><div className="editorial-text"><h2>Scenario Analysis</h2><div><p>Choose a lending-market scenario and set entry LTV and protection buffer. The model is static-only: at each hourly observation, the observed liquidation threshold is checked before stop-loss using the selected market threshold.</p></div></div>
      <div className="simulator-showcase"><div className="controls-grid">
        <label className="control-group">Market<select value={protocol} onChange={(e) => setProtocol(e.target.value as Protocol)}><option value="AaveV3">Aave V3</option><option value="Morpho">Morpho</option></select></label>
        <div className="control-group"><label htmlFor="entry-ltv">Entry LTV <output htmlFor="entry-ltv">{(ltv * 100).toFixed(0)}%</output></label><input id="entry-ltv" type="range" min="0.5" max="0.8" step="0.01" value={ltv} onChange={(e) => setLtv(Number(e.target.value))} aria-valuetext={`${(ltv * 100).toFixed(0)}% entry LTV`} /></div>
        <div className="control-group"><label htmlFor="protection-buffer">Protection Buffer <output htmlFor="protection-buffer">{(buffer * 100).toFixed(0)}%</output></label><input id="protection-buffer" type="range" min="0.02" max="0.15" step="0.01" value={buffer} onChange={(e) => setBuffer(Number(e.target.value))} aria-valuetext={`${(buffer * 100).toFixed(0)}% protection buffer`} /></div>
      </div>
      <div className="chart-wide" aria-hidden="true"><ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={300}><ComposedChart data={simulation.history}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="hour" interval={2}/><YAxis domain={[0.4, 1]} hide/><YAxis yAxisId="price" orientation="right" hide/><ReferenceArea y1={threshold} y2={1} fill="var(--danger)" fillOpacity={0.03}/><ReferenceArea y1={threshold - buffer} y2={threshold} fill="orange" fillOpacity={0.05}/><Bar yAxisId="price" dataKey="gas" fill="var(--accent)" opacity={0.08}/><Line yAxisId="price" dataKey="price" stroke="var(--accent)" opacity={0.25} dot={false}/><Area type="stepAfter" dataKey="ltv" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.12}/><ReferenceLine y={threshold} stroke="var(--danger)" strokeDasharray="3 3" label="LIQUIDATION"/><ReferenceLine y={threshold - buffer} stroke="var(--safe)" strokeDasharray="3 3" label="PROTECTION"/><Tooltip/></ComposedChart></ResponsiveContainer></div>
      <div className="result-readout" role="status" aria-live="polite"><div><small>Outcome</small><h3>{simulation.status === 'sl_triggered' ? 'Stop-loss triggered' : simulation.status === 'liquidated' ? 'Liquidated' : 'Active'}</h3><p>{simulation.triggerHour ? `Trigger hour: ${simulation.triggerHour} UTC` : 'No trigger in observed window.'}</p></div><div><small>Remaining equity</small><h3>{money(simulation.finalValue)}</h3><p>Illustrative end-of-day unprotected comparison: {money(simulation.endOfDayUnprotectedValue)}</p></div></div>
      <p><strong>Implication:</strong> {simulation.status === 'active' ? 'The selected scenario stays below its protection threshold in this hourly window.' : 'The selected buffer would exit before the liquidation threshold at the triggering observation; this is a scenario result, not a deployment guarantee. Hourly observations cannot establish intra-hour execution order.'}</p>
      <div className="summary-table"><strong>Text summary</strong><span>Market: {protocol === 'AaveV3' ? 'Aave V3' : 'Morpho'} | Liquidation threshold: {(threshold * 100).toFixed(1)}% | Protection trigger: {((threshold - buffer) * 100).toFixed(1)}% | Trigger: {trigger ? `${trigger.hour} UTC at ${(trigger.ltv * 100).toFixed(1)}% LTV` : 'none'}</span></div>
      </div></section>

    <section id="methodology" className="section-container"><div className="chapter-label">Chapter 03 / Decision Support</div><div className="editorial-text"><h2>The Logic</h2><div><p>Recommendation: use a static protection buffer as a reviewable control, then validate assumptions against current protocol configuration and finer-grained execution data before deployment.</p></div></div><div className="method-grid"><div className="method-card"><Shield aria-hidden="true"/><h3>Rationale</h3><p>Earlier protection can preserve more equity when LTV rises rapidly, while the buffer remains explicit and adjustable.</p></div><div className="method-card"><Zap aria-hidden="true"/><h3>KPI</h3><p>Track outcome, trigger hour, remaining equity, observed drawdown, and peak gas for each scenario.</p></div><div className="method-card"><Cpu aria-hidden="true"/><h3>Limitation</h3><p>This is hourly historical scenario analysis. It uses conservative liquidation-first ordering at each hourly row; hourly data cannot establish intra-hour order, forecast prices, or guarantee execution.</p></div></div></section>
    <section className="section-container" style={{textAlign:'center'}}><h2>Review the Analysis</h2><Link href="/docs">View Technical Documentation</Link></section>
    <footer className="section-container"><a href={github} target="_blank" rel="noreferrer">GitHub Repository <span className="sr-only">(opens in a new tab)</span></a></footer>
  </main>;
}
