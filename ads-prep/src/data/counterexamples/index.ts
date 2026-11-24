import type { CounterexampleTask } from '../../types';
import { CX_M1 } from './m1';
import { CX_M2 } from './m2';
import { CX_M3 } from './m3';
import { CX_M4 } from './m4';

export const CX_TASKS: CounterexampleTask[] = [...CX_M1, ...CX_M2, ...CX_M3, ...CX_M4];
