import { Link, router } from '@inertiajs/react';
import PortalBackLink from '@/Components/Shared/PortalBackLink';

function PartyBlock({ title, name, business, email, mobile, address }) {
    return (
        <div className="invoice-party">
            <span className="text-muted small d-block mb-1">{title}</span>
            <strong className="d-block">{name || '—'}</strong>
            {business ? <span className="d-block small">{business}</span> : null}
            {email ? <span className="d-block small text-muted">{email}</span> : null}
            {mobile ? <span className="d-block small text-muted">{mobile}</span> : null}
            {address ? <span className="d-block small mt-1">{address}</span> : null}
        </div>
    );
}

export default function InvoiceDetail({ invoice }) {
    const isCompletion = invoice.type === 'project_completed' || invoice.type === 'project_partial';
    const showProvider = invoice.isProjectInvoice;
    const payout = invoice.providerPayout || invoice.netAmount;

    const deleteInvoice = () => {
        if (!invoice.deleteUrl) return;
        if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
        router.post(invoice.deleteUrl);
    };

    return (
        <>
            <div className="mb-3 d-flex flex-wrap gap-2 align-items-center no-print">
                <PortalBackLink href={invoice.indexUrl} />
                <div className="ms-auto d-flex flex-wrap gap-2">
                    {invoice.projectUrl ? (
                        <Link href={invoice.projectUrl} className="btn btn-outline--base btn-sm">View Project</Link>
                    ) : null}
                    {invoice.canManage && invoice.deleteUrl ? (
                        <button type="button" className="btn btn-outline--danger btn-sm" onClick={deleteInvoice}>
                            Delete
                        </button>
                    ) : null}
                    <button type="button" className="btn btn--base btn-sm" onClick={() => window.print()}>
                        Print
                    </button>
                </div>
            </div>

            <div className="card custom--card invoice-card">
                <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
                        <div>
                            <h4 className="mb-1">{invoice.siteName}</h4>
                            <span className="text-muted small">Invoice</span>
                            {invoice.siteEmail ? <div className="small text-muted mt-1">{invoice.siteEmail}</div> : null}
                        </div>
                        <div className="text-md-end">
                            <div className="fw-bold">{invoice.invoiceNumber}</div>
                            <div className="small">{invoice.typeLabel}</div>
                            <div className="small text-muted">{invoice.createdAt}</div>
                            {invoice.trx ? <div className="small text-muted">Trx: {invoice.trx}</div> : null}
                        </div>
                    </div>

                    <div className="row gy-4 mb-4">
                        <div className="col-md-6">
                            <PartyBlock
                                title="Bill To (Customer)"
                                name={invoice.buyerName}
                                email={invoice.buyerEmail}
                                mobile={invoice.buyerMobile}
                                address={invoice.buyerAddress}
                            />
                        </div>
                        {showProvider ? (
                            <div className="col-md-6">
                                <PartyBlock
                                    title="Service By (Provider)"
                                    name={invoice.providerName}
                                    business={invoice.providerBusiness}
                                    email={invoice.providerEmail}
                                    mobile={invoice.providerMobile}
                                    address={invoice.providerAddress}
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="content-panel mb-4">
                        <div className="row gy-2">
                            <div className="col-md-8">
                                <span className="text-muted d-block small">Project / Request</span>
                                <strong>{invoice.jobTitle}</strong>
                            </div>
                            {invoice.estimatedTime ? (
                                <div className="col-md-4">
                                    <span className="text-muted d-block small">Estimated Time</span>
                                    <strong>{invoice.estimatedTime}</strong>
                                </div>
                            ) : null}
                            {invoice.escrowAmount ? (
                                <div className="col-md-4">
                                    <span className="text-muted d-block small">Escrow Held</span>
                                    <strong>{invoice.escrowAmount}</strong>
                                </div>
                            ) : null}
                            {invoice.deadline ? (
                                <div className="col-md-4">
                                    <span className="text-muted d-block small">Deadline</span>
                                    <strong>{invoice.deadline}</strong>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="table-responsive mb-4">
                        <table className="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <strong>{invoice.typeLabel}</strong>
                                        <div className="small text-muted">{invoice.jobTitle}</div>
                                        {showProvider ? (
                                            <div className="small text-muted">Provider: {invoice.providerName}</div>
                                        ) : null}
                                    </td>
                                    <td className="text-end">{invoice.amount}</td>
                                </tr>
                                {isCompletion ? (
                                    <tr>
                                        <td>Platform commission</td>
                                        <td className="text-end text--danger">-{invoice.chargeAmount}</td>
                                    </tr>
                                ) : null}
                                {showProvider ? (
                                    <tr>
                                        <td>Amount paid to provider</td>
                                        <td className="text-end text--success">{payout}</td>
                                    </tr>
                                ) : null}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>{isCompletion ? 'Provider net payout' : 'Total'}</th>
                                    <th className="text-end">{isCompletion ? payout : invoice.amount}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {invoice.partialReason ? (
                        <div className="content-panel mb-0">
                            <strong className="d-block mb-1">Partial settlement note</strong>
                            {invoice.partialReason}
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
