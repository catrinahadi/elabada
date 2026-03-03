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

    // Define criteria: key, weight (as provided), and whether it's a benefit (true) or cost (false)
    const criteria = [
        { key: 'price', weight: weights.price || 0.1, isBenefit: false },
        { key: 'turnaroundTime', weight: weights.time || 0.1, isBenefit: false },
        { key: 'rating', weight: weights.rating || 0.1, isBenefit: true },
        { key: 'distance', weight: weights.distance || 0.1, isBenefit: false }
    ];

    // 1. Calculate the column norms once (Vector Normalization)
    const columnNorms = criteria.map(c => {
        const sumSq = shops.reduce((sum, s) => sum + Math.pow(s[c.key] || 0, 2), 0);
        return Math.sqrt(sumSq) || 1;
    });

    // 2. Calculate the weighted normalized decision matrix
    const weighted = shops.map(shop => {
        const vals = criteria.map((c, i) => {
            const normalized = (shop[c.key] || 0) / columnNorms[i];
            return normalized * c.weight;
        });
        return { id: shop.id, vals };
    });

    // 3. Determine the Ideal (V+) and Anti-Ideal (V-) solutions
    const ideal = criteria.map((c, i) => {
        const columnVals = weighted.map(w => w.vals[i]);
        return c.isBenefit ? Math.max(...columnVals) : Math.min(...columnVals);
    });

    const antiIdeal = criteria.map((c, i) => {
        const columnVals = weighted.map(w => w.vals[i]);
        return c.isBenefit ? Math.min(...columnVals) : Math.max(...columnVals);
    });

    // 4. Calculate separation and relative closeness
    return weighted.map(w => {
        const distIdeal = Math.sqrt(w.vals.reduce((sum, v, i) => sum + Math.pow(v - ideal[i], 2), 0));
        const distAntiIdeal = Math.sqrt(w.vals.reduce((sum, v, i) => sum + Math.pow(v - antiIdeal[i], 2), 0));

        // Closer to 1 means better performance
        const score = distAntiIdeal / (distIdeal + distAntiIdeal || 1);
        return { id: w.id, score };
    });
}
