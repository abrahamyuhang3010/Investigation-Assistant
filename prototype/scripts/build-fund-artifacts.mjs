/** Rebuild binaries from the exact fixture used by the UI. Requires Python reportlab, Pillow, pyarrow. */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHistoricalFundSnapshot} from '../src/fixtures/historical-fund-case.js';
const result=spawnSync(process.env.PYTHON||'python3',[fileURLToPath(new URL('./build-fund-artifacts.py',import.meta.url))],{input:JSON.stringify(createHistoricalFundSnapshot(5)),encoding:'utf8',maxBuffer:10*1024*1024});
if(result.error)throw result.error;
process.stdout.write(result.stdout);process.stderr.write(result.stderr);process.exitCode=result.status;
