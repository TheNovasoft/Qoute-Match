import { Link, router } from '@inertiajs/react';
import PortalBackLink from '@/Components/Shared/PortalBackLink';

function MetaRow({ label, value }) {
    if (!value) return null;
    return (
        <tr>
            <th>{label}</th>
            <td>{value}</td>
        </tr>
    );
}

export default function InvoiceDetail({ invoice }) {
    const isCompletion = invoice.type === 'project_completed' || invoice.type === 'project_partial';
    const showProvider = invoice.isProjectInvoice;
    const payout = invoice.providerPayout || invoice.netAmount;
    const totalDisplay = isCompletion ? payout : invoice.amount;
    const escrowHeld = invoice.escrowStatus === 'held';
    const escrowReleased = invoice.escrowStatus === 'released';

    const deleteInvoice = () => {
        if (!invoice.deleteUrl) return;
        if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
        router.post(invoice.deleteUrl);
    };

    const comments = [
        invoice.typeLabel ? `Status: ${invoice.typeLabel}` : null,
        invoice.paymentMethod ? `Payment method: ${invoice.paymentMethod}` : null,
        invoice.trx ? `Transaction: ${invoice.trx}` : null,
        showProvider && invoice.providerName ? `Service provided by: ${invoice.providerName}` : null,
        invoice.estimatedTime ? `Estimated time: ${invoice.estimatedTime}` : null,
        invoice.deadline ? `Deadline: ${invoice.deadline}` : null,
        escrowHeld && invoice.escrowAmount
            ? `Escrow held from customer wallet: ${invoice.escrowAmount}`
            : null,
        escrowReleased && invoice.escrowAmount
            ? `Escrow released to provider (gross): ${invoice.escrowAmount}`
            : null,
        invoice.partialReason ? `Note: ${invoice.partialReason}` : null,
        'Please include the invoice number with any payment reference.',
    ].filter(Boolean);

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

            <div className="std-invoice-wrap">
                <div className="std-invoice">
                    <div className="std-invoice__header">
                        <div className="std-invoice__company">
                            <h1 className="std-invoice__brand">{invoice.siteName}</h1>
                            {invoice.siteEmail ? <div>{invoice.siteEmail}</div> : null}
                            {invoice.sitePhone ? <div>Phone: {invoice.sitePhone}</div> : null}
                            {invoice.siteAddress ? <div>{invoice.siteAddress}</div> : null}
                            {invoice.siteUrl ? <div>{invoice.siteUrl}</div> : null}
                        </div>
                        <div className="std-invoice__meta">
                            <div className="std-invoice__title">INVOICE</div>
                            <table className="std-invoice__meta-table">
                                <tbody>
                                    <MetaRow label="DATE" value={invoice.invoiceDate} />
                                    <MetaRow label="INVOICE #" value={invoice.invoiceNumber} />
                                    <MetaRow label="CUSTOMER ID" value={invoice.customerId} />
                                    <MetaRow label="STATUS" value={invoice.typeLabel} />
                                    <MetaRow label="PAYMENT" value={invoice.paymentMethod} />
                                    {invoice.dueDate ? <MetaRow label="DUE DATE" value={invoice.dueDate} /> : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="std-invoice__bar">BILL TO</div>
                    <div className="std-invoice__party">
                        <div className="std-invoice__party-name">{invoice.buyerName || '—'}</div>
                        {invoice.buyerEmail ? <div>{invoice.buyerEmail}</div> : null}
                        {invoice.buyerMobile ? <div>Phone: {invoice.buyerMobile}</div> : null}
                        {invoice.buyerAddress ? <div>{invoice.buyerAddress}</div> : null}
                    </div>

                    {showProvider ? (
                        <>
                            <div className="std-invoice__bar">SERVICE BY (PROVIDER)</div>
                            <div className="std-invoice__party">
                                <div className="std-invoice__party-name">{invoice.providerName || '—'}</div>
                                {invoice.providerBusiness ? <div>{invoice.providerBusiness}</div> : null}
                                {invoice.providerEmail ? <div>{invoice.providerEmail}</div> : null}
                                {invoice.providerMobile ? <div>Phone: {invoice.providerMobile}</div> : null}
                                {invoice.providerAddress ? <div>{invoice.providerAddress}</div> : null}
                            </div>
                        </>
                    ) : null}

                    <table className="std-invoice__items">
                        <thead>
                            <tr>
                                <th className="std-invoice__col-desc">DESCRIPTION</th>
                                <th className="std-invoice__col-tax">TAXED</th>
                                <th className="std-invoice__col-amt">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>{invoice.jobTitle}</strong>
                                    <div className="std-invoice__item-sub">{invoice.typeLabel}</div>
                                    {showProvider ? (
                                        <div className="std-invoice__item-sub">Provider: {invoice.providerName}</div>
                                    ) : null}
                                </td>
                                <td className="text-center">—</td>
                                <td className="text-end">{invoice.amount}</td>
                            </tr>
                            {escrowHeld && invoice.escrowAmount ? (
                                <tr>
                                    <td>
                                        <strong>Escrow hold (customer wallet)</strong>
                                        <div className="std-invoice__item-sub">Funds locked until project completion</div>
                                    </td>
                                    <td className="text-center">—</td>
                                    <td className="text-end">{invoice.escrowAmount}</td>
                                </tr>
                            ) : null}
                            {escrowReleased && invoice.escrowAmount ? (
                                <tr>
                                    <td>
                                        <strong>Escrow released</strong>
                                        <div className="std-invoice__item-sub">Paid from held escrow to provider</div>
                                    </td>
                                    <td className="text-center">—</td>
                                    <td className="text-end">{invoice.escrowAmount}</td>
                                </tr>
                            ) : null}
                            {isCompletion && invoice.chargeAmountRaw > 0 ? (
                                <tr>
                                    <td>Platform commission</td>
                                    <td className="text-center">—</td>
                                    <td className="text-end">-{invoice.chargeAmount}</td>
                                </tr>
                            ) : null}
                            {showProvider ? (
                                <tr>
                                    <td>Provider payout</td>
                                    <td className="text-center">—</td>
                                    <td className="text-end">{payout}</td>
                                </tr>
                            ) : null}
                            {[...Array(Math.max(0, 4 - (isCompletion && invoice.chargeAmountRaw > 0 ? 3 : showProvider ? 2 : 1)))].map((_, i) => (
                                <tr key={`empty-${i}`} className="std-invoice__empty-row">
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="std-invoice__bottom">
                        <div className="std-invoice__comments">
                            <div className="std-invoice__bar">OTHER COMMENTS</div>
                            <div className="std-invoice__comments-box">
                                {comments.map((line) => (
                                    <div key={line}>{line}</div>
                                ))}
                            </div>
                        </div>

                        <div className="std-invoice__totals">
                            <table>
                                <tbody>
                                    <tr>
                                        <th>Subtotal</th>
                                        <td>{invoice.amount}</td>
                                    </tr>
                                    {isCompletion ? (
                                        <tr>
                                            <th>Platform fee</th>
                                            <td>-{invoice.chargeAmount}</td>
                                        </tr>
                                    ) : null}
                                    {showProvider ? (
                                        <tr>
                                            <th>Provider amount</th>
                                            <td>{payout}</td>
                                        </tr>
                                    ) : null}
                                    {invoice.escrowAmount ? (
                                        <tr>
                                            <th>{escrowHeld ? 'Escrow held' : 'Escrow released'}</th>
                                            <td>{invoice.escrowAmount}</td>
                                        </tr>
                                    ) : null}
                                    <tr className="std-invoice__total-row">
                                        <th>TOTAL</th>
                                        <td><span className="std-invoice__total-box">{totalDisplay}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="std-invoice__pay-note">
                                Make all payments payable to {invoice.siteName}
                            </div>
                        </div>
                    </div>

                    <div className="std-invoice__footer">
                        <div>
                            If you have any questions about this invoice, please contact{' '}
                            {[invoice.siteName, invoice.sitePhone, invoice.siteEmail].filter(Boolean).join(', ')}.
                        </div>
                        <div className="std-invoice__thanks">Thank You For Your Business!</div>
                    </div>
                </div>
            </div>
        </>
    );
}
