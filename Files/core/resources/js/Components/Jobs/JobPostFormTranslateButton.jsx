import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';

export default function JobPostFormTranslateButton({ strings = [] }) {
    const { active, loading, error, langLabel, translateForm, tx } = useJobPostFormTranslation();

    return (
        <div className="job-flow-translate-one">
            <button
                type="button"
                className="translatable-line__btn job-flow-translate-one__btn"
                disabled={loading}
                onClick={() => translateForm(strings)}
            >
                {loading ? '…' : active ? 'Original' : `Translate (${langLabel})`}
            </button>
            {error && (
                <small className={`d-block mt-1 ${error === 'Translation service is busy. Form labels are shown in Urdu where available.' ? 'text-warning' : 'text-danger'}`}>
                    {tx(error)}
                </small>
            )}
        </div>
    );
}
