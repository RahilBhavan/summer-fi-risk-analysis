import Link from 'next/link';
import type { ReactNode } from 'react';
import { FileText, ArrowLeft, Briefcase, Target, Info } from 'lucide-react';

// Documentation is intentionally external-only; /docs/[slug] remains compatibility-only.

const repository = 'https://github.com/RahilBhavan/summer-fi-risk-analysis/blob/main/';
const docs: Array<[string, string, string, ReactNode]> = [
  ['Strategic Analysis Case Study', 'CONSULTING_REPORT.md', 'Portfolio case study showing dataset analysis, trends, and stakeholder-ready recommendations.', <Briefcase aria-hidden="true" key="case-study" size={20} />],
  ['Portfolio Project Overview', 'README.md', 'Project scope, analytical approach, and implementation guide.', <FileText aria-hidden="true" key="overview" size={20} />],
  ['Project Oversight', 'PROJECT_OVERSIGHT.md', 'Decision-support objectives, model structure, and analytical guardrails.', <Target aria-hidden="true" key="oversight" size={20} />],
  ['Backtest Report (Aug 5)', 'reports/backtest_report_aug5.md', 'Hourly scenario results, thresholds, and analytical limitations.', <Info aria-hidden="true" key="backtest" size={20} />],
  ['Web Showcase Guide', 'web-showcase/README.md', 'Documentation for the interactive analysis and communication choices.', <Briefcase aria-hidden="true" key="showcase" size={20} />],
];

export default function DocsPage() {
  return <div style={{minHeight:'100vh',background:'var(--background)',padding:'4rem 2rem'}}><div style={{maxWidth:'900px',margin:'0 auto'}}>
    <Link href="/" style={{display:'flex',gap:'.5rem',alignItems:'center',marginBottom:'4rem'}}><ArrowLeft aria-hidden="true" size={16}/> Back to Showcase</Link>
    <header style={{marginBottom:'6rem'}}><h1>Technical Documentation</h1><p>A repository of static hourly scenario analysis for illustrative Aave V3 and Morpho lending-market assumptions. It documents decision-support methods, not live protocol use, forecasts, or organizational affiliation.</p></header>
    <section style={{marginBottom:'6rem',padding:'4rem',border:'1px solid var(--border)',background:'#fff'}}><h2>Project Context</h2><div className="docs-context-grid"><div><h3>WHO</h3><p>Independent candidate portfolio project demonstrating structured analysis and clear communication of risk trade-offs.</p></div><div><h3>WHERE</h3><p>Illustrative Aave V3 and Morpho lending-market scenarios using supplied hourly observations.</p></div><div><h3>WHY</h3><p>To examine how price movement and gas observations affect static risk decisions.</p></div><div><h3>HOW</h3><p>A static model applies explicit protocol thresholds, penalties, and protection buffers to nonempty hourly data.</p></div></div></section>
    <section><h2>Project Files</h2><div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>{docs.map(([title, path, description, icon]) => <a key={path} href={`${repository}${path}`} target="_blank" rel="noreferrer" className="doc-link-card"><div style={{padding:'1rem',background:'var(--glass)',borderRadius:'4px'}}>{icon}</div><div><h3>{title}</h3><p>{description} <span className="sr-only">(opens in a new tab)</span></p></div></a>)}</div></section>
    <footer style={{marginTop:'8rem',padding:'4rem 0',borderTop:'1px solid var(--border)'}}><p>© 2026 CANDIDATE PORTFOLIO - INDEPENDENT TECHNICAL CASE STUDY</p></footer>
  </div></div>;
}
