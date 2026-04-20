function calculateTopsis(shops) {
  const weights = {
    rating: 0.4,        // benefit
    distance: 0.2,      // cost
    price: 0.2,         // cost
    turnaroundTime: 0.2 // cost
  };

  const matrix = shops.map((shop) => [
    shop.rating,
    shop.distance,
    shop.price,
    shop.turnaroundTime
  ]);

  const columns = matrix[0].length;

  // Step 1: Pre-calculate identifiers for normalization (avoid O(N^2) loop)
  const columnDenominators = Array(columns).fill(0).map((_, j) => {
    return Math.sqrt(matrix.reduce((sum, r) => sum + Math.pow(r[j], 2), 0)) || 1;
  });

  // Step 1: Normalize
  const normalized = matrix.map((row) =>
    row.map((value, j) => value / columnDenominators[j])
  );

  // Step 2: Apply weights
  const weighted = normalized.map((row) => [
    row[0] * weights.rating,
    row[1] * weights.distance,
    row[2] * weights.price,
    row[3] * weights.turnaroundTime
  ]);

  // Step 3: Ideal best & worst
  const idealBest = [
    Math.max(...weighted.map((r) => r[0])), // rating (benefit)
    Math.min(...weighted.map((r) => r[1])), // distance (cost)
    Math.min(...weighted.map((r) => r[2])), // price (cost)
    Math.min(...weighted.map((r) => r[3]))  // turnaround (cost)
  ];

  const idealWorst = [
    Math.min(...weighted.map((r) => r[0])),
    Math.max(...weighted.map((r) => r[1])),
    Math.max(...weighted.map((r) => r[2])),
    Math.max(...weighted.map((r) => r[3]))
  ];

  // Step 4: Distances & Score
  return weighted.map((row, i) => {
    const distanceBest = Math.sqrt(
      row.reduce((sum, value, j) => sum + Math.pow(value - idealBest[j], 2), 0)
    );

    const distanceWorst = Math.sqrt(
      row.reduce((sum, value, j) => sum + Math.pow(value - idealWorst[j], 2), 0)
    );

    const score = distanceWorst / (distanceBest + distanceWorst);

    return {
      id: shops[i].id,
      score
    };
  });
}

module.exports = { calculateTopsis };
