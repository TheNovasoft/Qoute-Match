import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Shared admin list filter bar: search + optional selects + date.
 * Uses query-string params that Eloquent searchable()/filter()/dateFilter() already read.
 */
export default function AdminFilterBar({
    actionUrl,
    searchPlaceholder = 'Search…',
    statusOptions = null,
    priorityOptions = null,
    extraParams = {},
}) {
    const pageUrl = usePage().url || '';
    const params = new URLSearchParams(pageUrl.includes('?') ? pageUrl.split('?')[1] : '');
    const rawDate = params.get('date') || '';
    const initialDate = rawDate.includes(' - ') ? rawDate.split(' - ')[0].trim() : (rawDate.match(/^\d{4}-\d{2}-\d{2}/) ? rawDate.slice(0, 10) : '');

    const [search, setSearch] = useState(params.get('search') || '');
    const [status, setStatus] = useState(params.get('status') ?? '');
    const [priority, setPriority] = useState(params.get('priority') ?? '');
    const [date, setDate] = useState(initialDate);

    const submit = (event) => {
        event.preventDefault();
        const query = {
            ...extraParams,
            search: search || undefined,
            status: status !== '' ? status : undefined,
            priority: priority !== '' ? priority : undefined,
            // Searchable dateFilter expects "start - end" (may use hyphen ranges)
            date: date ? `${date} - ${date}` : undefined,
        };
        Object.keys(query).forEach((key) => {
            if (query[key] === undefined || query[key] === '') delete query[key];
        });
        router.get(actionUrl, query, { preserveState: true, preserveScroll: true, replace: true });
    };

    const reset = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setDate('');
        router.get(actionUrl, { ...extraParams }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <form className="admin-filter-bar card shadow-sm mb-3" onSubmit={submit}>
            <div className="card-body py-3">
                <div className="row g-2 align-items-end">
                    <div className="col-md-4 col-lg-3">
                        <label className="form-label small text-muted mb-1">Search</label>
                        <input
                            type="search"
                            className="form-control form--control"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {statusOptions && (
                        <div className="col-6 col-md-3 col-lg-2">
                            <label className="form-label small text-muted mb-1">Status</label>
                            <select className="form-control form--control" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All</option>
                                {statusOptions.map((opt) => (
                                    <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {priorityOptions && (
                        <div className="col-6 col-md-3 col-lg-2">
                            <label className="form-label small text-muted mb-1">Priority</label>
                            <select className="form-control form--control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="">All</option>
                                {priorityOptions.map((opt) => (
                                    <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="col-6 col-md-3 col-lg-2">
                        <label className="form-label small text-muted mb-1">Date</label>
                        <input type="date" className="form-control form--control" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-auto d-flex gap-2">
                        <button type="submit" className="btn btn--primary btn-sm">Filter</button>
                        <button type="button" className="btn btn-outline--dark btn-sm" onClick={reset}>Reset</button>
                    </div>
                </div>
            </div>
        </form>
    );
}
