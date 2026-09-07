import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';

export default function JobPostFormTranslateButton({ strings = [] }) {
    const { active, loading, error, langLabel, translateForm } = useJobPostFormTranslation();

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
            {error && <small className="text-danger d-block mt-1">{error}</small>}
        </div>
    );
}
