/**
 * TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
 * Implementation based on the 8-step algorithm:
 * 1. Identify Criteria
 * 2. Construct Decision Matrix
 * 3. Normalize the Matrix (Vector Normalization)
 * 4. Compute the Weighted Normalized Matrix
 * 5. Determine Ideal Best and Ideal Worst Values
 * 6. Compute Separation Distances
 * 7. Calculate the Closeness Coefficient
 * 8. Rank the Alternatives
 */
export function calculateTopsis(shops, weights, priorities = ['price', 'time', 'distance', 'rating']) {
    if (!shops || shops.length === 0) return [];

    // Step 1: Identify the Criteria (Key mapping and benefit/cost type)
    const allCriteria = [
        { key: 'price', weightKey: 'price', isBenefit: false },
        { key: 'turnaroundTime', weightKey: 'time', isBenefit: false },
        { key: 'rating', weightKey: 'rating', isBenefit: true },
        { key: 'distance', weightKey: 'distance', isBenefit: false }
    ];

    // Integrate priorities: Order criteria based on the priorities parameter
    // This dynamically adjusts the order of evaluation and result details
    const criteria = priorities.map(pKey => allCriteria.find(c => c.weightKey === pKey)).filter(Boolean);

    // Map weights (priorities) to the criteria
    const totalWeight = criteria.reduce((sum, c) => sum + (weights[c.weightKey] || 0), 0) || 1;
    const criterionWeights = criteria.map(c => (weights[c.weightKey] || 0) / totalWeight);

    // Step 2 & 3: Construct the Decision Matrix and Normalize the Matrix (Vector Normalization)
    const columnNorms = criteria.map(c => {
        const sumSq = shops.reduce((sum, s) => {
            let val = typeof s[c.key] === "number" ? s[c.key] : 0;
            
            // Truth-Adjustment: Use the same value for norm calculation
            if (c.key === 'turnaroundTime' && s.actualTurnaroundTime > s.turnaroundTime) {
                val = s.actualTurnaroundTime;
            }
            
            return sum + (val * val);
        }, 0);
        return Math.sqrt(sumSq) || 0.0001;
    });

    const normalizedMatrix = shops.map(shop => {
        return criteria.map((c, j) => {
            let val = typeof shop[c.key] === "number" ? shop[c.key] : 0;
            
            // Truth-Adjustment: If turnaroundTime, use actual if it's worse
            if (c.key === 'turnaroundTime' && shop.actualTurnaroundTime > shop.turnaroundTime) {
                val = shop.actualTurnaroundTime;
            }

            return val / columnNorms[j];
        });
    });

    // Step 4: Compute the Weighted Normalized Matrix
    const weightedNormalizedMatrix = normalizedMatrix.map(row => {
        return row.map((r_ij, j) => r_ij * criterionWeights[j]);
    });

    // Step 5: Determine Ideal Best (A+) and Ideal Worst (A-) Values
    const idealBest = criteria.map((c, j) => {
        const columnVals = weightedNormalizedMatrix.map(row => row[j]);
        return c.isBenefit ? Math.max(...columnVals) : Math.min(...columnVals);
    });

    const idealWorst = criteria.map((c, j) => {
        const columnVals = weightedNormalizedMatrix.map(row => row[j]);
        return c.isBenefit ? Math.min(...columnVals) : Math.max(...columnVals);
    });

    // Separation distances and scores
    return weightedNormalizedMatrix.map((row, i) => {
        const distToBest = Math.sqrt(
            row.reduce((sum, v_ij, j) => sum + Math.pow(v_ij - idealBest[j], 2), 0)
        );

        const distToWorst = Math.sqrt(
            row.reduce((sum, v_ij, j) => sum + Math.pow(v_ij - idealWorst[j], 2), 0)
        );

        const totalSeparation = distToBest + distToWorst;
        const closenessCoefficient = totalSeparation === 0 ? 0 : distToWorst / (totalSeparation || 0.0001);

        return {
            id: shops[i].id || shops[i]._id,
            score: closenessCoefficient,
            details: criteria.map((c, j) => {
                const val = row[j];
                const best = idealBest[j];
                const worst = idealWorst[j];

                // Relative "rating" (0 to 1) for this specific criterion
                // Measures how close this shop is to the ideal best compared to the worst for THIS criterion
                let relativeRating = 0;
                if (Math.abs(best - worst) < 0.0001) {
                    relativeRating = 1.0; // All shops are equal in this criterion
                } else {
                    relativeRating = c.isBenefit
                        ? (val - worst) / (best - worst)
                        : (worst - val) / (worst - best);
                }

                let displayValue = shops[i][c.key];
                if (c.key === 'turnaroundTime' && shops[i].actualTurnaroundTime > shops[i].turnaroundTime) {
                    displayValue = shops[i].actualTurnaroundTime;
                }

                return {
                    criterion: c.key,
                    weight: criterionWeights[j],
                    actualValue: displayValue,
                    normalizedValue: val,
                    idealBest: best,
                    idealWorst: worst,
                    isBenefit: c.isBenefit,
                    rating: Math.max(0, Math.min(1, relativeRating))
                };
            })
        };
    });
}
