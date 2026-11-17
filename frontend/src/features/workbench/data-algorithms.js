import { cAlgorithm } from './c-algorithms.js';
import { dAlgorithm } from './d-algorithms.js';
export function dataAlgorithm(id) { return cAlgorithm(id) ?? dAlgorithm(id); }
