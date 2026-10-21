import test from "node:test";
import assert from "node:assert/strict";
import { chicagoDate, interviewDays, interviewStreaks } from "../src/lib/interviewCalendar.ts";

const now = new Date("2026-10-09T18:00:00Z");
test("empty activity gives zero streaks", () => {
  assert.deepEqual(interviewStreaks([], now), { current: 0, longest: 0, activeDays: 0 });
});
test("groups completions by Chicago day and excludes future or invalid dates", () => {
  const days = interviewDays(["2026-10-09T02:00:00Z", "2026-10-08T18:00:00Z", "2026-10-09T17:00:00Z", "invalid", "2026-10-10T18:00:00Z"], now);
  assert.deepEqual(days, [{ date: "2026-10-08", count: 2 }, { date: "2026-10-09", count: 1 }]);
  assert.equal(chicagoDate(new Date("2026-11-02T05:30:00Z")), "2026-11-01");
});
test("multiple interviews per day count as a single streak day", () => {
  assert.deepEqual(interviewStreaks([{ date: "2026-10-07", count: 3 }, { date: "2026-10-08", count: 2 }, { date: "2026-10-09", count: 1 }], now), { current: 3, longest: 3, activeDays: 3 });
});
test("yesterday keeps the current streak alive, older activity does not", () => {
  assert.equal(interviewStreaks([{ date: "2026-10-08", count: 1 }], now).current, 1);
  assert.equal(interviewStreaks([{ date: "2026-10-07", count: 1 }], now).current, 0);
});
test("longest streak survives gaps and crosses month and DST boundaries", () => {
  const days = ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-05"].map(date => ({ date, count: 1 }));
  assert.deepEqual(interviewStreaks(days, new Date("2026-11-05T18:00:00Z")), { current: 1, longest: 4, activeDays: 5 });
});
