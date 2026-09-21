const CM_PER_METER = 100;
const CM_PER_MM = 0.1;
const FT3_PER_M3 = 35.314666721;
const LB_PER_KG = 2.2046226218;
const SEA_VOLUMETRIC_DIVISOR = 5000;
const AIR_VOLUMETRIC_DIVISOR = 6000;

export const UOM_OPTIONS = [
    { value: 'mm', label: 'mm' },
    { value: 'cm', label: 'cm' },
    { value: 'meter', label: 'meter' },
];

export const WEIGHT_UNIT_OPTIONS = [
    { value: 'kg', label: 'Kg' },
    { value: 'gm', label: 'Gm' },
    { value: 'lb', label: 'Lb' },
];

export const CONTAINERS = {
    ft20: { label: '20 Feet Container', length: 589, width: 230, height: 230 },
    ft40: { label: '40 Feet Container', length: 1200, width: 230, height: 230 },
    ft40hc: { label: '40 Feet HC Container', length: 1200, width: 230, height: 260 },
};

export function toCentimeters(value, uom) {
    const amount = Number(value);
    if (!amount || amount <= 0) {
        return 0;
    }

    switch (uom) {
        case 'mm':
            return amount * CM_PER_MM;
        case 'meter':
            return amount * CM_PER_METER;
        case 'cm':
        default:
            return amount;
    }
}

export function toKilograms(value, unit) {
    const amount = Number(value);
    if (!amount || amount <= 0) {
        return 0;
    }

    if (unit === 'gm') {
        return amount / 1000;
    }
    if (unit === 'lb') {
        return amount / LB_PER_KG;
    }

    return amount;
}

function round(value, decimals = 3) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function permuteDimensions(length, width, height) {
    const dims = [length, width, height];

    return [
        [dims[0], dims[1], dims[2]],
        [dims[0], dims[2], dims[1]],
        [dims[1], dims[0], dims[2]],
        [dims[1], dims[2], dims[0]],
        [dims[2], dims[0], dims[1]],
        [dims[2], dims[1], dims[0]],
    ];
}

export function countCartonsInContainer(cartonLength, cartonWidth, cartonHeight, container) {
    if (!cartonLength || !cartonWidth || !cartonHeight) {
        return 0;
    }

    let maxCount = 0;

    permuteDimensions(cartonLength, cartonWidth, cartonHeight).forEach(([length, width, height]) => {
        const alongLength = Math.floor(container.length / length);
        const alongWidth = Math.floor(container.width / width);
        const alongHeight = Math.floor(container.height / height);
        const count = alongLength * alongWidth * alongHeight;

        if (count > maxCount) {
            maxCount = count;
        }
    });

    return maxCount;
}

export function calculateCbmResults({
    length,
    width,
    height,
    uom = 'cm',
    weight = '',
    weightUnit = 'kg',
    qty = 1,
}) {
    const lengthCm = toCentimeters(length, uom);
    const widthCm = toCentimeters(width, uom);
    const heightCm = toCentimeters(height, uom);
    const quantity = Math.max(1, Number(qty) || 1);
    const unitWeightKg = toKilograms(weight, weightUnit);

    if (!lengthCm || !widthCm || !heightCm) {
        return null;
    }

    const cubicCm = lengthCm * widthCm * heightCm;
    const volumeM3 = round((cubicCm / 1_000_000) * quantity, 3);
    const volumeFt3 = round(volumeM3 * FT3_PER_M3, 3);
    const totalWeightKg = round(unitWeightKg * quantity, 3);
    const totalWeightLb = totalWeightKg > 0 ? round(totalWeightKg * LB_PER_KG, 3) : null;
    const volumetricWeightSeaKg = round((cubicCm / SEA_VOLUMETRIC_DIVISOR) * quantity, 3);
    const volumetricWeightSeaLb = round(volumetricWeightSeaKg * LB_PER_KG, 3);
    const volumetricWeightAirKg = round((cubicCm / AIR_VOLUMETRIC_DIVISOR) * quantity, 3);
    const volumetricWeightAirLb = round(volumetricWeightAirKg * LB_PER_KG, 3);

    return {
        lengthCm: round(lengthCm, 3),
        widthCm: round(widthCm, 3),
        heightCm: round(heightCm, 3),
        quantity,
        volumeM3,
        volumeFt3,
        totalWeightKg: totalWeightKg > 0 ? totalWeightKg : null,
        totalWeightLb,
        volumetricWeightSeaKg,
        volumetricWeightSeaLb,
        volumetricWeightAirKg,
        volumetricWeightAirLb,
        container20: countCartonsInContainer(lengthCm, widthCm, heightCm, CONTAINERS.ft20),
        container40: countCartonsInContainer(lengthCm, widthCm, heightCm, CONTAINERS.ft40),
        container40hc: countCartonsInContainer(lengthCm, widthCm, heightCm, CONTAINERS.ft40hc),
    };
}

export const CBM_MULTI_BOX_SEPARATOR = ' || ';

export function parseStoredCbmBoxes(value) {
    if (!value || typeof value !== 'string') {
        return [''];
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return [''];
    }

    if (/Box\s+\d+:/i.test(trimmed)) {
        return trimmed
            .split(CBM_MULTI_BOX_SEPARATOR)
            .map((segment) => {
                const match = segment.trim().match(/^Box\s+\d+:\s*(.+)$/i);
                return match ? match[1].trim() : segment.trim();
            })
            .filter(Boolean);
    }

    return [trimmed];
}

export function formatStoredCbmBoxes(boxValues, { multiple = false } = {}) {
    const filled = (boxValues || []).map((value) => String(value || '').trim()).filter(Boolean);
    if (!filled.length) {
        return '';
    }

    if (!multiple || filled.length === 1) {
        return filled[0];
    }

    return filled.map((value, index) => `Box ${index + 1}: ${value}`).join(CBM_MULTI_BOX_SEPARATOR);
}

export function parseStoredCbmValue(value) {
    const defaults = {
        length: '',
        width: '',
        height: '',
        uom: 'cm',
        weight: '',
        weightUnit: 'kg',
        qty: '1',
    };

    if (!value || typeof value !== 'string') {
        return defaults;
    }

    const dimensionMatch = value.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm|meter)?/i);
    if (!dimensionMatch) {
        return defaults;
    }

    const parsed = {
        ...defaults,
        length: dimensionMatch[1],
        width: dimensionMatch[2],
        height: dimensionMatch[3],
        uom: (dimensionMatch[4] || 'cm').toLowerCase(),
    };

    const weightMatch = value.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
        parsed.weight = weightMatch[1];
        parsed.weightUnit = 'kg';
    }

    const qtyMatch = value.match(/(?:qty|units?)\s*(\d+)/i);
    if (qtyMatch) {
        parsed.qty = qtyMatch[1];
    } else {
        const legacyQtyMatch = value.match(/,\s*(\d+)\s*units?\)/i);
        if (legacyQtyMatch) {
            parsed.qty = legacyQtyMatch[1];
        }
    }

    return parsed;
}

export function formatStoredCbmValue({
    length,
    width,
    height,
    uom,
    weight,
    weightUnit,
    qty,
    results,
}) {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);

    if (!l || !w || !h || !results) {
        return '';
    }

    const uomLabel = uom || 'cm';
    const quantity = Math.max(1, Number(qty) || 1);
    const weightKg = toKilograms(weight, weightUnit);

    const parts = [
        `${l} x ${w} x ${h} ${uomLabel}`,
    ];

    if (weightKg > 0) {
        parts.push(`${round(weightKg, 3)} kg`);
    }

    parts.push(`qty ${quantity}`);
    parts.push(`${results.volumeM3} m³`);
    parts.push(`${results.volumeFt3} ft³`);
    parts.push(`vol sea ${results.volumetricWeightSeaKg} kg`);
    parts.push(`vol air ${results.volumetricWeightAirKg} kg`);
    parts.push(`20ft: ${results.container20}`);
    parts.push(`40ft: ${results.container40}`);
    parts.push(`40HC: ${results.container40hc}`);

    return parts.join(' | ');
}

export function buildCbmApiPayload({
    length,
    width,
    height,
    uom = 'cm',
    weight = '',
    weightUnit = 'kg',
    qty = 1,
}) {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);

    if (!l || !w || !h) {
        return null;
    }

    const weightAmount = Number(weight) > 0 ? Number(weight) : 0;
    let apiWeight = weightAmount;
    let apiWeightUnit = weightUnit;

    if (weightAmount > 0 && weightUnit === 'lb') {
        apiWeight = round(toKilograms(weightAmount, 'lb'), 3);
        apiWeightUnit = 'kg';
    }

    return {
        lv: l,
        bv: w,
        hv: h,
        qv: Math.max(1, Number(qty) || 1),
        uom,
        wv: apiWeight,
        wu: apiWeightUnit,
    };
}

export function mapCbmApiResponse(response) {
    if (!response || response.vm === null || response.vm === undefined) {
        return null;
    }

    return {
        volumeM3: response.vm,
        volumeFt3: response.vft,
        totalWeightKg: response.wkg,
        totalWeightLb: response.wlb,
        volumetricWeightSeaKg: response.wvkgsea,
        volumetricWeightSeaLb: response.wvlbsea,
        volumetricWeightAirKg: response.wvkgair,
        volumetricWeightAirLb: response.wvlbair,
        container20: response.max20qty,
        container40: response.max40qty,
        container40hc: response.maxhc40qty,
    };
}
