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

    // Define criteria: key, weight (0.1 to 1.0), and whether it's a benefit (true) or cost (false)
    const criteria = [
        { key: 'price', weight: (weights.price || 0.1) / 100, isBenefit: false },
        { key: 'turnaroundTime', weight: (weights.time || 0.1) / 100, isBenefit: false },
        { key: 'rating', weight: (weights.rating || 0.1) / 100, isBenefit: true },
        { key: 'distance', weight: (weights.distance || 0.1) / 100, isBenefit: false }
    ];

    // 1. Calculate the norm for each criterion (Vector Normalization)
    const normalized = shops.map(shop => {
        const norms = criteria.map(c => {
            const val = shop[c.key];
            const sumSq = shops.reduce((sum, s) => sum + Math.pow(s[c.key], 2), 0);
            return val / Math.sqrt(sumSq || 1);
        });
        return { id: shop.id, norms };
    });

    // 2. Calculate the weighted normalized decision matrix
    const weighted = normalized.map(n => ({
        id: n.id,
        vals: n.norms.map((v, i) => v * criteria[i].weight)
    }));

    // 3. Determine the Ideal (V+) and Anti-Ideal (V-) solutions
    const ideal = criteria.map((c, i) => {
        const vals = weighted.map(w => w.vals[i]);
        return c.isBenefit ? Math.max(...vals) : Math.min(...vals);
    });

    const antiIdeal = criteria.map((c, i) => {
        const vals = weighted.map(w => w.vals[i]);
        return c.isBenefit ? Math.min(...vals) : Math.max(...vals);
    });

    // 4. Calculate the separation measures and the relative closeness to the ideal solution
    return weighted.map(w => {
        const distIdeal = Math.sqrt(w.vals.reduce((sum, v, i) => sum + Math.pow(v - ideal[i], 2), 0));
        const distAntiIdeal = Math.sqrt(w.vals.reduce((sum, v, i) => sum + Math.pow(v - antiIdeal[i], 2), 0));

        // Performance score (Si* = Di- / (Di+ + Di-))
        // Closer to 1 means closer to the ideal solution
        const score = distAntiIdeal / (distIdeal + distAntiIdeal || 1);

        return { id: w.id, score };
    });
}
