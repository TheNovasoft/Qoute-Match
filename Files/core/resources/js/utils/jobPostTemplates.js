function isFreightCategoryName(name = '') {
    const lower = name.toLowerCase();
    return lower.includes('freight') || lower.includes('logistic') || lower.includes('shipping');
}

export function getJobPostTemplate(category, subcategory) {
    const categoryName = category?.name || 'Service';
    const subcategoryName = subcategory?.name || '';
    const label = subcategoryName || categoryName;

    if (isFreightCategoryName(categoryName)) {
        return {
            title: `${label} quote`,
            description: `I need a freight quote for ${label}. Origin: ___ → Destination: ___. Cargo: ___. Weight/volume: ___. Please send your best rate and transit time.`,
        };
    }

    return {
        title: `${label} quote`,
        description: `I need help with ${label}. Location: ___. Please describe what you need and send your quote.`,
    };
}
