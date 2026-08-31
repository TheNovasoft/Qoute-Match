const FIELD_HINTS = {
    'hs code': 'Harmonised System code — a number customs uses to classify your goods for import/export.',
    cbm: 'Cubic metres — total volume of your shipment (length × width × height in metres).',
    'gross weight': 'Total weight including packaging and pallets, in kilograms.',
    'net weight': 'Weight of the goods only, without packaging.',
    incoterms: 'Who pays for shipping, insurance, and customs — e.g. FOB, CIF, DDP.',
    'container type': 'Size of shipping container — e.g. 20ft, 40ft, or LCL (less than full container).',
    'port of loading': 'Where the goods will be picked up or shipped from.',
    'port of discharge': 'Where the goods should arrive or be delivered.',
    dimensions: 'Length, width, and height of each item or pallet.',
    postcode: 'Your UK postcode — providers use this to see if they cover your area.',
    'service area': 'Towns or postcodes where you can work or deliver.',
};

export function laymanHintForField(name = '') {
    const key = name.trim().toLowerCase();
    return FIELD_HINTS[key] ?? null;
}
