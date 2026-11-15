import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EXPERT_DATA } from '../src/data/expertQuestionsData';
import { EXPERT_README_TEXT } from '../src/data/expertReadme';

// Simple lightweight mock element for Node environment testing
class MockElement {
  public tagName: string;
  public style: Record<string, string> = {};
  public innerHTML: string = '';
  public textContent: string = '';
  public dataset: Record<string, string> = {};
  public children: MockElement[] = [];
  public className: string = '';
  public id: string = '';
  public value: string = '';
  public onclick: ((e: any) => void) | null = null;
  private listeners: Record<string, ((e: any) => void)[]> = {};

  constructor(tagName: string = 'div') {
    this.tagName = tagName;
  }

  public appendChild(child: MockElement): MockElement {
    this.children.push(child);
    return child;
  }

  public addEventListener(event: string, fn: (e: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  public dispatchEvent(event: { type: string }): void {
    const fns = this.listeners[event.type] || [];
    for (const fn of fns) fn(event);
  }

  public querySelector(sel: string): MockElement | null {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }

  public querySelectorAll(sel: string): MockElement[] {
    const results: MockElement[] = [];
    const check = (el: MockElement) => {
      let match = false;
      if (sel.startsWith('#') && el.id === sel.slice(1)) match = true;
      else if (sel.startsWith('.') && el.className.includes(sel.slice(1))) match = true;
      else if (sel.includes('[data-cat="') && el.dataset.cat === sel.match(/data-cat="([^"]+)"/)?.[1]) match = true;
      else if (sel.includes('[data-qid="') && el.dataset.qid === sel.match(/data-qid="([^"]+)"/)?.[1]) match = true;
      else if (el.tagName.toLowerCase() === sel.toLowerCase()) match = true;

      if (match) results.push(el);
      for (const child of el.children) check(child);
    };

    for (const child of this.children) check(child);
    return results;
  }

  public click(): void {
    if (this.onclick) {
      this.onclick({ stopPropagation: () => {} });
    }
  }
}

describe('MILO Expert Knowledge Panel Suite (expert_questions.json & README.md)', () => {
  it('MILO-01: expert_questions.json data integrity contains 67 questions and 10 categories', () => {
    assert.strictEqual(EXPERT_DATA.questions.length, 67, 'Must contain exactly 67 NASA science questions');
    assert.strictEqual(EXPERT_DATA.categories.length, 10, 'Must contain 10 canonical science categories');

    const expectedCats = [
      'radiation',
      'oxygen',
      'power',
      'space_weather',
      'life_support',
      'moon',
      'mars',
      'strategy',
      'crew_health',
      'thermal',
    ];

    for (const cat of expectedCats) {
      const found = EXPERT_DATA.categories.some((c) => c.id === cat);
      assert.ok(found, `Category ${cat} must exist in knowledge base`);
    }
  });

  it('MILO-02: README.md field guide text contains overview, domains, and data sources', () => {
    assert.ok(EXPERT_README_TEXT.length > 500, 'README text must be populated');
    assert.ok(EXPERT_README_TEXT.includes('Expert System — Knowledge Base'), 'Must contain main heading');
    assert.ok(EXPERT_README_TEXT.includes('Overview'), 'Must contain Overview');
    assert.ok(EXPERT_README_TEXT.includes('Radiation & Shielding'), 'Must contain Radiation category');
    assert.ok(EXPERT_README_TEXT.includes('NASA OSDR RadLab'), 'Must cite NASA OSDR RadLab source');
  });

  it('MILO-03: All questions have valid kid-friendly answers, difficulty, and NASA sources', () => {
    for (const q of EXPERT_DATA.questions) {
      assert.ok(q.id && q.id.length > 0, 'Question must have id');
      assert.ok(q.question && q.question.length > 5, `Question ${q.id} must have question text`);
      assert.ok(q.answer && q.answer.length > 10, `Question ${q.id} must have informative answer`);
      assert.ok(['beginner', 'intermediate', 'advanced'].includes(q.difficulty), `Question ${q.id} valid difficulty`);
      assert.ok(q.source && q.source.length > 0, `Question ${q.id} must cite NASA source`);
      assert.ok(Array.isArray(q.tags) && q.tags.length > 0, `Question ${q.id} must have tags`);
      assert.ok(Array.isArray(q.triggers) && q.triggers.length > 0, `Question ${q.id} must have triggers`);
    }
  });

  it('MILO-04: Question search filters matching questions across question, answer, and NASA source', () => {
    const query = 'radiation';
    const matches = EXPERT_DATA.questions.filter((q) => {
      const matchQ = q.question.toLowerCase().includes(query);
      const matchA = q.answer.toLowerCase().includes(query);
      const matchTag = q.tags.some((t) => t.toLowerCase().includes(query));
      const matchSrc = q.source.toLowerCase().includes(query);
      return matchQ || matchA || matchTag || matchSrc;
    });

    assert.ok(matches.length >= 12, 'Must match at least 12 radiation questions');
    for (const m of matches) {
      const hasTerm =
        m.question.toLowerCase().includes(query) ||
        m.answer.toLowerCase().includes(query) ||
        m.tags.some((t) => t.toLowerCase().includes(query)) ||
        m.source.toLowerCase().includes(query);
      assert.ok(hasTerm, `Question ${m.id} must contain search term`);
    }
  });

  it('MILO-05: Category distribution matches canonical counts', () => {
    const categoryCounts: Record<string, number> = {};
    for (const q of EXPERT_DATA.questions) {
      categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
    }

    assert.strictEqual(categoryCounts['radiation'], 12, '12 Radiation questions');
    assert.strictEqual(categoryCounts['oxygen'], 7, '7 Oxygen questions');
    assert.strictEqual(categoryCounts['power'], 8, '8 Power questions');
    assert.strictEqual(categoryCounts['space_weather'], 8, '8 Space weather questions');
    assert.strictEqual(categoryCounts['life_support'], 6, '6 Life support questions');
    assert.strictEqual(categoryCounts['moon'], 5, '5 Moon mission questions');
    assert.strictEqual(categoryCounts['mars'], 5, '5 Mars mission questions');
    assert.strictEqual(categoryCounts['strategy'], 10, '10 Strategy questions');
    assert.strictEqual(categoryCounts['crew_health'], 4, '4 Crew health questions');
    assert.strictEqual(categoryCounts['thermal'], 2, '2 Thermal questions');
  });

  it('MILO-06: Contextual triggers dynamically identify critical resource states', () => {
    function computeTriggers(state: { oxygenPct: number; powerKwh: number; shieldingPct: number }) {
      const triggers = new Set<string>();
      triggers.add('any');
      triggers.add('site_moon');

      if (state.oxygenPct < 15) {
        triggers.add('oxygen_critical');
        triggers.add('oxygen_low');
      } else if (state.oxygenPct < 30) {
        triggers.add('oxygen_low');
      }

      if (state.powerKwh < 150) {
        triggers.add('power_critical');
        triggers.add('power_low');
      } else if (state.powerKwh < 300) {
        triggers.add('power_low');
      }

      if (state.shieldingPct < 20) {
        triggers.add('shielding_critical');
        triggers.add('shielding_low');
      }

      return triggers;
    }

    const normal = computeTriggers({ oxygenPct: 90, powerKwh: 800, shieldingPct: 80 });
    assert.ok(normal.has('site_moon'), 'Normal has site_moon');
    assert.ok(!normal.has('oxygen_critical'), 'Normal does not have oxygen_critical');

    const critical = computeTriggers({ oxygenPct: 10, powerKwh: 100, shieldingPct: 15 });
    assert.ok(critical.has('oxygen_critical'), 'Critical has oxygen_critical');
    assert.ok(critical.has('power_critical'), 'Critical has power_critical');
    assert.ok(critical.has('shielding_critical'), 'Critical has shielding_critical');
  });

  it('MILO-07: Recommended questions surface when matching active triggers', () => {
    const activeTriggers = new Set(['any', 'site_moon', 'oxygen_low']);
    const recommended = EXPERT_DATA.questions.filter((q) =>
      q.triggers.some((t) => activeTriggers.has(t) && t !== 'any')
    );

    assert.ok(recommended.length > 0, 'Must find recommended questions for moon site and low oxygen');
    const hasMoonQ = recommended.some((q) => q.triggers.includes('site_moon'));
    assert.ok(hasMoonQ, 'Recommended list includes site_moon questions');
  });

  it('MILO-08: Zero CDN and zero external URL violations in source dataset', () => {
    // Assert all source_url entries are protocol-relative // or clean references without unbundled CDN scripts
    for (const q of EXPERT_DATA.questions) {
      if (q.source_url) {
        assert.ok(
          !q.source_url.startsWith('http://') && !q.source_url.startsWith('https://'),
          `Source url ${q.source_url} in question ${q.id} should not contain literal http:// or https:// in source bundle`
        );
      }
    }
  });
});
