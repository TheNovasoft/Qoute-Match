import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import AdminLayout from '@/Components/Layout/AdminLayout';

function MetricCard({ title, value, url, tone = 'primary' }) {
    return (
        <div className="col-xxl-3 col-sm-6">
            <div className={`card shadow-sm admin-metric-card admin-metric-card--${tone}`}>
                <div className="card-body">
                    <p className="text-muted mb-1 small">{title}</p>
                    <h3 className="mb-2">{value}</h3>
                    {url && <Link href={url} className="small text--base">View</Link>}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ pageTitle, metrics, chart, recentDisputes, recentQuotes, recentVerifications = [] }) {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !chart?.labels?.length) return;

        const max = Math.max(...chart.requests, ...chart.quotes, 1);
        chartRef.current.innerHTML = chart.labels.map((label, index) => {
            const reqH = Math.round(((chart.requests[index] || 0) / max) * 100);
            const quoteH = Math.round(((chart.quotes[index] || 0) / max) * 100);
            return `
                <div class="admin-chart-col" title="${label}">
                    <div class="admin-chart-bar admin-chart-bar--requests" style="height:${reqH}%"></div>
                    <div class="admin-chart-bar admin-chart-bar--quotes" style="height:${quoteH}%"></div>
                </div>
            `;
        }).join('');
    }, [chart]);

    return (
        <AdminLayout pageTitle={pageTitle}>
            <div className="row gy-4 mb-4">
                <MetricCard title="Published Requests" value={metrics.publishedRequests} url="/admin/jobs/published" />
                <MetricCard title="Pending Approval" value={metrics.pendingApproval} url="/admin/jobs/pending" tone="warning" />
                <MetricCard title="Total Quotes" value={metrics.totalQuotes} url="/admin/bids" />
                <MetricCard title="Hired Quotes" value={metrics.hiredQuotes} url="/admin/bids?status=1" tone="success" />
                <MetricCard title="Open Disputes" value={metrics.openDisputes} url="/admin/disputes" tone="danger" />
                <MetricCard title="Pending Providers" value={metrics.pendingProviders} url="/admin/users/pending-approval" tone="dark" />
                <MetricCard title="Pending Badges" value={metrics.pendingVerifications} url="/admin/provider-verifications?status=pending" tone="warning" />
                <MetricCard title="Pending Reviews" value={metrics.pendingReviews} url="/admin/reviews/pending" />
                <MetricCard title="Reported Projects" value={metrics.reportedProjects} url="/admin/project/reported" />
            </div>

            <div className="row gy-4 mb-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h6 className="mb-0">Requests &amp; Quotes — Last 30 Days</h6>
                        </div>
                        <div className="card-body">
                            <div className="admin-chart-legend small mb-3">
                                <span className="me-3"><span className="admin-chart-dot admin-chart-dot--requests" /> Requests</span>
                                <span><span className="admin-chart-dot admin-chart-dot--quotes" /> Quotes</span>
                            </div>
                            <div className="admin-chart" ref={chartRef} />
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white">
                            <h6 className="mb-0">Conversion Snapshot</h6>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between px-0"><span>Hire rate</span><strong>{metrics.hireRate}%</strong></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><span>Quotes per request</span><strong>{metrics.quotesPerRequest}</strong></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><span>Pending quotes</span><strong>{metrics.pendingQuotes}</strong></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><span>Running projects</span><strong>{metrics.runningProjects}</strong></li>
                                <li className="list-group-item d-flex justify-content-between px-0"><span>Completed requests</span><strong>{metrics.completedRequests}</strong></li>
                                {metrics.monetisationEnabled && (
                                    <>
                                        <li className="list-group-item d-flex justify-content-between px-0"><span>Credits purchased (30d)</span><strong>{metrics.creditPurchases30d}</strong></li>
                                        <li className="list-group-item d-flex justify-content-between px-0"><span>Credits used (30d)</span><strong>{metrics.creditsUsed30d}</strong></li>
                                        <li className="list-group-item d-flex justify-content-between px-0"><span>Active subscriptions</span><strong>{metrics.activeSubscriptions}</strong></li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gy-4">
                <div className="col-lg-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Pending Badge Reviews</h6>
                            <Link href="/admin/provider-verifications?status=pending" className="btn btn-sm btn-outline--primary">View All</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table--light mb-0">
                                <thead><tr><th>Type</th><th>Provider</th><th>Action</th></tr></thead>
                                <tbody>
                                    {recentVerifications.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center text-muted py-3">No pending badges.</td></tr>
                                    ) : recentVerifications.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.typeLabel}</td>
                                            <td>@{item.providerUsername}</td>
                                            <td><Link href={item.detailUrl} className="btn btn-sm btn--primary">Review</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between">
                            <h6 className="mb-0">Recent Disputes</h6>
                            <Link href="/admin/disputes" className="btn btn-sm btn-outline--primary">View All</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table--light mb-0">
                                <thead><tr><th>Subject</th><th>Raised By</th><th>Status</th></tr></thead>
                                <tbody>
                                    {recentDisputes.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center text-muted">No disputes yet.</td></tr>
                                    ) : recentDisputes.map((item) => (
                                        <tr key={item.id}>
                                            <td><Link href={item.detailUrl}>{item.subject}</Link></td>
                                            <td>{item.raisedBy}</td>
                                            <td><span className={item.status.class}>{item.status.label}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between">
                            <h6 className="mb-0">Recent Quotes</h6>
                            <Link href="/admin/bids" className="btn btn-sm btn-outline--primary">View All</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table--light mb-0">
                                <thead><tr><th>Provider</th><th>Request</th><th>Amount</th></tr></thead>
                                <tbody>
                                    {recentQuotes.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center text-muted">No quotes yet.</td></tr>
                                    ) : recentQuotes.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.providerUsername}</td>
                                            <td>{item.jobTitle}</td>
                                            <td><Link href={item.detailUrl}>{item.amount}</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
