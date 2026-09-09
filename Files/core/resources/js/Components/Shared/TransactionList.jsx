import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Pagination from '@/Components/Shared/Pagination';

export default function TransactionList({ transactions, indexUrl, exportUrl }) {
    const rows = transactions?.data ?? [];
    const remarks = transactions?.remarks ?? [];
    const [showFilter, setShowFilter] = useState(false);
    const { data, setData } = useForm({
        search: '',
        trx_type: '',
        remark: '',
    });

    const submitFilter = (event) => {
        event.preventDefault();
        router.get(indexUrl, data, { preserveState: true });
    };

    return (
        <div className="table-wrapper">
            <div className="table-wrapper-header d-flex flex-wrap align-items-center gap-2 mb-3">
                <button type="button" className="btn btn--base btn--sm" onClick={() => setShowFilter((v) => !v)}>
                    <i className="las la-filter" /> Filter
                </button>
                {exportUrl && (
                    <a
                        href={`${exportUrl}?${new URLSearchParams(Object.fromEntries(Object.entries(data).filter(([, value]) => value)))}`}
                        className="btn btn-outline--base btn--sm"
                    >
                        <i className="las la-file-csv" /> Export CSV
                    </a>
                )}
                {showFilter && (
                    <form className="responsive-filter-card my-4" onSubmit={submitFilter}>
                        <div className="d-flex flex-wrap gap-3">
                            <input className="form-control form--control" placeholder="Transaction Number" value={data.search} onChange={(e) => setData('search', e.target.value)} />
                            <select className="form-select form--control" value={data.trx_type} onChange={(e) => setData('trx_type', e.target.value)}>
                                <option value="">All Type</option>
                                <option value="+">Plus</option>
                                <option value="-">Minus</option>
                            </select>
                            <select className="form-select form--control" value={data.remark} onChange={(e) => setData('remark', e.target.value)}>
                                <option value="">All Remark</option>
                                {remarks.map((remark) => (
                                    <option key={remark.value} value={remark.value}>{remark.label}</option>
                                ))}
                            </select>
                            <button className="btn btn--base" type="submit">Filter</button>
                        </div>
                    </form>
                )}
            </div>
            <table className="table table--responsive--md">
                <thead>
                    <tr>
                        <th>Trx</th>
                        <th>Transacted</th>
                        <th>Amount</th>
                        <th>Post Balance</th>
                        <th>Detail</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-muted py-4">No transaction history found.</td></tr>
                    ) : (
                        rows.map((trx) => (
                            <tr key={trx.trx}>
                                <td><strong>{trx.trx}</strong></td>
                                <td>{trx.createdAt}<br /><span className="text-muted small">{trx.createdAtHuman}</span></td>
                                <td className={trx.trxType === '+' ? 'text--success' : 'text--danger'}>
                                    {trx.trxType} {trx.amount}
                                </td>
                                <td>{trx.postBalance}</td>
                                <td><span className="clamping">{trx.details}</span></td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {transactions?.links?.length > 3 && <Pagination links={transactions.links} />}
        </div>
    );
}
