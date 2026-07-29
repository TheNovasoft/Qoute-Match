import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Components/Layout/AdminLayout';
import AdminStatusTabs from '@/Components/Admin/AdminStatusTabs';

const MONETISATION_TABS = [
    { key: 'settings', label: 'Settings', href: '/admin/monetisation/settings' },
    { key: 'packages', label: 'Credit Packages', href: '/admin/monetisation/packages' },
    { key: 'plans', label: 'Subscription Plans', href: '/admin/monetisation/plans' },
];

export default function Settings({ pageTitle, settings }) {
    const form = useForm({
        monetisation_enabled: settings.enabled ? '1' : '0',
        monetisation_mode: settings.mode,
        quote_credit_cost: settings.quoteCreditCost,
        provider_welcome_credits: settings.welcomeCredits,
    });

    return (
        <AdminLayout pageTitle={pageTitle}>
            <AdminStatusTabs tabs={MONETISATION_TABS} className="mb-3" />

            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white"><h6 className="mb-0">Monetisation Settings</h6></div>
                        <div className="card-body">
                            <form onSubmit={(e) => { e.preventDefault(); form.post(settings.updateUrl); }}>
                                <div className="form-group mb-3">
                                    <div className="form-check form-switch">
                                        <input type="checkbox" className="form-check-input" id="enabled" checked={form.data.monetisation_enabled === '1'}
                                            onChange={(e) => form.setData('monetisation_enabled', e.target.checked ? '1' : '0')} />
                                        <label className="form-check-label" htmlFor="enabled">Enable monetisation</label>
                                    </div>
                                </div>
                                <div className="form-group mb-3">
                                    <label>Mode</label>
                                    <select className="form-control" value={form.data.monetisation_mode}
                                        onChange={(e) => form.setData('monetisation_mode', e.target.value)}>
                                        <option value="credits">Credits</option>
                                        <option value="subscription">Subscription</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label>Quote credit cost</label>
                                    <input type="number" min="1" className="form-control" value={form.data.quote_credit_cost}
                                        onChange={(e) => form.setData('quote_credit_cost', e.target.value)} />
                                </div>
                                <div className="form-group mb-3">
                                    <label>Welcome credits for new providers</label>
                                    <input type="number" min="0" className="form-control" value={form.data.provider_welcome_credits}
                                        onChange={(e) => form.setData('provider_welcome_credits', e.target.value)} />
                                </div>
                                <button type="submit" className="btn btn--primary" disabled={form.processing}>Save Settings</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-body d-grid gap-2">
                            <Link href={settings.packagesUrl} className="btn btn-outline--primary">Credit Packages</Link>
                            <Link href={settings.plansUrl} className="btn btn-outline--primary">Subscription Plans</Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
