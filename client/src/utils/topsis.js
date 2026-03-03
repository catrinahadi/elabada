/**
 * TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
 * A multi-criteria decision analysis method to rank laundry shops.
 * 
 * @param {Array} shops - Array of shop objects
 * @param {Object} weights - Object containing criterion weights (rating, price, time, distance)
 * @returns {Array} - Array of objects with shop ID and performance score
 */
export function calculateTopsis(shops, weights) {
    if (!shops || shops.length === 0) return [];

    const totalWeight =
        (weights.price || 0) +
        (weights.time || 0) +
        (weights.rating || 0) +
        (weights.distance || 0) || 1;

    const normalizedWeights = {
        price: (weights.price || 0.1) / totalWeight,
        time: (weights.time || 0.1) / totalWeight,
        rating: (weights.rating || 0.1) / totalWeight,
        distance: (weights.distance || 0.1) / totalWeight
    };

    const criteria = [
        { key: 'price', weight: normalizedWeights.price, isBenefit: false },
        { key: 'turnaroundTime', weight: normalizedWeights.time, isBenefit: false },
        { key: 'rating', weight: normalizedWeights.rating, isBenefit: true },
        { key: 'distance', weight: normalizedWeights.distance, isBenefit: false }
    ];

    const columnNorms = criteria.map(c => {
        const sumSq = shops.reduce((sum, s) => {
            const val = typeof s[c.key] === "number" ? s[c.key] : 0;
            return sum + Math.pow(val, 2);
        }, 0);
        return Math.sqrt(sumSq) || 1;
    });

    const weighted = shops.map(shop => {
        const vals = criteria.map((c, i) => {
            const val = typeof shop[c.key] === "number" ? shop[c.key] : 0;
            const normalized = val / columnNorms[i];
            return normalized * c.weight;
        });
        return { id: shop.id, vals };
    });

    const ideal = criteria.map((c, i) => {
        const columnVals = weighted.map(w => w.vals[i]);
        return c.isBenefit
            ? Math.max(...columnVals)
            : Math.min(...columnVals);
    });

    const antiIdeal = criteria.map((c, i) => {
        const columnVals = weighted.map(w => w.vals[i]);
        return c.isBenefit
            ? Math.min(...columnVals)
            : Math.max(...columnVals);
    });

    return weighted.map((w, shopIdx) => {
        const distIdeal = Math.sqrt(
            w.vals.reduce((sum, v, i) => sum + Math.pow(v - ideal[i], 2), 0)
        );

        const distAntiIdeal = Math.sqrt(
            w.vals.reduce((sum, v, i) => sum + Math.pow(v - antiIdeal[i], 2), 0)
        );

        const score =
            distAntiIdeal / (distIdeal + distAntiIdeal || 1);

        const shopData = shops[shopIdx];

        return {
            id: w.id,
            score,
            details: criteria.map((c, i) => ({
                criterion: c.key,
                weight: c.weight,
                actualValue: shopData[c.key],
                weightedValue: w.vals[i],
                idealValue: ideal[i],
                antiIdealValue: antiIdeal[i],
                isBenefit: c.isBenefit,
                // Simple percentage of how good this shop is in this specific criterion
                // For benefit: (val - min) / (max - min)
                // For cost: (max - val) / (max - min)
                rating: c.isBenefit
                    ? (w.vals[i] - antiIdeal[i]) / (ideal[i] - antiIdeal[i] || 1)
                    : (antiIdeal[i] - w.vals[i]) / (antiIdeal[i] - ideal[i] || 1)
            }))
        };
    });
}
