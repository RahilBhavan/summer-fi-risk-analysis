'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, ComposedChart, Bar, Line, ReferenceArea,
} from 'recharts';
import { Menu, ArrowDown, Shield, Zap, Cpu } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeFiRiskModel, MarketData } from './riskModel';
import crashData from './data.json';

gsap.registerPlugin(ScrollTrigger);
const marketData = crashData as MarketData[];

// --- Components ---

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '1.5rem', fontFamily: 'var(--serif)', minWidth: '220px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, marginBottom: '1.2rem', letterSpacing: '0.2em', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          Hour {data.hour}:00 UTC
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>LTV Ratio</span>
          <span style={{ fontWeight: 900 }}>{(data.ltv * 100).toFixed(2)}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>ETH Price</span>
          <span style={{ fontWeight: 900 }}>${data.price.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>Gas Price</span>
          <span style={{ fontWeight: 900, color: data.gas > 150 ? 'var(--danger)' : 'inherit' }}>{data.gas.toFixed(1)} Gwei</span>
        </div>
        
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          background: data.status === 'liquidated' ? 'rgba(208, 49, 45, 0.1)' : (data.status === 'sl_triggered' ? 'rgba(46, 125, 50, 0.1)' : 'var(--glass)'),
          textAlign: 'center',
          fontSize: '0.7rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: data.status === 'liquidated' ? 'var(--danger)' : (data.status === 'sl_triggered' ? 'var(--safe)' : 'inherit')
        }}>
          {data.status === 'active' ? 'Position Protected' : (data.status === 'liquidated' ? 'Vault Liquidated' : 'Stop-Loss Executed')}
        </div>
      </div>
    );
  }
  return null;
};

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [percent, setPercent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 15);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (percent === 100) {
      gsap.to(containerRef.current, {
        y: '-100%',
        duration: 1.2,
        ease: 'power4.inOut',
        onComplete,
      });
    }
  }, [percent, onComplete]);

  return (
    <div id="preloader" ref={containerRef}>
      <div className="loader-percentage">{percent}%</div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', opacity: 0.5 }}>
        <div style={{ fontFamily: 'var(--serif)', textTransform: 'uppercase', letterSpacing: '0.5em', fontSize: '0.7rem' }}>
          Summer.fi / Risk Research
        </div>
      </div>
    </div>
  );
};

// ... (NavBar component)

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="nav-bar" style={{ padding: scrolled ? '1rem 4rem' : '1.5rem 4rem' }}>
      <div className="nav-link" style={{ fontWeight: 900, fontSize: '1.2rem' }}>Summer.fi</div>
      <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
        <a href="#event" className="nav-link">The Event</a>
        <a href="#simulator" className="nav-link">The Model</a>
        <a href="#methodology" className="nav-link">Methodology</a>
        <Link href="/docs" className="nav-link" style={{ opacity: 0.6, border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '4px' }}>Docs</Link>
        <Menu size={20} style={{ cursor: 'pointer' }} />
      </div>
    </nav>
  );
};

// --- Main Page ---

export default function CaseStudy() {
  const [loading, setLoading] = useState(true);
  const [ltv, setLtv] = useState(0.70);
  const [buffer, setBuffer] = useState(0.05);
  const [strategy, setStrategy] = useState<'static' | 'dynamic'>('static');
  
  const titleRef = useRef<HTMLHeadingElement>(null);

  const simulation = useMemo(() => {
    const initialPrice = marketData[0].Price_USD;
    const model = new DeFiRiskModel(1.0, initialPrice * ltv);
    return model.simulate(marketData, buffer, strategy);
  }, [ltv, buffer, strategy]);

  useEffect(() => {
    if (!loading) {
      const tl = gsap.timeline();
      tl.fromTo(titleRef.current, 
        { y: 200, skewY: 10 }, 
        { y: 0, skewY: 0, duration: 1.5, ease: 'power4.out', delay: 0.2 }
      );
      tl.fromTo('.hero-subtitle', 
        { opacity: 0, y: 20 }, 
        { opacity: 0.7, y: 0, duration: 1, ease: 'power3.out' }, 
        '-=1'
      );

      // Section Entrance Animations
      gsap.utils.toArray<HTMLElement>('.section-container').forEach((section) => {
        gsap.from(section.querySelectorAll('h2, p, .simulator-showcase, .stat-box, .method-card'), {
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
          },
          y: 40,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power2.out'
        });
      });
    }
  }, [loading]);

  return (
    <>
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      
      <main style={{ visibility: loading ? 'hidden' : 'visible' }}>
        <NavBar />

        {/* Hero */}
        <section className="hero-section">
          <div style={{ overflow: 'hidden' }}>
            <h1 className="hero-title" ref={titleRef}>Black Monday</h1>
          </div>
          <p className="hero-subtitle">
            A high-fidelity stress test of DeFi liquidation engines during the August 5th ETH volatility event.
          </p>
          <div style={{ marginTop: '4rem', opacity: 0.2 }}>
            <ArrowDown size={32} />
          </div>
        </section>

        {/* Chapter 1: The Event */}
        <section id="event" className="section-container">
          <div className="chapter-label">Chapter 01 / Market Dynamics</div>
          <div className="editorial-text">
            <h2>The Precipice</h2>
            <div>
              <p>
                August 5, 2024, was not just a price drop—it was a systemic test. Ethereum’s price collapsed 22% in hours, triggering a cascade of liquidations that congested the network and spiked gas prices to over 700 Gwei.
              </p>
              <p>
                In this environment, "Safety" became a moving target. Standard automation triggers failed as execution times lagged behind the rapid price decline.
              </p>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-number">-22%</div>
              <div className="stat-label">ETH Volatility (4h)</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">710</div>
              <div className="stat-label">Peak Network Gwei</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">$1.2B</div>
              <div className="stat-label">Total Liquidations</div>
            </div>
          </div>
        </section>

        {/* Chapter 2: The Model */}
        <section id="simulator" className="section-container">
          <div className="chapter-label">Chapter 02 / Simulation Engine</div>
          <div className="editorial-text">
            <h2>Scenario Analysis</h2>
            <div>
              <p>
                We reconstructed the August 5th event using minute-by-minute price and gas data. This simulator calculates the "Effective LTV" by accounting for slippage and gas costs in real-time.
              </p>
              <p>
                Adjust the parameters below to see how different protection strategies would have fared during the crash.
              </p>
            </div>
          </div>

          <div className="simulator-showcase">
            <div className="controls-grid">
              <div className="control-group">
                <label style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.2em', opacity: 0.6 }}>
                  Entry LTV: {(ltv * 100).toFixed(0)}%
                </label>
                <input type="range" min="0.5" max="0.8" step="0.01" value={ltv} onChange={(e) => setLtv(parseFloat(e.target.value))} style={{ accentColor: 'var(--accent)' }} />
              </div>

              <div className="control-group">
                <label style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.2em', opacity: 0.6 }}>
                  Protection Buffer: {(buffer * 100).toFixed(0)}%
                </label>
                <input type="range" min="0.02" max="0.15" step="0.01" value={buffer} onChange={(e) => setBuffer(parseFloat(e.target.value))} style={{ accentColor: 'var(--accent)' }} />
              </div>

              <div className="control-group">
                <label style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.2em', opacity: 0.6 }}>
                  Execution Strategy
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setStrategy('static')}
                    style={{
                      flex: 1, padding: '0.8rem', border: '1px solid var(--border)', cursor: 'pointer',
                      background: strategy === 'static' ? 'var(--accent)' : 'transparent',
                      color: strategy === 'static' ? '#fff' : 'var(--accent)',
                      fontFamily: 'var(--serif)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em'
                    }}
                  >Static</button>
                  <button
                    onClick={() => setStrategy('dynamic')}
                    style={{
                      flex: 1, padding: '0.8rem', border: '1px solid var(--border)', cursor: 'pointer',
                      background: strategy === 'dynamic' ? 'var(--accent)' : 'transparent',
                      color: strategy === 'dynamic' ? '#fff' : 'var(--accent)',
                      fontFamily: 'var(--serif)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em'
                    }}
                  >Dynamic Gas</button>
                </div>
              </div>
            </div>

            <div className="chart-wide">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulation.history}>
                  <defs>
                    <linearGradient id="colorLtv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--accent)'} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--accent)'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  
                  <XAxis 
                    dataKey="hour" 
                    interval={2}
                    tick={{ fontSize: 10, fontFamily: 'var(--serif)', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  
                  {/* Left Axis: LTV & Thresholds */}
                  <YAxis 
                    yAxisId="left"
                    domain={[0.4, 0.95]} 
                    hide 
                  />
                  
                  {/* Right Axis: ETH Price */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={['auto', 'auto']}
                    hide
                  />

                  {/* Risk Zones */}
                  <ReferenceArea 
                    yAxisId="left"
                    y1={0.825} 
                    y2={0.95} 
                    fill="var(--danger)" 
                    fillOpacity={0.03} 
                  />
                  <ReferenceArea 
                    yAxisId="left"
                    y1={0.825 - buffer} 
                    y2={0.825} 
                    fill="orange" 
                    fillOpacity={0.03} 
                  />

                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Gas Prices (Bars) */}
                  <Bar 
                    yAxisId="right" 
                    dataKey="gas" 
                    fill="var(--accent)" 
                    opacity={0.05} 
                    barSize={20}
                  />

                  {/* ETH Price (Baseline) */}
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="price"
                    stroke="var(--accent)"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="5 5"
                    opacity={0.2}
                  />

                  {/* LTV (Primary Metric) */}
                  <Area 
                    yAxisId="left"
                    type="stepAfter" 
                    dataKey="ltv" 
                    stroke={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--accent)'} 
                    fillOpacity={1} 
                    fill="url(#colorLtv)" 
                    strokeWidth={3}
                  />

                  {/* Thresholds */}
                  <ReferenceLine 
                    yAxisId="left"
                    y={0.825} 
                    stroke="var(--danger)" 
                    strokeDasharray="3 3" 
                    label={{ value: 'LIQUIDATION', position: 'insideTopRight', fontSize: 9, fill: 'var(--danger)', fontWeight: 900, letterSpacing: '0.1em' }} 
                  />
                  
                  <ReferenceLine 
                    yAxisId="left"
                    y={0.825 - buffer} 
                    stroke="var(--safe)" 
                    strokeDasharray="3 3" 
                    label={{ value: 'PROTECTION TRIGGER', position: 'insideBottomRight', fontSize: 9, fill: 'var(--safe)', fontWeight: 900, letterSpacing: '0.1em' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.1em' }}>Simulation Result</div>
                <div style={{ 
                  fontFamily: 'var(--serif)', 
                  fontSize: '2.5rem', 
                  color: simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--safe)',
                  textTransform: 'uppercase',
                  fontWeight: 900
                }}>
                  {simulation.status === 'liquidated' ? 'Liquidated' : 'Protected'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.1em' }}>Final Capital Value</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--serif)' }}>
                  ${simulation.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 3: Methodology */}
        <section id="methodology" className="section-container">
          <div className="chapter-label">Chapter 03 / Engineering Insight</div>
          <div className="editorial-text">
            <h2>The Logic</h2>
            <div>
              <p>
                A robust risk model must account for the infrastructure reality. During crashes, DEX liquidity thins and MEV bots compete for blockspace, increasing the cost of safety.
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '2rem', 
            width: '100%', 
            maxWidth: '1200px',
            marginTop: '2rem'
          }}>
            <div className="method-card" style={{ padding: '3rem', border: '1px solid var(--border)', background: 'var(--glass)' }}>
              <Shield size={32} style={{ marginBottom: '2rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'left' }}>Safety Buffers</h3>
              <p style={{ fontSize: '0.9rem', textAlign: 'left', opacity: 0.6 }}>
                Calculated as (Liquidation Threshold - Buffer). This provides the necessary margin to execute trades before the liquidation threshold is hit.
              </p>
            </div>
            <div className="method-card" style={{ padding: '3rem', border: '1px solid var(--border)', background: 'var(--glass)' }}>
              <Zap size={32} style={{ marginBottom: '2rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'left' }}>Dynamic Scaling</h3>
              <p style={{ fontSize: '0.9rem', textAlign: 'left', opacity: 0.6 }}>
                Our model adjusts trigger sensitivity based on network congestion (Gwei). Higher gas prices require earlier triggers to offset slippage risk.
              </p>
            </div>
            <div className="method-card" style={{ padding: '3rem', border: '1px solid var(--border)', background: 'var(--glass)' }}>
              <Cpu size={32} style={{ marginBottom: '2rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'left' }}>Slippage Estimator</h3>
              <p style={{ fontSize: '0.9rem', textAlign: 'left', opacity: 0.6 }}>
                Accounts for the "Price of Liquidity." As volatility increases, the cost of swapping collateral for debt scales non-linearly.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-container" style={{ textAlign: 'center', background: 'var(--foreground)', color: 'var(--background)' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 8vw, 6rem)', color: 'inherit', marginBottom: '4rem' }}>Secure Your Capital</h2>
          <p style={{ color: 'inherit', opacity: 0.6, maxWidth: '600px', margin: '0 auto 4rem', fontSize: '1.2rem' }}>
            Explore how Summer.fi's automated triggers provide institutional-grade protection for DeFi positions.
          </p>
          <Link href="/docs" style={{ 
            display: 'inline-block',
            padding: '1.5rem 4rem', 
            background: 'var(--background)', 
            color: 'var(--foreground)', 
            textDecoration: 'none',
            fontFamily: 'var(--serif)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3em',
            fontSize: '0.8rem',
            fontWeight: 900,
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            View Technical Documentation
          </Link>
        </section>

        {/* Footer */}
        <footer className="section-container" style={{ padding: '4rem', borderTop: 'none', background: 'var(--background)' }}>
          <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'left' }}>Summer.fi</h2>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <p style={{ opacity: 0.4, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'left' }}>
                  Risk Analysis / Case Study 001
                </p>
                <a 
                  href="https://github.com/RahilBhavan/summer-fi-risk-analysis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="nav-link"
                  style={{ fontSize: '0.7rem', opacity: 0.4 }}
                >
                  GitHub Repository
                </a>
              </div>
            </div>
            <div style={{ opacity: 0.4, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Built with Next.js & GSAP
            </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        input[type='range'] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type='range']::-webkit-slider-runnable-track {
          width: 100%;
          height: 2px;
          background: var(--border);
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          margin-top: -5px;
        }
      `}</style>
    </>
  );
}
