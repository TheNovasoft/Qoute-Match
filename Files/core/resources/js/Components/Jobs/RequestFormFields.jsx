import { laymanHintForField } from '@/utils/fieldHints';

function acceptForExtensions(extensions) {
    if (!extensions) return undefined;
    return extensions
        .split(',')
        .map((ext) => `.${ext.trim()}`)
        .join(',');
}

export default function RequestFormFields({ fields, values, onChange, errors = {} }) {
    if (!fields?.length) {
        return null;
    }

    const setValue = (label, value) => onChange(label, value);

    const toggleCheckbox = (label, option, checked) => {
        const current = values[label] || [];
        setValue(
            label,
            checked ? [...current, option] : current.filter((item) => item !== option),
        );
    };

    return (
        <div className="row request-form-fields gy-3">
            {fields.map((field) => {
                const colClass = `col-md-${field.width || '12'}`;
                const value = values[field.label];
                const error = errors[field.label];
                const laymanHint = field.instruction || laymanHintForField(field.name);

                return (
                    <div className={colClass} key={field.label}>
                        <div className="form-group">
                            <label className="form--label">
                                {field.name}
                                {laymanHint && (
                                    <small className="text-muted ms-1" title={laymanHint}>
                                        <i className="fas fa-info-circle"></i>
                                    </small>
                                )}
                                {field.isRequired && ['checkbox', 'radio'].includes(field.type) && (
                                    <span className="text--danger"> *</span>
                                )}
                            </label>
                            {laymanHint && (
                                <small className="text-muted d-block mb-2">{laymanHint}</small>
                            )}

                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    className="form-control form--control"
                                    value={value ?? ''}
                                    onChange={(e) => setValue(field.label, e.target.value)}
                                    required={field.isRequired}
                                />
                            )}

                            {field.type === 'email' && (
                                <input
                                    type="email"
                                    className="form-control form--control"
                                    value={value ?? ''}
                                    onChange={(e) => setValue(field.label, e.target.value)}
                                    required={field.isRequired}
                                />
                            )}

                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    className="form-control form--control"
                                    value={value ?? ''}
                                    onChange={(e) => setValue(field.label, e.target.value)}
                                    step="any"
                                    required={field.isRequired}
                                />
                            )}

                            {field.type === 'date' && (
                                <input
                                    type="date"
                                    className="form-control form--control"
                                    value={value ?? ''}
                                    onChange={(e) => setValue(field.label, e.target.value)}
                                    required={field.isRequired}
                                />
                            )}

                            {field.type === 'textarea' && (
                                <textarea
                                    className="form-control form--control"
                                    value={value ?? ''}
                                    onChange={(e) => setValue(field.label, e.target.value)}
                                    required={field.isRequired}
                                />
                            )}

                            {field.type === 'select' && (
                                <select
                                    className="form-select form--control"
                                    value={value ?? ''}
                                    onChange={(e) => setValue(field.label, e.target.value)}
                                    required={field.isRequired}
                                >
                                    <option value="">Select one</option>
                                    {field.options.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {field.type === 'radio' && (
                                <div className="d-flex gap-3 flex-wrap">
                                    {field.options.map((option) => (
                                        <div className="form-check" key={option}>
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={field.label}
                                                id={`${field.label}_${option}`}
                                                value={option}
                                                checked={value === option}
                                                onChange={() => setValue(field.label, option)}
                                                required={field.isRequired}
                                            />
                                            <label className="form-check-label" htmlFor={`${field.label}_${option}`}>
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {field.type === 'checkbox' && (
                                <div className="d-flex gap-3 flex-wrap">
                                    {field.options.map((option) => (
                                        <div className="form-check" key={option}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`${field.label}_${option}`}
                                                checked={(value || []).includes(option)}
                                                onChange={(e) => toggleCheckbox(field.label, option, e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor={`${field.label}_${option}`}>
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {field.type === 'file' && (
                                <>
                                    {field.existingFileUrl && (
                                        <p className="mb-2">
                                            <small className="text--success">
                                                <i className="las la-paperclip"></i> File uploaded —{' '}
                                                <a href={field.existingFileUrl} target="_blank" rel="noreferrer">
                                                    View current file
                                                </a>
                                            </small>
                                        </p>
                                    )}
                                    <input
                                        type="file"
                                        className="form-control form--control"
                                        accept={acceptForExtensions(field.extensions)}
                                        onChange={(e) => setValue(field.label, e.target.files[0] || null)}
                                        required={field.isRequired && !field.existingFileUrl}
                                    />
                                    {field.extensions && (
                                        <small className="text-muted d-block mt-1">Supported: {field.extensions}</small>
                                    )}
                                </>
                            )}

                            {error && <small className="text-danger d-block mt-1">{error}</small>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
