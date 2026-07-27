import AppLayout from '@/Components/Layout/AppLayout';
import BuyerSidebar from '@/Components/Layout/BuyerSidebar';
import DashboardUserMenu from '@/Components/Layout/DashboardUserMenu';
import useInboxNotifications from '@/hooks/useInboxNotifications';
import useMessageNotifications from '@/hooks/useMessageNotifications';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function BuyerMasterLayout({ children, pageTitle }) {
    const { auth, routes } = usePage().props;
    const buyer = auth?.buyer;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const unreadCount = useMessageNotifications(
        routes.buyerConversationUnread,
        buyer?.unread_count ?? 0,
    );
    const notificationUnreadCount = useInboxNotifications(
        routes.buyerNotificationsUnread,
        buyer?.notification_unread_count ?? 0,
    );

    useEffect(() => router.on('navigate', () => setSidebarOpen(false)), []);

    return (
        <AppLayout pageTitle={pageTitle} showPreloader={false}>
            <div className="dashboard position-relative">
                <div className="dashboard__inner flex-wrap">
                    <div
                        className={`dashboard-sidebar-overlay d-lg-none${sidebarOpen ? ' is-open' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="dashboard__left">
                        <BuyerSidebar
                            unreadCount={unreadCount}
                            notificationUnreadCount={notificationUnreadCount}
                            open={sidebarOpen}
                            onClose={() => setSidebarOpen(false)}
                        />
                    </div>
                    <div className="dashboard__right">
                        <div className="dashboard-header">
                            <div className="dashboard-header__inner flex-between">
                                <div className="dashboard-header__left">
                                    <div
                                        className="dashboard-body__bar d-lg-none d-inline-block"
                                        onClick={() => setSidebarOpen(true)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <span className="dashboard-body__bar-icon"><i className="fas fa-bars"></i></span>
                                    </div>
                                    <h6 className="title">{pageTitle}</h6>
                                </div>
                                <DashboardUserMenu
                                    user={buyer}
                                    roleLabel="Buyer"
                                    unreadCount={unreadCount}
                                    notificationUnreadCount={notificationUnreadCount}
                                    conversationUrl={routes.buyerConversation ?? '/customer/conversation'}
                                    notificationsUrl={routes.buyerNotifications ?? '/customer/notifications'}
                                    menuItems={[
                                        {
                                            label: 'My Profile',
                                            href: routes.buyerProfileSetting ?? '/customer/profile-setting',
                                            icon: 'fas fa-user-circle',
                                        },
                                        {
                                            label: 'Password',
                                            href: routes.buyerChangePassword ?? '/customer/change-password',
                                            icon: 'fas fa-lock',
                                        },
                                        {
                                            label: '2FA Security',
                                            href: routes.buyerTwofactor ?? '/customer/twofactor',
                                            icon: 'fas fa-key',
                                        },
                                        {
                                            label: 'Logout',
                                            href: routes.buyerLogout ?? '/customer/logout',
                                            icon: 'fas fa-sign-out-alt',
                                            danger: true,
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="dashboard-body dashboard-body--buyer">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
