import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import JobCard from '@/Components/Jobs/JobCard';
import Pagination, { EmptyState } from '@/Components/Shared/Pagination';

export default function Jobs({
    pageTitle,
    seo,
    jobs,
    categories,
    subcategories,
    counting,
    filters,
    invitedBy,
    totalJobs = 0,
}) {
    const [localFilters, setLocalFilters] = useState({
        min_budget: filters.min_budget || '',
        max_budget: filters.max_budget || '',
        category_id: filters.category_id || '',
        subcategory_id: filters.subcategory_id || [],
        project_scope: filters.project_scope || [],
        skill_level: filters.skill_level || [],
        search: filters.search || '',
        buyer: filters.buyer || '',
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get('/jobs', localFilters, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timer);
    }, [localFilters]);

    const toggleArrayValue = (key, value) => {
        setLocalFilters((prev) => {
            const current = prev[key] || [];
            const exists = current.includes(String(value));
            return {
                ...prev,
                [key]: exists ? current.filter((item) => item !== String(value)) : [...current, String(value)],
            };
        });
    };

    const totalCategoryJobs = totalJobs || categories.reduce((sum, cat) => sum + (cat.jobsCount || 0), 0);

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <div className="job-category-section">
                <div className="container">
                    <div className="job-category-wrapper">
                        <div className="category-sidebar">
                            <span className="sidebar-filter__close d-xl-none d-flex"><i className="las la-times"></i></span>
                            <div className="accordion sidebar--acordion">
                                <div className="filter-block">
                                    <div className="accordion-item">
                                        <h2 className="accordion-header">
                                            <button className="accordion-button" data-bs-toggle="collapse" data-bs-target="#budget" type="button">
                                                Budget
                                            </button>
                                        </h2>
                                        <div className="accordion-collapse show collapse" id="budget">
                                            <div className="accordion-body">
                                                <div className="project-value">
                                                    <input className="form--control" type="number" placeholder="Min"
                                                        value={localFilters.min_budget}
                                                        onChange={(e) => setLocalFilters({ ...localFilters, min_budget: e.target.value })} />
                                                    <span className="project-value__text">to</span>
                                                    <input className="form--control" type="number" placeholder="Max"
                                                        value={localFilters.max_budget}
                                                        onChange={(e) => setLocalFilters({ ...localFilters, max_budget: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-block">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button" data-bs-toggle="collapse" data-bs-target="#category" type="button">
                                            Categories
                                        </button>
                                    </h2>
                                    <div className="accordion-collapse show collapse" id="category">
                                        <div className="accordion-body">
                                            <ul className="filter-block__list category">
                                                <li className="filter-block__item">
                                                    <div className="form--check">
                                                        <input className="form-check-input" type="radio" id="subcat_all" name="category_id"
                                                            checked={!localFilters.category_id}
                                                            onChange={() => setLocalFilters({ ...localFilters, category_id: '' })} />
                                                        <label className="form-check-label" htmlFor="subcat_all">
                                                            <span className="label-text">All</span>
                                                            <span className="label-text"> ({totalCategoryJobs})</span>
                                                        </label>
                                                    </div>
                                                </li>
                                                {categories.map((category) => (
                                                    <li key={category.id} className="filter-block__item">
                                                        <div className="form--check">
                                                            <input className="form-check-input" type="radio" id={`subcat_${category.id}`}
                                                                checked={String(localFilters.category_id) === String(category.id)}
                                                                onChange={() => setLocalFilters({ ...localFilters, category_id: String(category.id) })} />
                                                            <label className="form-check-label" htmlFor={`subcat_${category.id}`}>
                                                                <span className="label-text">{category.name}</span>
                                                                <span className="label-text"> ({category.jobsCount})</span>
                                                            </label>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-block">
                                    <div className="accordion-item">
                                        <h2 className="accordion-header">
                                            <button className="accordion-button" data-bs-toggle="collapse" data-bs-target="#subcategory" type="button">
                                                Specialities
                                            </button>
                                        </h2>
                                        <div className="accordion-collapse show collapse" id="subcategory">
                                            <div className="accordion-body">
                                                <ul className="filter-block__list">
                                                    {subcategories.map((subcategory) => (
                                                        <li key={subcategory.id} className="filter-block__item">
                                                            <div className="form--check">
                                                                <input className="form-check-input" type="checkbox" id={`sub_${subcategory.id}`}
                                                                    checked={localFilters.subcategory_id.includes(String(subcategory.id))}
                                                                    onChange={() => toggleArrayValue('subcategory_id', subcategory.id)} />
                                                                <label className="form-check-label" htmlFor={`sub_${subcategory.id}`}>
                                                                    <span className="label-text">{subcategory.name}</span>
                                                                    <span className="label-text"> ({subcategory.jobsCount})</span>
                                                                </label>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-block">
                                    <div className="accordion-item">
                                        <h2 className="accordion-header">
                                            <button className="accordion-button" data-bs-toggle="collapse" data-bs-target="#scope" type="button">
                                                Project Scope
                                            </button>
                                        </h2>
                                        <div className="accordion-collapse show collapse" id="scope">
                                            <div className="accordion-body">
                                                <ul className="filter-block__list">
                                                    {[
                                                        { id: 'large', value: '1', label: 'Large', count: counting.large },
                                                        { id: 'medium', value: '2', label: 'Medium', count: counting.medium },
                                                        { id: 'small', value: '3', label: 'Small', count: counting.small },
                                                    ].map((scope) => (
                                                        <li key={scope.id} className="filter-block__item">
                                                            <div className="form--check">
                                                                <input className="form-check-input" type="checkbox" id={scope.id}
                                                                    checked={localFilters.project_scope.includes(scope.value)}
                                                                    onChange={() => toggleArrayValue('project_scope', scope.value)} />
                                                                <label className="form-check-label" htmlFor={scope.id}>
                                                                    <span className="label-text">{scope.label}</span>
                                                                    <span className="label-text"> ({scope.count})</span>
                                                                </label>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-block">
                                    <div className="accordion-item">
                                        <h2 className="accordion-header">
                                            <button className="accordion-button" data-bs-toggle="collapse" data-bs-target="#level" type="button">
                                                Experience Level
                                            </button>
                                        </h2>
                                        <div className="accordion-collapse show collapse" id="level">
                                            <div className="accordion-body">
                                                <ul className="filter-block__list">
                                                    {[
                                                        { id: 'pro-level', value: '1', label: 'Pro Level', count: counting.pro },
                                                        { id: 'expert', value: '2', label: 'Expert', count: counting.expert },
                                                        { id: 'intermediate', value: '3', label: 'Intermediate', count: counting.intermediate },
                                                        { id: 'entry', value: '4', label: 'Entry', count: counting.entry },
                                                    ].map((level) => (
                                                        <li key={level.id} className="filter-block__item">
                                                            <div className="form--check">
                                                                <input className="form-check-input" type="checkbox" id={level.id}
                                                                    checked={localFilters.skill_level.includes(level.value)}
                                                                    onChange={() => toggleArrayValue('skill_level', level.value)} />
                                                                <label className="form-check-label" htmlFor={level.id}>
                                                                    <span className="label-text">{level.label}</span>
                                                                    <span className="label-text"> ({level.count})</span>
                                                                </label>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="job-category-body">
                            <div className="job-category-body__bar d-xl-none d-block">
                                <span className="job-category-body__bar-icon"><i className="las la-list"></i></span>
                            </div>
                            <div className="job-category-body__top">
                                <div className="search-container">
                                    <input className="form--control" type="search" placeholder="Type job keyword"
                                        value={localFilters.search}
                                        onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })} />
                                    <span className="search-container__icon"><i className="las la-search"></i></span>
                                </div>
                            </div>
                            {invitedBy && (
                                <div className="alert alert-info mb-3">
                                    Showing active requests from <strong>{invitedBy.name}</strong>.
                                </div>
                            )}
                            <div className="job-category-body__content">
                                {jobs.data?.length ? jobs.data.map((job) => (
                                    <JobCard key={job.id} job={job} />
                                )) : (
                                    <EmptyState message="No job found!" />
                                )}
                                {jobs.links?.length > 3 && <Pagination links={jobs.links} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}
