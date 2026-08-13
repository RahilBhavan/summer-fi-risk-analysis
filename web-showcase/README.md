# DeFi Risk Analysis Portfolio Showcase

This directory contains the independent portfolio presentation for the DeFi risk-analysis case study. It communicates the scenario, trend analysis, controls, recommendation synthesis, assumptions, and limitations through a Next.js interface. It is a standalone portfolio artifact.

## Setup

From this directory, install dependencies and run the available checks:

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Open [http://localhost:3000](http://localhost:3000) after starting the development server. The production build can be served with `npm run start` after `npm run build`.

## Project Notes

- The showcase presents the 24-observation scenario and the documented price and gas facts.
- Aave V3 and Morpho appear as illustrative lending-market scenarios.
- The underlying model is static, heuristic, and intended for decision support.
- Assumptions, controls, reproducibility, stakeholder communication, and limitations are part of the case study rather than claims of live execution capability.

## Independent Publishing

The app can be published as an independent Next.js portfolio site using a platform that supports the repository's `web-showcase` directory as its project root. Set the project root to this directory, install with `npm ci`, and use the standard build command `npm run build`. No application-code integration or external service claim is implied by this documentation.
