/**
 * TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
 * STRICT ACADEMIC IMPLEMENTATION (NO MODIFICATIONS)
 */

export function calculateTopsis(shops, weights) {
    if (!shops || shops.length === 0) return [];

    // 1. Define criteria (fixed academic structure)
    const criteria = [
        { key: 'price', weightKey: 'price', isBenefit: false },
        { key: 'turnaroundTime', weightKey: 'time', isBenefit: false },
        { key: 'distance', weightKey: 'distance', isBenefit: false },
        { key: 'rating', weightKey: 'rating', isBenefit: true }
    ];

    // 2. Normalize weights (must sum to 1)
    const totalWeight = criteria.reduce(
        (sum, c) => sum + (weights[c.weightKey] || 0),
        0
    ) || 1;

    const normalizedWeights = criteria.map(
        c => (weights[c.weightKey] || 0) / totalWeight
    );

    // 3. Construct decision matrix (RAW VALUES ONLY — no modification)
    const decisionMatrix = shops.map(shop =>
        criteria.map(c => {
            const value = shop[c.key];
            return typeof value === "number" ? value : 0;
        })
    );

    // 4. Vector normalization
    const columnNorms = criteria.map((_, j) => {
        const sumSq = decisionMatrix.reduce(
            (sum, row) => sum + row[j] ** 2,
            0
        );
        return Math.sqrt(sumSq) || 1;
    });

    const normalizedMatrix = decisionMatrix.map(row =>
        row.map((val, j) => val / columnNorms[j])
    );

    // 5. Weighted normalized matrix
    const weightedMatrix = normalizedMatrix.map(row =>
        row.map((val, j) => val * normalizedWeights[j])
    );

    // 6. Ideal best and worst
    const idealBest = criteria.map((c, j) => {
        const column = weightedMatrix.map(row => row[j]);
        return c.isBenefit ? Math.max(...column) : Math.min(...column);
    });

    const idealWorst = criteria.map((c, j) => {
        const column = weightedMatrix.map(row => row[j]);
        return c.isBenefit ? Math.min(...column) : Math.max(...column);
    });

    // 7. Separation measures
    const results = weightedMatrix.map((row, i) => {
        const distToBest = Math.sqrt(
            row.reduce(
                (sum, val, j) => sum + (val - idealBest[j]) ** 2,
                0
            )
        );

        const distToWorst = Math.sqrt(
            row.reduce(
                (sum, val, j) => sum + (val - idealWorst[j]) ** 2,
                0
            )
        );

        const score =
            distToBest + distToWorst === 0
                ? 0
                : distToWorst / (distToBest + distToWorst);

        return {
            id: shops[i].id || shops[i]._id,
            score,

            details: criteria.map((c, j) => ({
                criterion: c.key,
                weight: normalizedWeights[j],
                rawValue: decisionMatrix[i][j],
                normalizedValue: normalizedMatrix[i][j],
                weightedValue: weightedMatrix[i][j],
                idealBest: idealBest[j],
                idealWorst: idealWorst[j],
                isBenefit: c.isBenefit
            }))
        };
    });

    // 8. Rank results (highest score = best)
    return results.sort((a, b) => b.score - a.score);
}