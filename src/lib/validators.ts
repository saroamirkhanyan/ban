import { KEYWORDS } from '../constants';

export const isNumber = (text: string) => /^[0-9]+$/.test(text);
export const isArmenian = (text: string) => /^[\u0530-\u058F]+$/.test(text);
export const isEnding = (text: string) => /^-[նըի]+$/.test(text);
export const isKeyword = (text: string) =>
  Object.values(KEYWORDS).includes(text);
