import strings from '../data/strings.en.json';
import type { Explanation, RuleFired, Source } from './types';

type RuleText = { kidText: string; because: string; so: string; try: string };
const ruleText = strings.rules as Record<string, RuleText>;
const simulated: Source[] = [{ name: 'simulation rules', kind: 'simulated' }];

export function fireRule(
  id: string,
  inputs: Record<string, number | string | boolean> = {},
): RuleFired {
  const text = ruleText[id];
  if (!text) {
    throw new Error(`Missing simulation rule text "${id}".`);
  }
  return { id, kidText: text.kidText, inputs, sources: simulated };
}

export function makeExplanation(
  rule: RuleFired | undefined,
  inputs: Record<string, number | string | boolean> = {},
): Explanation {
  const text = rule ? ruleText[rule.id] : ruleText['R-AIR-BALANCE'];
  return {
    because: text.because,
    so: text.so,
    try: text.try,
    inputs,
    sources: simulated,
  };
}

export function allRuleIds(): string[] {
  return Object.keys(ruleText);
}
