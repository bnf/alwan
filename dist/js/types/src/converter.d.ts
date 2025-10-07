import type { HSLA, RGBA, colorDetails } from "./types";
export declare const RGBToHEX: ({ r, g, b, a }: RGBA) => string;
export declare const HSLToRGB: ({ h, s, l, a }: colorDetails) => RGBA;
export declare const RGBToHSL: ({ r, g, b, a }: RGBA) => HSLA;
