export function calculateTopsis(shops) {
  const weights = {
    rating: 0.4,
    distance: 0.2,
    price: 0.2,
    turnaroundTime: 0.2
  };

  const matrix = shops.map((shop) => [
    shop.rating,
    shop.distance,
    shop.price,
    shop.turnaroundTime
  ]);

  const normalized = matrix.map((row) =>
    row.map((value, j) => {
      const denominator = Math.sqrt(
        matrix.reduce((sum, r) => sum + Math.pow(r[j], 2), 0)
      );
      return value / denominator;
    })
  );

  const weighted = normalized.map((row) => [
    row[0] * weights.rating,
    row[1] * weights.distance,
    row[2] * weights.price,
    row[3] * weights.turnaroundTime
  ]);

  const idealBest = [
    Math.max(...weighted.map((r) => r[0])),
    Math.min(...weighted.map((r) => r[1])),
    Math.min(...weighted.map((r) => r[2])),
    Math.min(...weighted.map((r) => r[3]))
  ];

  const idealWorst = [
    Math.min(...weighted.map((r) => r[0])),
    Math.max(...weighted.map((r) => r[1])),
    Math.max(...weighted.map((r) => r[2])),
    Math.max(...weighted.map((r) => r[3]))
  ];

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