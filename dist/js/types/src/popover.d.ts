import type { IPopover, IController, alwanConfig } from "./types";
export declare const createPopover: (target: Element, floating: HTMLElement, ref: Element, { margin, position, closeOnScroll, toggle, disabled }: alwanConfig, { _toggle, _isOpen }: IController) => IPopover;
