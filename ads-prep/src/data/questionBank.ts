import type { MCQ, OpenQuestion } from '../types';
import { mcqM1 } from './mcq/m1';
import { mcqM2 } from './mcq/m2';
import { mcqM3 } from './mcq/m3';
import { mcqM4 } from './mcq/m4';
import { openM1 } from './open/m1';
import { openM2 } from './open/m2';
import { openM3 } from './open/m3';
import { openM4 } from './open/m4';

export const MCQ_BANK: MCQ[] = [...mcqM1, ...mcqM2, ...mcqM3, ...mcqM4];
export const OPEN_BANK: OpenQuestion[] = [...openM1, ...openM2, ...openM3, ...openM4];
