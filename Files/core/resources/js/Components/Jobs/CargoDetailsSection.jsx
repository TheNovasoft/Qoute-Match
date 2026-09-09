import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import CbmCalculator from '@/Components/Jobs/CbmCalculator';
import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';
import WizardOptionCard from '@/Components/Jobs/WizardOptionCard';
import { formatStoredCbmBoxes, parseStoredCbmBoxes } from '@/utils/cbmCalculations';

function FieldError({ message, tx }) {
    if (!message) {
        return null;
    }

    return <small className="text-danger d-block mt-1">{tx ? tx(message) : message}</small>;
}

function inputClass(hasError) {
    return `form-control form--control${hasError ? ' is-invalid' : ''}`;
}

export default function CargoDetailsSection({
    step,
    data,
    errors,
    onChange,
    onSelectSingle,
    variant = 'flow',
}) {
    const { tx } = useJobPostFormTranslation();
    const cbmField = step.cbmField;
    const cbmValue = data[cbmField] || '';
    const effectiveContainer = data.container_type || (step.includeContainerType ? 'Full Container' : '');
    const isLcl = effectiveContainer === 'LCL';
    const showCbm = step.includeContainerType
        ? isLcl
        : (!effectiveContainer || isLcl);
    const isWizard = variant === 'wizard';

    const [lclPackMode, setLclPackMode] = useState(() => {
        const boxes = parseStoredCbmBoxes(cbmValue);
        return boxes.length > 1 ? 'multiple' : 'same';
    });
    const [boxValues, setBoxValues] = useState(() => {
        const boxes = parseStoredCbmBoxes(cbmValue);
        return boxes.length ? boxes : [''];
    });
    const [enteringBoxIndex, setEnteringBoxIndex] = useState(null);
    const boxRefs = useRef([]);
    const scrollLockRef = useRef(null);
    const lclPackModeRef = useRef(lclPackMode);

    lclPackModeRef.current = lclPackMode;

    useEffect(() => {
        if (step.includeContainerType && !data.container_type && onSelectSingle) {
            onSelectSingle('container_type', 'Full Container');
        }
    }, [step.includeContainerType, data.container_type, onSelectSingle]);

    const lockScrollPosition = useCallback(() => {
        scrollLockRef.current = window.scrollY;
    }, []);

    const syncCbmField = useCallback((nextBoxes, multiple) => {
        const formatted = formatStoredCbmBoxes(nextBoxes, { multiple });
        onChange(cbmField, formatted);
    }, [cbmField, onChange]);


    const handleContainerSelect = (value) => {
        onSelectSingle('container_type', value);
        if (value === 'Full Container') {
            setLclPackMode('same');
            setBoxValues(['']);
            onChange(cbmField, '');
        }
    };

    const handlePackModeChange = (mode) => {
        setLclPackMode(mode);
        if (mode === 'same') {
            const nextBoxes = [boxValues[0] || ''];
            setBoxValues(nextBoxes);
            syncCbmField(nextBoxes, false);
            return;
        }

        const nextBoxes = boxValues.length ? [...boxValues] : [''];
        setBoxValues(nextBoxes);
        syncCbmField(nextBoxes, true);
    };

    const handleBoxChange = (index, value) => {
        lockScrollPosition();
        setBoxValues((prev) => {
            const nextBoxes = [...prev];
            nextBoxes[index] = value;
            syncCbmField(nextBoxes, lclPackModeRef.current === 'multiple');
            return nextBoxes;
        });
    };

    const handleAddBox = (event) => {
        event.preventDefault();
        lockScrollPosition();
        const nextIndex = boxValues.length;
        setBoxValues((prev) => [...prev, '']);
        setEnteringBoxIndex(nextIndex);
    };

    useEffect(() => {
        if (enteringBoxIndex === null) {
            return undefined;
        }

        const timer = window.setTimeout(() => setEnteringBoxIndex(null), 400);
        return () => window.clearTimeout(timer);
    }, [enteringBoxIndex]);

    useLayoutEffect(() => {
        if (scrollLockRef.current === null) {
            return;
        }

        const lockedY = scrollLockRef.current;
        scrollLockRef.current = null;
        window.scrollTo({ top: lockedY, behavior: 'auto' });
    }, [boxValues, cbmValue]);

    const containerOptions = [
        { value: 'Full Container', label: 'Full Container (FCL)' },
        { value: 'LCL', label: 'LCL (Less than Container Load)' },
    ];

    const packModeOptions = [
        { value: 'same', label: 'Same products' },
        { value: 'multiple', label: 'Multiple different products' },
    ];

    const boxesToRender = lclPackMode === 'multiple' ? boxValues : [boxValues[0] || ''];

    return (
        <>
            {step.includeContainerType && (
                <div className={isWizard ? 'col-12' : 'col-12'}>
                    <label className={`${isWizard ? 'form-label' : 'job-flow-title-desc__label mb-2'}`}>
                        {tx('Container type')}
                    </label>
                    <div className="job-wizard-cards">
                        {containerOptions.map((opt) => (
                            <WizardOptionCard
                                key={opt.value}
                                label={tx(opt.label)}
                                selected={String(data.container_type || 'Full Container') === opt.value}
                                onClick={() => handleContainerSelect(opt.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className={isWizard ? 'col-md-6' : 'col-md-6'}>
                {isWizard && <label className="form-label">{step.hsMeta?.name || tx('HS code')}</label>}
                <input
                    type="text"
                    className={isWizard
                        ? `form-control form--control form-control-lg${errors[step.hsField] ? ' is-invalid' : ''}`
                        : inputClass(errors[step.hsField])}
                    placeholder={isWizard ? 'e.g. 8471.30' : tx('HS code')}
                    value={data[step.hsField] || ''}
                    onChange={(e) => onChange(step.hsField, e.target.value)}
                />
                {isWizard && step.hsMeta?.instruction && (
                    <small className="text-muted d-block mt-1">{step.hsMeta.instruction}</small>
                )}
                <FieldError message={errors[step.hsField]} tx={tx} />
            </div>

            <div className={isWizard ? 'col-md-6' : 'col-md-6'}>
                {isWizard && <label className="form-label">{step.weightMeta?.name || tx('Weight (kg)')}</label>}
                <input
                    type="number"
                    min="0"
                    step="any"
                    className={isWizard
                        ? `form-control form--control form-control-lg${errors[step.weightField] ? ' is-invalid' : ''}`
                        : inputClass(errors[step.weightField])}
                    placeholder={isWizard ? 'e.g. 500' : tx('Weight (kg)')}
                    value={data[step.weightField] || ''}
                    onChange={(e) => onChange(step.weightField, e.target.value)}
                />
                {isWizard && step.weightMeta?.instruction && (
                    <small className="text-muted d-block mt-1">{step.weightMeta.instruction}</small>
                )}
                <FieldError message={errors[step.weightField]} tx={tx} />
            </div>

            {showCbm && isLcl && (
                <div className="col-12">
                    <div className="lcl-pack-toggle" role="radiogroup" aria-label={tx('LCL packing')}>
                        {packModeOptions.map((opt) => (
                            <WizardOptionCard
                                key={opt.value}
                                label={tx(opt.label)}
                                selected={lclPackMode === opt.value}
                                onClick={() => handlePackModeChange(opt.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showCbm && boxesToRender.map((boxValue, index) => (
                <div
                    className={`col-12 cargo-box-item${enteringBoxIndex === index ? ' cargo-box-item--enter' : ''}`}
                    key={`cargo-box-${index}`}
                    ref={(element) => {
                        boxRefs.current[index] = element;
                    }}
                >
                    {lclPackMode === 'multiple' && (
                        <h6 className="cargo-box-item__title mb-2">{tx('Box')} {index + 1}</h6>
                    )}
                    {isWizard && lclPackMode === 'same' && (
                        <label className="form-label">{step.cbmMeta?.name}</label>
                    )}
                    <CbmCalculator
                        key={`cbm-${index}-${lclPackMode}`}
                        value={boxValue}
                        onChange={(value) => handleBoxChange(index, value)}
                        weightKg={data[step.weightField] || ''}
                        hideWeightInput
                    />
                </div>
            ))}

            {showCbm && isLcl && lclPackMode === 'multiple' && (
                <div className="col-12">
                    <button
                        type="button"
                        className="cargo-add-box-btn"
                        onClick={handleAddBox}
                    >
                        + {tx('Add box')}
                    </button>
                </div>
            )}

            {showCbm && (
                <div className="col-12">
                    <FieldError message={errors[cbmField]} tx={tx} />
                </div>
            )}
        </>
    );
}
