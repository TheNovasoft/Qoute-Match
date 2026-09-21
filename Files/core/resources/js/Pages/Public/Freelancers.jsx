import { router } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import SectionRenderer, { FreelancerCard } from '@/Components/Sections/SectionRenderer';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';

export default function Freelancers({ pageTitle, seo, sections, freelancers, skills, filters, saveSearch }) {
    const submit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        router.get('/providers', Object.fromEntries(formData), { preserveState: true });
    };

    const saveCurrentSearch = () => {
        if (!saveSearch?.url) return;
        router.post(saveSearch.url, {
            type: saveSearch.type || 'providers',
            filters: {
                rating: filters?.rating || '',
                skill: filters?.skill || '',
                search: filters?.search || '',
                sort: filters?.sort || 'recommended',
            },
        }, { preserveScroll: true });
    };

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <div className="talent-main-section mb-120 mt-60">
                <div className="talent-section my-60">
                    <div className="container">
                        <div className="filter-wrapper talent-filter-panel">
                            <div className="talent-filter-panel__head">
                                <div>
                                    <h5 className="talent-filter-panel__title mb-1">Find talent</h5>
                                    <p className="text-muted mb-0 small">Filter by rating, skill, or search by name</p>
                                </div>
                                <p className="talent-filter-panel__count mb-0">
                                    <strong>{freelancers.meta?.total || 0}</strong> providers
                                </p>
                            </div>
                            <form className="talent-filter-panel__form filter-form" onSubmit={submit}>
                                <div className="talent-filter-panel__field">
                                    <label className="form--label">Minimum rating</label>
                                    <select className="form-select form--control" name="rating" defaultValue={filters.rating || '0'}>
                                        <option value="0">All ratings</option>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={n}>{n}+ stars</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="talent-filter-panel__field">
                                    <label className="form--label">Skill</label>
                                    <select className="form-select form--control" name="skill" defaultValue={filters.skill || ''}>
                                        <option value="">All skills</option>
                                        {skills.map((skill) => (
                                            <option key={skill.id} value={skill.id}>{skill.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="talent-filter-panel__field">
                                    <label className="form--label">Sort</label>
                                    <select className="form-select form--control" name="sort" defaultValue={filters.sort || 'recommended'}>
                                        <option value="recommended">Recommended</option>
                                        <option value="rating">Highest rating</option>
                                        <option value="earning">Top earning</option>
                                    </select>
                                </div>
                                <div className="talent-filter-panel__field talent-filter-panel__field--search">
                                    <label className="form--label">Search</label>
                                    <input
                                        className="form-control form--control"
                                        name="search"
                                        type="search"
                                        defaultValue={filters.search || ''}
                                        placeholder="Name or keyword"
                                    />
                                </div>
                                <div className="talent-filter-panel__actions">
                                    <button className="btn btn--base w-100" type="submit">
                                        <i className="las la-search me-1" aria-hidden="true" />
                                        Apply
                                    </button>
                                    {saveSearch?.url && (
                                        <button className="btn btn-outline--base w-100 filter-save-btn" type="button" onClick={saveCurrentSearch}>
                                            Save search
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="row gy-4 justify-content-center">
                            {freelancers.data?.length ? freelancers.data.map((freelancer) => (
                                <div key={freelancer.username} className="col-xl-3 col-sm-6">
                                    <FreelancerCard freelancer={freelancer} />
                                </div>
                            )) : (
                                <div className="col-12"><EmptyState message="Talents not found!" /></div>
                            )}
                            {freelancers.links?.length > 3 && (
                                <div className="col-12"><Pagination links={freelancers.links} /></div>
                            )}
                        </div>
                    </div>
                </div>
                <SectionRenderer sections={sections} />
            </div>
        </FrontendLayout>
    );
}
