export interface Input {
    description?: string;
    required?: boolean;
    default?: string;
}
export interface Output {
    description?: string;
}
export interface Runs {
    using: string;
    main: string;
}
export interface Branding {
    color: string;
    icon: string;
}
export declare type Inputs = {
    [id: string]: Input;
};
export declare type Outputs = {
    [id: string]: Output;
};
export default class Action {
    name: string;
    description: string;
    branding: Branding;
    inputs: Inputs;
    outputs: Outputs;
    runs: Runs;
    constructor(actionPath: string);
}
