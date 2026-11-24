import type { TracingTask } from '../../types';
import { TRACING_M1 } from './m1';
import { TRACING_M2 } from './m2';
import { TRACING_M3 } from './m3';
import { TRACING_M4 } from './m4';

export const TRACING_TASKS: TracingTask[] = [...TRACING_M1, ...TRACING_M2, ...TRACING_M3, ...TRACING_M4];
