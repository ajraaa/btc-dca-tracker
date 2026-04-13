/**
 * Largest Triangle Three Buckets (LTTB) downsampling algorithm.
 *
 * Reduces a large dataset to `threshold` points while preserving the
 * visual shape of the data. Points flagged as "preserved" (e.g. user
 * purchase points) are always kept and do not count toward the budget.
 *
 * Reference: Sveinn Steinarsson – "Downsampling Time Series for Visual
 * Representation" (2013).
 */

export interface LTTBPoint {
  /** Numeric x-value (typically a timestamp). */
  x: number
  /** Numeric y-value (the metric to preserve visually). */
  y: number
  /** When true the point is always included in the output. */
  preserve?: boolean
  /** Original index – attached internally so we can reconstruct order. */
  _idx?: number
}

/**
 * Down-sample `data` to at most `threshold` points using LTTB.
 *
 * Points with `preserve === true` are **always** included in the result
 * regardless of the budget.  The remaining budget is distributed across
 * the non-preserved points using the standard LTTB bucketing strategy.
 *
 * @param data      – The full dataset, must be sorted by `x`.
 * @param threshold – Desired number of non-preserved output points.
 *                     If the non-preserved count is already ≤ threshold
 *                     the original array is returned as-is.
 * @returns A new array (subset of `data`) in the original order.
 */
export function lttb<T extends LTTBPoint>(data: T[], threshold: number): T[] {
  // Tag every point with its original index so we can restore order later.
  const tagged = data.map((p, i) => ({ ...p, _idx: i }))

  // Separate preserved (must-keep) points from the rest.
  const preserved = tagged.filter(p => p.preserve)
  const candidates = tagged.filter(p => !p.preserve)

  // Nothing to downsample.
  if (candidates.length <= threshold || threshold < 3) {
    return data
  }

  // ----- Standard LTTB on `candidates` -----
  const sampled: (T & { _idx: number })[] = []

  // Always keep the first and last candidate.
  sampled.push(candidates[0])

  const bucketSize = (candidates.length - 2) / (threshold - 2)

  let prevSelected = candidates[0]

  for (let i = 1; i < threshold - 1; i++) {
    // Determine the current bucket range.
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1
    const bucketEnd = Math.min(Math.floor(i * bucketSize) + 1, candidates.length - 1)

    // Determine the *next* bucket's average (used as the third vertex).
    const nextBucketStart = Math.floor(i * bucketSize) + 1
    const nextBucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, candidates.length - 1)

    let avgX = 0
    let avgY = 0
    let nextCount = 0
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += candidates[j].x
      avgY += candidates[j].y
      nextCount++
    }
    if (nextCount > 0) {
      avgX /= nextCount
      avgY /= nextCount
    }

    // Pick the point in the current bucket that forms the largest triangle
    // with `prevSelected` and the next-bucket average.
    let maxArea = -1
    let bestPoint = candidates[bucketStart]

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (prevSelected.x - avgX) * (candidates[j].y - prevSelected.y) -
        (prevSelected.x - candidates[j].x) * (avgY - prevSelected.y),
      ) * 0.5

      if (area > maxArea) {
        maxArea = area
        bestPoint = candidates[j]
      }
    }

    sampled.push(bestPoint)
    prevSelected = bestPoint
  }

  // Always keep the last candidate.
  sampled.push(candidates[candidates.length - 1])

  // Merge preserved + sampled, sort back to original order, and strip helper field.
  const merged = [...preserved, ...sampled].sort((a, b) => a._idx! - b._idx!)

  // Return clean copies (remove _idx).
  return merged.map(({ _idx, ...rest }) => rest as unknown as T)
}
