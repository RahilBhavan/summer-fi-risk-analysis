'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area,
} from 'recharts';
import { AlertCircle, Zap, Shield, TrendingDown, ExternalLink, Menu, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeFiRiskModel, MarketData, SimulationResult } from './riskModel';

gsap.registerPlugin(ScrollTrigger);
import crashData from './data.json';

const marketData = crashData as MarketData[];

// --- Components ---

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
    }, 20);

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
      <div style={{ fontFamily: 'var(--serif)', textTransform: 'uppercase', letterSpacing: '0.5em', fontSize: '0.8rem' }}>
        Summer.fi Risk Analysis
      </div>
    </div>
  );
};

const NavBar = () => (
  <nav className="nav-bar">
    <div className="nav-link" style={{ fontWeight: 900, fontSize: '1.2rem' }}>Summer.fi</div>
    <div style={{ display: 'flex', gap: '3rem' }}>
      <a href="#analysis" className="nav-link">Analysis</a>
      <a href="#simulator" className="nav-link">Simulator</a>
      <a href="#" className="nav-link">Check Availability</a>
      <Menu size={20} style={{ cursor: 'pointer' }} />
    </div>
  </nav>
);

// --- Main Page ---

export default function RiskShowcase() {
  const [loading, setLoading] = useState(true);
  const [ltv, setLtv] = useState(0.70);
  const [buffer, setBuffer] = useState(0.05);
  const [strategy, setStrategy] = useState<'static' | 'dynamic'>('static');
  
  const heroRef = useRef<HTMLDivElement>(null);
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

      // Scroll Animations
      gsap.from('.editorial-text p', {
        scrollTrigger: {
          trigger: '.editorial-text',
          start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
      });

      gsap.from('.luxury-card', {
        scrollTrigger: {
          trigger: '.luxury-card',
          start: 'top 90%',
        },
        y: 100,
        opacity: 0,
        duration: 1.5,
        stagger: 0.1,
        ease: 'power4.out'
      });
    }
  }, [loading]);

  return (
    <>
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      
      <main style={{ visibility: loading ? 'hidden' : 'visible' }}>
        <NavBar />

        {/* Hero Section */}
        <section className="hero-section" ref={heroRef}>
          <div style={{ overflow: 'hidden' }}>
            <h1 className="hero-title" ref={titleRef}>Black Monday</h1>
          </div>
          <p className="hero-subtitle">
            An editorial post-mortem of the August 5, 2024 ETH crash and the resilience of automated safety protocols.
          </p>
          <div style={{ marginTop: '4rem', opacity: 0.5 }}>
            <ArrowRight size={32} className="scroll-indicator" />
          </div>
        </section>

        {/* Editorial Section 1 */}
        <section id="analysis" className="section-container">
          <div className="content-grid">
            <div className="editorial-text">
              <h2>The Precipice</h2>
              <p>
                On August 5th, 2024, the decentralized finance ecosystem faced its most significant stress test since the FTX collapse. 
                In a span of just a few hours, Ethereum (ETH) plummeted 22%, triggering a cascade of liquidations across major lending protocols.
              </p>
              <p>
                As gas prices spiked to 710 Gwei, the bottleneck wasn't just price—it was execution. Summer.fi's automated safety triggers 
                were designed for exactly this moment, but the sheer velocity of the crash redefined the limits of "on-chain safety."
              </p>
            </div>
          </div>
        </section>

        {/* Visual Impact Quote */}
        <section className="section-container" style={{ textAlign: 'center', background: '#fff', padding: '12rem 2rem' }}>
          <h2 style={{ fontSize: '4rem', maxWidth: '1000px', margin: '0 auto', textTransform: 'none', fontStyle: 'italic' }}>
            "The difference between a 10% loss and total liquidation was measured in minutes and gwei."
          </h2>
          <p style={{ marginTop: '2rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.2em' }}>— Risk Research Division</p>
        </section>

        {/* Stats Grid - Editorial Style */}
        <section className="section-container">
          <div className="content-grid">
            <div className="luxury-card" style={{ gridColumn: '1 / 5' }}>
              <h3 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>Peak Volatility</h3>
              <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'var(--serif)' }}>-22%</div>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>ETH Price drop in a single trading session.</p>
            </div>
            <div className="luxury-card" style={{ gridColumn: '5 / 9' }}>
              <h3 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>Network Congestion</h3>
              <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'var(--serif)' }}>710</div>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Gwei at the peak of the panic selling.</p>
            </div>
            <div className="luxury-card" style={{ gridColumn: '9 / 13' }}>
              <h3 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>System Status</h3>
              <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'var(--serif)', color: 'var(--safe)' }}>O.K.</div>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Automated triggers maintained solvency for 98% of users.</p>
            </div>
          </div>
        </section>

        {/* Simulator Section */}
        <section id="simulator" className="simulator-container">
          <div className="section-container">
            <div style={{ marginBottom: '6rem' }}>
              <h2 style={{ fontSize: '3rem' }}>Stress Test Simulator</h2>
              <p style={{ opacity: 0.6, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>Adjust parameters to witness the crash dynamics in real-time.</p>
            </div>

            <div className="content-grid">
              <div className="controls-panel">
                <div className="control-group">
                  <label style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' }}>
                    Initial Loan-To-Value: {(ltv * 100).toFixed(0)}%
                  </label>
                  <input type="range" min="0.5" max="0.8" step="0.01" value={ltv} onChange={(e) => setLtv(parseFloat(e.target.value))} />
                </div>

                <div className="control-group">
                  <label style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' }}>
                    Stop-Loss Buffer: {(buffer * 100).toFixed(0)}%
                  </label>
                  <input type="range" min="0.02" max="0.15" step="0.01" value={buffer} onChange={(e) => setBuffer(parseFloat(e.target.value))} />
                </div>

                <div className="control-group">
                  <label style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' }}>
                    Execution Strategy
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => setStrategy('static')}
                      style={{
                        flex: 1, padding: '1rem', border: '1px solid var(--border)', cursor: 'pointer',
                        background: strategy === 'static' ? 'var(--accent)' : 'transparent',
                        color: strategy === 'static' ? '#fff' : 'var(--accent)',
                        fontFamily: 'var(--serif)', textTransform: 'uppercase', fontSize: '0.7rem'
                      }}
                    >Static</button>
                    <button
                      onClick={() => setStrategy('dynamic')}
                      style={{
                        flex: 1, padding: '1rem', border: '1px solid var(--border)', cursor: 'pointer',
                        background: strategy === 'dynamic' ? 'var(--accent)' : 'transparent',
                        color: strategy === 'dynamic' ? '#fff' : 'var(--accent)',
                        fontFamily: 'var(--serif)', textTransform: 'uppercase', fontSize: '0.7rem'
                      }}
                    >Gas-Aware</button>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', padding: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ 
                    fontFamily: 'var(--serif)', 
                    fontSize: '1.5rem', 
                    color: simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--safe)',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem'
                  }}>
                    {simulation.status === 'liquidated' ? 'Liquidation' : 'Position Protected'}
                  </div>
                  <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                    Final Capital: ${simulation.finalValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="chart-panel">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulation.history}>
                    <defs>
                      <linearGradient id="colorLtv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--accent)'} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--accent)'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 1" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis dataKey="hour" hide />
                    <YAxis domain={[0.4, 1.0]} hide />
                    <Tooltip 
                      contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', fontFamily: 'var(--serif)' }}
                    />
                    <Area 
                      type="monotone" dataKey="ltv" stroke={simulation.status === 'liquidated' ? 'var(--danger)' : 'var(--accent)'} 
                      fillOpacity={1} fill="url(#colorLtv)" strokeWidth={1}
                    />
                    <ReferenceLine y={0.825} stroke="var(--danger)" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology Footer */}
        <footer className="section-container" style={{ padding: '8rem 2rem', borderTop: '1px solid var(--border)' }}>
          <div className="content-grid">
            <div style={{ gridColumn: '1 / 6' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Summer.fi</h2>
              <p style={{ opacity: 0.5, fontSize: '0.9rem', maxWidth: '300px' }}>
                Crafting luxury risk infrastructure for the decentralized age.
              </p>
            </div>
            <div style={{ gridColumn: '7 / 9' }}>
              <h4 style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '1.5rem' }}>Research</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li>Methodology</li>
                <li>Data Sourcing</li>
                <li>Whitepaper</li>
              </ul>
            </div>
            <div style={{ gridColumn: '9 / 11' }}>
              <h4 style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '1.5rem' }}>Legal</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div style={{ gridColumn: '11 / 13' }}>
              <h4 style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '1.5rem' }}>Social</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li>Twitter / X</li>
                <li>Discord</li>
                <li>GitHub</li>
              </ul>
            </div>
          </div>
          <div style={{ marginTop: '8rem', paddingTop: '4rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem', opacity: 0.3, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            © 2026 Summer.fi • Italian Flair in Risk Management
          </div>
        </footer>
      </main>
    </>
  );
}
