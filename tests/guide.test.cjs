const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load() {
  const context = { window: {}, console };
  vm.createContext(context);
  for (const file of ['resources', 'qualifications', 'surveyFlow', 'template']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', `${file}.js`), 'utf8'), context);
  }
  return context;
}
test('every reachable answer resolves to a result with resources', () => {
  const { window: w } = load();
  const ids = new Set(w.qualificationsData.map(q => q.id));
  assert.equal(ids.size, w.qualificationsData.length);
  let results = 0;
  function visit(id, answers = {}, depth = 0) {
    assert.ok(depth < 10, 'flow must not cycle');
    if (id.startsWith('end_')) {
      const key = id.slice(4);
      assert.ok(ids.has(key), `missing qualification ${key}`);
      assert.ok(w.uniqueResources[key]?.length, `missing resources ${key}`);
      results++;
      return;
    }
    const step = w.surveyFlow.find(q => q.id === id);
    assert.ok(step, `missing step ${id}`);
    for (const option of step.options) {
      const value = typeof option === 'string' ? option : option.value;
      const nextAnswers = { ...answers, [id]: value };
      visit(step.next.call(step, value, nextAnswers), nextAnswers, depth + 1);
    }
  }
  visit(w.surveyFlow[0].id);
  assert.equal(results, 102);
});
test('Singapore dates include the entire closing day and update at midnight', () => {
  const c = load();
  const timeline = { start: '2026-12-16', end: '2027-02-17' };
  for (const [instant, expected] of [
    ['2026-12-15T23:59:59+08:00', 'upcoming'],
    ['2026-12-16T00:00:00+08:00', 'open'],
    ['2027-02-17T12:00:00+08:00', 'open'],
    ['2027-02-17T23:59:59+08:00', 'open'],
    ['2027-02-18T00:00:00+08:00', 'closed']
  ]) assert.equal(c.applicationStatus(timeline, new Date(instant)), expected);
  assert.equal(c.applicationStatus({ start: '2027-02-18', end: '2027-03-19', openingNote: 'Late Afternoon' }, new Date('2027-02-18T18:00:00+08:00')), 'opening-day');
});
test('verified cycle dates and transfer TBC remain intact', () => {
  const { window: w } = load();
  const transfer = w.qualificationsData.find(q => q.id === 'transfer');
  assert.equal(transfer.periods[0].rangeText, 'TBC');
  assert.equal(transfer.periods[1].rangeText, '2 February 2027 to 14 February 2027');
  for (const q of w.qualificationsData.filter(q => q.timeline)) {
    assert.ok(q.timeline.start <= q.timeline.end);
    assert.ok(q.timeline.end.startsWith('2027-'));
  }
});
