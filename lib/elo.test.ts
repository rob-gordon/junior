import { test, expect } from "bun:test";
import { expectedScore, updateElo } from "./elo";

test("equal players have 0.5 expected score", () => {
  expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
});

test("higher rated player has higher expected score", () => {
  expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
  expect(expectedScore(1000, 1200)).toBeLessThan(0.5);
});

test("equal players exchange 16 points on K=32", () => {
  const { winner, loser } = updateElo(1000, 1000);
  expect(winner).toBeCloseTo(1016, 5);
  expect(loser).toBeCloseTo(984, 5);
});

test("upset rewards underdog more than favorite victory", () => {
  const upset = updateElo(1000, 1400);
  const favored = updateElo(1400, 1000);
  const underdogGain = upset.winner - 1000;
  const favoriteGain = favored.winner - 1400;
  expect(underdogGain).toBeGreaterThan(favoriteGain);
});

test("total Elo is conserved", () => {
  const { winner, loser } = updateElo(1234, 987);
  expect(winner + loser).toBeCloseTo(1234 + 987, 5);
});
