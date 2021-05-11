export interface Input {
  description?: string
  required?: boolean
  default?: string
}
export interface Output {
  description?: string
}
export interface Runs {
  using: string
  main: string
}
export interface Branding {
  color: string
  icon: string
}
export type Inputs = {[id: string]: Input}
export type Outputs = {[id: string]: Output}
export interface Action {
  name: string
  description: string
  branding: Branding
  inputs: Inputs
  outputs: Outputs
  runs: Runs
}
declare function updateUsage(
  actionReference: string,
  actionYamlPath?: string,
  readmePath?: string,
  startToken?: string,
  endToken?: string
): void
