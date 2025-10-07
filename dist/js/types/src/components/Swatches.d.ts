import type Alwan from "..";
import type { ISwatches, Color } from "../types";
export declare const isCombinedColorLabelObject: (value: unknown) => value is {
    color: Color;
    label?: string | undefined;
};
export declare const Swatches: (alwan: Alwan) => ISwatches;
