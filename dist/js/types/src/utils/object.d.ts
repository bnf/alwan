export declare const keys: {
    (o: object): string[];
    (o: {}): string[];
}, merge: {
    <T extends {}, U>(target: T, source: U): T & U;
    <T_1 extends {}, U_1, V>(target: T_1, source1: U_1, source2: V): T_1 & U_1 & V;
    <T_2 extends {}, U_2, V_1, W>(target: T_2, source1: U_2, source2: V_1, source3: W): T_2 & U_2 & V_1 & W;
    (target: object, ...sources: any[]): any;
}, setPrototypeOf: (o: any, proto: object | null) => any, prototype: Object;
export declare const isArray: (arg: any) => arg is any[];
export declare const isPlainObject: (obj: unknown) => obj is {};
export declare const ObjectForEach: <T extends {}>(object: T, callbackFn: (key: keyof T, value: T[keyof T]) => void) => void;
export declare const deepMerge: <T extends {}, U extends {}>(target: T, source: U) => T & U;
