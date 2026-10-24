// Runs the TypeScript model from web-showcase on cases read from stdin (JSON array)
// and prints the results as JSON. Used by tests/test_ts_parity.py.
// Needs Node 22.18 or newer (built-in TypeScript type stripping).
import fs from 'node:fs';
import { DeFiRiskModel } from '../web-showcase/src/app/riskModel.ts';

const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
const data = JSON.parse(fs.readFileSync(new URL('../web-showcase/src/app/data.json', import.meta.url), 'utf8'));

const out = cases.map(({ protocol, collateral, debt, buffer }) => {
  const r = new DeFiRiskModel(collateral, debt, protocol).simulate(data, buffer);
  return { status: r.status, triggerHour: r.triggerHour, finalValue: r.finalValue, endOfDayUnprotectedValue: r.endOfDayUnprotectedValue };
});
console.log(JSON.stringify(out));
