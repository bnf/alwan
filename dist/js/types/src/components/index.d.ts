import { Alwan } from "../alwan";
import type { Component, IInputs, ISelector, ISliders, ISwatches, IUtility, alwanConfig } from "../types";
export declare const createComponents: (alwan: Alwan) => [ISelector, IUtility, ISliders, IInputs, ISwatches];
export declare const renderComponents: (components: Array<Component | Component[]>, config: alwanConfig) => Array<Element | null | undefined>;
