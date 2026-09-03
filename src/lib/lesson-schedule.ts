export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB;
}
