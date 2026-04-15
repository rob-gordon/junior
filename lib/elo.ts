export const DEFAULT_K = 32;

export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

export function updateElo(
  winnerElo: number,
  loserElo: number,
  k: number = DEFAULT_K,
): { winner: number; loser: number } {
  const expectedWinner = expectedScore(winnerElo, loserElo);
  const expectedLoser = expectedScore(loserElo, winnerElo);
  return {
    winner: winnerElo + k * (1 - expectedWinner),
    loser: loserElo + k * (0 - expectedLoser),
  };
}
