#!/usr/bin/env node
import Inputs from './inputs';

export default function main(): void {
  const inputs = new Inputs();
  console.log('Input values:', inputs);
}

main();
