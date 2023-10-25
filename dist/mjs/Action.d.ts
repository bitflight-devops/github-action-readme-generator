export interface InputType {
    description?: string;
    required?: boolean;
    default?: string;
}
export interface OutputType {
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
export type InputsType = {
    [id: string]: InputType;
};
export type OutputsType = {
    [id: string]: OutputType;
};
export default class Action {
    name: string;
    description: string;
    branding: Branding;
    inputs: InputsType;
    outputs: OutputsType;
    runs: Runs;
    path: string;
    constructor(actionPath: string);
    inputDefault(inputName: string): string | undefined;
    stringify(): string;
}
