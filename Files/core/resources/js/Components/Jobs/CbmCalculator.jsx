import { useEffect, useMemo, useRef, useState } from 'react';

function parseStoredValue(value) {
    if (!value || typeof value !== 'string') {
        return { length: '', width: '', height: '', units: '1' };
    }

    const match = value.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*cm/i);
    if (!match) {
        return { length: '', width: '', height: '', units: '1' };
    }

    return {
        length: match[1],
        width: match[2],
        height: match[3],
        units: '1',
    };
}

function formatCbmValue(length, width, height, units, cbm) {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);
    const qty = Math.max(1, Number(units) || 1);

    if (!l || !w || !h) {
        return '';
    }

    return `${l} x ${w} x ${h} cm (${cbm} CBM${qty > 1 ? `, ${qty} units` : ''})`;
}

export default function CbmCalculator({ value = '', onChange, instruction }) {
    const initial = parseStoredValue(value);
    const [length, setLength] = useState(initial.length);
    const [width, setWidth] = useState(initial.width);
    const [height, setHeight] = useState(initial.height);
    const [units, setUnits] = useState(initial.units);
    const skipFirstSync = useRef(true);

    const cbm = useMemo(() => {
        const l = Number(length);
        const w = Number(width);
        const h = Number(height);
        const qty = Math.max(1, Number(units) || 1);

        if (!l || !w || !h) {
            return null;
        }

        const total = ((l * w * h) / 1_000_000) * qty;
        return Math.round(total * 1000) / 1000;
    }, [length, width, height, units]);

    useEffect(() => {
        if (skipFirstSync.current) {
            skipFirstSync.current = false;
            return;
        }

        const next = cbm !== null
            ? formatCbmValue(length, width, height, units, cbm)
            : '';

        if (next !== value) {
            onChange(next);
        }
    }, [cbm, length, width, height, units, value, onChange]);

    return (
        <div className="cbm-calculator">
            {instruction && <p className="text-muted small mb-3">{instruction}</p>}
            <div className="row gy-3">
                <div className="col-md-3 col-6">
                    <label className="form-label">Length (cm)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="form-control form--control form-control-lg"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="120"
                    />
                </div>
                <div className="col-md-3 col-6">
                    <label className="form-label">Width (cm)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="form-control form--control form-control-lg"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="80"
                    />
                </div>
                <div className="col-md-3 col-6">
                    <label className="form-label">Height (cm)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="form-control form--control form-control-lg"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="60"
                    />
                </div>
                <div className="col-md-3 col-6">
                    <label className="form-label">Units</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control form--control form-control-lg"
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                        placeholder="1"
                    />
                </div>
            </div>
            <div className="cbm-calculator__result mt-3">
                {cbm !== null ? (
                    <strong>Calculated volume: {cbm} CBM</strong>
                ) : (
                    <span className="text-muted">Enter dimensions to calculate CBM.</span>
                )}
            </div>
        </div>
    );
}
