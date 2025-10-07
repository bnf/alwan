import "./assets/scss/alwan.scss";
import type { Color, EventEmitter, IColorState, IController, Swatch, alwanConfig, alwanEventHandler, alwanEventType, alwanOptions, alwanValue } from "./types";
export declare class Alwan {
    static version(): string;
    static setDefaults(defaults: alwanOptions): void;
    config: alwanConfig;
    e: EventEmitter;
    s: IColorState;
    c: IController;
    constructor(reference: string | Element, options?: alwanOptions);
    setOptions(options: alwanOptions): void;
    setColor(color: Color): this;
    getColor(): alwanValue;
    isOpen(): boolean;
    open(): void;
    close(): void;
    toggle(): void;
    on(type: alwanEventType, listener: alwanEventHandler): void;
    off(type?: alwanEventType, listener?: alwanEventHandler): void;
    addSwatches(...swatches: Swatch[]): void;
    removeSwatches(...swatches: Array<number | Swatch>): void;
    enable(): void;
    disable(): void;
    reset(): void;
    reposition(): void;
    trigger(type: alwanEventType): void;
    destroy(): void;
}
