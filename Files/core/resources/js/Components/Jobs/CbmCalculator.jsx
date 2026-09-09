import { useEffect, useMemo, useRef, useState } from 'react';
import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';
import {
    buildCbmApiPayload,
    calculateCbmResults,
    formatStoredCbmValue,
    mapCbmApiResponse,
    parseStoredCbmValue,
    UOM_OPTIONS,
    WEIGHT_UNIT_OPTIONS,
} from '@/utils/cbmCalculations';

function ResultField({ label, value, suffix = '', tx, labelExtra = '' }) {
    return (
        <div className="col-md-6 col-lg-4">
            <label className="form-label text-muted small mb-1">
                {tx(label)}
                {labelExtra ? ` — ${tx(labelExtra)}` : ''}
            </label>
            <input
                type="text"
                className="form-control form--control bg-light"
                value={value !== null && value !== undefined && value !== '' ? `${value}${suffix}` : '—'}
                readOnly
            />
        </div>
    );
}

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

export default function CbmCalculator({
    value = '',
    onChange,
    instruction,
    weightKg = null,
    onWeightChange = null,
    hideWeightInput = false,
    compact = false,
}) {
    const { tx } = useJobPostFormTranslation();
    const initial = parseStoredCbmValue(value);
    const [uom, setUom] = useState(initial.uom || 'cm');
    const [length, setLength] = useState(initial.length);
    const [width, setWidth] = useState(initial.width);
    const [height, setHeight] = useState(initial.height);
    const [weight, setWeight] = useState(() => (
        weightKg !== null && weightKg !== undefined && weightKg !== ''
            ? String(weightKg)
            : initial.weight
    ));
    const [weightUnit, setWeightUnit] = useState(initial.weightUnit || 'kg');
    const [qty, setQty] = useState(initial.qty || '1');
    const [apiResults, setApiResults] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calcError, setCalcError] = useState('');
    const skipFirstSync = useRef(true);
    const requestId = useRef(0);
    const useExternalWeight = hideWeightInput || typeof onWeightChange === 'function';
    const effectiveWeight = useExternalWeight ? weightKg : weight;

    useEffect(() => {
        if (weightKg !== null && weightKg !== undefined && weightKg !== '') {
            setWeight(String(weightKg));
        }
    }, [weightKg]);

    const fallbackResults = useMemo(() => calculateCbmResults({
        length,
        width,
        height,
        uom,
        weight: effectiveWeight,
        weightUnit,
        qty,
    }), [length, width, height, uom, effectiveWeight, weightUnit, qty]);

    useEffect(() => {
        const payload = buildCbmApiPayload({
            length,
            width,
            height,
            uom,
            weight: effectiveWeight,
            weightUnit,
            qty,
        });

        if (!payload) {
            setApiResults(null);
            setCalcError('');
            setIsCalculating(false);
            return undefined;
        }

        const currentRequest = ++requestId.current;
        setIsCalculating(true);
        setCalcError('');

        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch('/tools/cbm/calculate', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify(payload),
                });

                if (currentRequest !== requestId.current) {
                    return;
                }

                if (!response.ok) {
                    throw new Error('Calculation request failed.');
                }

                const data = await response.json();
                const mapped = mapCbmApiResponse(data);

                if (!mapped) {
                    throw new Error('Calculation returned no results.');
                }

                setApiResults(mapped);
                setCalcError('');
            } catch (error) {
                if (currentRequest !== requestId.current) {
                    return;
                }

                setApiResults(null);
                setCalcError('Live calculation unavailable. Showing local estimate.');
            } finally {
                if (currentRequest === requestId.current) {
                    setIsCalculating(false);
                }
            }
        }, 350);

        return () => window.clearTimeout(timer);
    }, [length, width, height, uom, effectiveWeight, weightUnit, qty]);

    const results = apiResults || fallbackResults;

    useEffect(() => {
        if (skipFirstSync.current) {
            skipFirstSync.current = false;
            return;
        }

        const next = results
            ? formatStoredCbmValue({
                length,
                width,
                height,
                uom,
                weight: effectiveWeight,
                weightUnit,
                qty,
                results,
            })
            : '';

        if (next !== value) {
            onChange(next);
        }
    }, [
        results,
        length,
        width,
        height,
        uom,
        effectiveWeight,
        weightUnit,
        qty,
        value,
        onChange,
    ]);

    const handleWeightChange = (nextValue) => {
        setWeight(nextValue);
        if (onWeightChange) {
            onWeightChange(nextValue);
        }
    };

    const uomLabel = UOM_OPTIONS.find((option) => option.value === uom)?.label || uom;

    if (compact) {
        return (
            <div className="cbm-calculator cbm-calculator--compact">
                <div className="row g-2 align-items-end">
                    <div className="col-3">
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="form-control form--control form-control-sm"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            placeholder={tx('L cm')}
                        />
                    </div>
                    <div className="col-3">
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="form-control form--control form-control-sm"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            placeholder={tx('W cm')}
                        />
                    </div>
                    <div className="col-3">
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="form-control form--control form-control-sm"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder={tx('H cm')}
                        />
                    </div>
                    <div className="col-3">
                        <input
                            type="number"
                            min="1"
                            step="1"
                            className="form-control form--control form-control-sm"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder={tx('Qty')}
                        />
                    </div>
                </div>
                {results && (
                    <small className="text-muted d-block mt-2">
                        {results.volumeM3} m³ · {results.volumetricWeightSeaKg} kg vol (sea)
                    </small>
                )}
            </div>
        );
    }

    return (
        <div className="cbm-calculator border rounded p-3 p-md-4 bg-white">
            {instruction && <p className="text-muted small mb-3">{tx(instruction)}</p>}

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <h6 className="mb-0">{tx('Inputs')}</h6>
                <span className="badge text-bg-light border text-dark">{tx('Mode: Cubic Meter (m³)')}</span>
            </div>

            <div className="row gy-3">
                <div className="col-md-2 col-6">
                    <label className="form-label">{tx('UOM')}</label>
                    <select
                        className="form-select form--control form-control-lg"
                        value={uom}
                        onChange={(e) => setUom(e.target.value)}
                    >
                        {UOM_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{tx(option.label)}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2 col-6">
                    <label className="form-label">{tx('Length')}</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        className="form-control form--control form-control-lg"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="100"
                    />
                </div>
                <div className="col-md-2 col-6">
                    <label className="form-label">{tx('Width')}</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        className="form-control form--control form-control-lg"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="80"
                    />
                </div>
                <div className="col-md-2 col-6">
                    <label className="form-label">{tx('Height')}</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        className="form-control form--control form-control-lg"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="60"
                    />
                </div>
                {!useExternalWeight && (
                    <>
                        <div className="col-md-2 col-6">
                            <label className="form-label">{tx('Weight')}</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                className="form-control form--control form-control-lg"
                                value={weight}
                                onChange={(e) => handleWeightChange(e.target.value)}
                                placeholder="25"
                            />
                        </div>
                        <div className="col-md-2 col-6">
                            <label className="form-label">{tx('Unit')}</label>
                            <select
                                className="form-select form--control form-control-lg"
                                value={weightUnit}
                                onChange={(e) => setWeightUnit(e.target.value)}
                            >
                                {WEIGHT_UNIT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{tx(option.label)}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                <div className={`col-md-2 col-6 ${useExternalWeight ? 'col-lg-2' : ''}`}>
                    <label className="form-label">{tx('Qty')}</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control form--control form-control-lg"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="1"
                    />
                </div>
            </div>

            <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <h6 className="mb-0">{tx('Results')}</h6>
                    {isCalculating && <span className="text-muted small">{tx('Calculating…')}</span>}
                </div>
                {calcError && (
                    <p className="text-warning small mb-3">{tx(calcError)}</p>
                )}
                {results ? (
                    <div className="row gy-3">
                        <ResultField tx={tx} label="Volume (Cubic Meter)" labelExtra={uomLabel} value={results.volumeM3} suffix=" m³" />
                        <ResultField tx={tx} label="Volume (Cubic Feet)" value={results.volumeFt3} suffix=" ft³" />
                        <ResultField tx={tx} label="Weight (Kg)" value={results.totalWeightKg} suffix=" kg" />
                        <ResultField tx={tx} label="Weight (lb)" value={results.totalWeightLb} suffix=" lb" />
                        <ResultField tx={tx} label="Volumetric Weight Sea (Kg)" value={results.volumetricWeightSeaKg} suffix=" kg" />
                        <ResultField tx={tx} label="Volumetric Weight Sea (lb)" value={results.volumetricWeightSeaLb} suffix=" lb" />
                        <ResultField tx={tx} label="Volumetric Weight Air (Kg)" value={results.volumetricWeightAirKg} suffix=" kg" />
                        <ResultField tx={tx} label="Volumetric Weight Air (lb)" value={results.volumetricWeightAirLb} suffix=" lb" />
                        <ResultField tx={tx} label="20 Feet Container" value={results.container20} suffix={` ${tx('units')}`} />
                        <ResultField tx={tx} label="40 Feet Container" value={results.container40} suffix={` ${tx('units')}`} />
                        <ResultField tx={tx} label="40 Feet HC Container" value={results.container40hc} suffix={` ${tx('units')}`} />
                    </div>
                ) : (
                    <p className="text-muted mb-0">{tx('Enter length, width, and height to calculate CBM, volumetric weight, and container capacity.')}</p>
                )}
            </div>

            <p className="text-muted small mt-3 mb-0">
                {tx('Sea freight volumetric weight uses L × W × H (cm) ÷ 5000. Air freight uses ÷ 6000. Container counts use standard shipping container dimensions.')}
            </p>
        </div>
    );
}
