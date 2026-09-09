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
                        <div className="filter-wrapper">
                            <div className="filter-wrapper__content">
                                <span className="filter-wrapper__content-title">Filter</span>
                                <form className="filter-form filter-form--stacked" onSubmit={submit}>
                                    <select className="form-select form--control" name="rating" defaultValue={filters.rating || '0'}>
                                        <option value="0">All Star</option>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={n}>{n} Star</option>
                                        ))}
                                    </select>
                                    <select className="form-select form--control" name="skill" defaultValue={filters.skill || ''}>
                                        <option value="">Skills</option>
                                        {skills.map((skill) => (
                                            <option key={skill.id} value={skill.id}>{skill.name}</option>
                                        ))}
                                    </select>
                                    <select className="form-select form--control" name="sort" defaultValue={filters.sort || 'recommended'}>
                                        <option value="recommended">Recommended</option>
                                        <option value="rating">Highest rating</option>
                                        <option value="earning">Top earning</option>
                                    </select>
                                    <input className="form-control form--control" name="search" type="search"
                                        defaultValue={filters.search || ''} placeholder="Search Talent" />
                                    <button className="btn btn--base" type="submit">
                                        <i className="las la-filter"></i>
                                    </button>
                                    {saveSearch?.url && (
                                        <button className="btn btn-outline--base filter-save-btn" type="button" onClick={saveCurrentSearch}>
                                            Save Search
                                        </button>
                                    )}
                                </form>
                            </div>
                            <div className="filter-wrapper__right d-none d-lg-block">
                                <p className="filter-wrapper__right-text">{freelancers.meta?.total || 0} result</p>
                            </div>
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
