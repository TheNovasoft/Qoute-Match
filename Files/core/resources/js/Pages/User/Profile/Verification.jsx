import { Link, useForm, usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import VerificationBadges from '@/Components/Shared/VerificationBadges';

function DocumentCard({ document, storeUrl }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        document: null,
        reference_number: document.referenceNumber || '',
        expires_at: document.expiresAt || '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(storeUrl, {
            forceFormData: true,
            onSuccess: () => reset('document'),
        });
    };

    return (
        <div className="card custom--card h-100">
            <div className="card-body">
                <div className="d-flex align-items-start gap-3 mb-3">
                    <span className="verification-doc-card__icon">
                        <i className={document.icon}></i>
                    </span>
                    <div>
                        <h6 className="mb-1">{document.label}</h6>
                        <p className="text-muted small mb-2">{document.description}</p>
                        <span className="badge bg-light text-dark">{document.statusLabel}</span>
                    </div>
                </div>

                {document.documentUrl && (
                    <p className="small mb-3">
                        <a href={document.documentUrl} target="_blank" rel="noreferrer">
                            View uploaded document
                        </a>
                    </p>
                )}

                {document.adminNote && (
                    <div className="alert alert-warning py-2 small">{document.adminNote}</div>
                )}

                {document.canSubmit ? (
                    <form onSubmit={submit}>
                        <div className="mb-3">
                            <label className="form--label">Upload document</label>
                            <input
                                type="file"
                                className="form-control form--control"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(event) => setData('document', event.target.files?.[0] || null)}
                                required
                            />
                            {errors.document && <small className="text-danger d-block">{errors.document}</small>}
                        </div>
                        <div className="mb-3">
                            <label className="form--label">Reference number (optional)</label>
                            <input
                                type="text"
                                className="form-control form--control"
                                value={data.reference_number}
                                onChange={(event) => setData('reference_number', event.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form--label">Expiry date (optional)</label>
                            <input
                                type="date"
                                className="form-control form--control"
                                value={data.expires_at}
                                onChange={(event) => setData('expires_at', event.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn--base w-100" disabled={processing}>
                            Submit for review
                        </button>
                    </form>
                ) : (
                    <p className="text-muted small mb-0">
                        This badge is already submitted or approved. You will be able to resubmit if admin rejects it.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function Verification({ pageTitle, identity, providerApproved, documents, badges }) {
    const { routes } = usePage().props;

    return (
        <MasterLayout pageTitle={pageTitle}>
            <div className="container-fluid px-0">
                <div className="row gy-4">
                    <div className="col-12">
                        <div className="card custom--card">
                            <div className="card-body">
                                <h5 className="mb-2">Your verification badges</h5>
                                <p className="text-muted mb-3">
                                    Verified badges help customers trust your quotes. Identity checks use your KYC submission.
                                    Insurance, company, and trade licence documents are reviewed by admin.
                                </p>
                                <VerificationBadges badges={badges} />
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="card custom--card h-100">
                            <div className="card-body">
                                <h6 className="mb-2">Identity verification</h6>
                                <p className="text-muted small">Status: <strong>{identity.statusLabel}</strong></p>
                                <Link href={identity.kycFormUrl} className="btn btn-outline--base btn-sm">
                                    {identity.verified ? 'View KYC details' : 'Complete KYC'}
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="card custom--card h-100">
                            <div className="card-body">
                                <h6 className="mb-2">Provider approval</h6>
                                <p className="text-muted small">
                                    Status: <strong>{providerApproved ? 'Approved' : 'Pending admin approval'}</strong>
                                </p>
                                <p className="text-muted small mb-0">
                                    Admin approves your account after profile review. You can still submit verification documents below.
                                </p>
                            </div>
                        </div>
                    </div>

                    {documents.map((document) => (
                        <div className="col-lg-4" key={document.type}>
                            <DocumentCard
                                document={document}
                                storeUrl={`${routes.userVerificationStore ?? '/provider/verification'}/${document.type}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </MasterLayout>
    );
}
