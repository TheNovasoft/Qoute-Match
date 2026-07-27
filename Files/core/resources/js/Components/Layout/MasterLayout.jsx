import AppLayout from '@/Components/Layout/AppLayout';
import DashboardUserMenu from '@/Components/Layout/DashboardUserMenu';
import useInboxNotifications from '@/hooks/useInboxNotifications';
import useMessageNotifications from '@/hooks/useMessageNotifications';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function MasterLayout({ children, pageTitle }) {
    const { auth, site, template, routes, monetisation } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const unreadCount = useMessageNotifications(
        routes.userConversationUnread,
        user?.unread_count ?? 0,
    );
    const notificationUnreadCount = useInboxNotifications(
        routes.userNotificationsUnread,
        user?.notification_unread_count ?? 0,
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
                    <div className={`sidebar-menu flex-between${sidebarOpen ? ' show-sidebar' : ''}`}>
                        <div className="sidebar-menu__inner">
                            <span
                                className="sidebar-menu__close d-lg-none d-block"
                                onClick={() => setSidebarOpen(false)}
                                role="button"
                                tabIndex={0}
                            ><i className="fas fa-times"></i></span>
                            <div className="sidebar-logo">
                                <Link href={routes.home} className="sidebar-logo__link">
                                    <img src={site.logoDark || site.logo} alt={site.name} />
                                </Link>
                            </div>
                            <div className="sidebar-menu__top">
                                <div className="shape">
                                    <img src={`${template.assetPath}shape/d-shape.png`} alt="" />
                                </div>
                                <span className="icon"><i className="las la-wallet"></i></span>
                                <div className="content">
                                    <span className="title">Balance</span>
                                    <h6 className="number">{user?.balance_formatted || user?.balance}</h6>
                                    {monetisation?.enabled && (
                                        <span className="title d-block mt-1">Lead credits: {user?.lead_credits ?? 0}</span>
                                    )}
                                </div>
                            </div>
                            <ul className="sidebar-menu-list">
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userHome ?? '/provider/dashboard'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-home"></i></span>
                                        <span className="text">Dashboard</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item sidebar-menu-list__item--cta">
                                    <Link href={routes.freelanceJobs ?? '/jobs'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-search"></i></span>
                                        <span className="text">Browse Requests</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userBidIndex ?? '/provider/bid/list'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-gavel"></i></span>
                                        <span className="text">All Bids</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userProjectIndex ?? '/provider/project/index'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-briefcase"></i></span>
                                        <span className="text">My Projects</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userDisputes ?? '/provider/disputes'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-exclamation-triangle"></i></span>
                                        <span className="text">
                                            Disputes
                                            {(user?.active_disputes ?? 0) > 0 && (
                                                <span className="shake text--warning"><i className="las la-bell"></i></span>
                                            )}
                                        </span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userNotifications ?? '/provider/notifications'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-bell"></i></span>
                                        <span className="text">
                                            Notifications
                                            {notificationUnreadCount > 0 && (
                                                <span className="shake text--warning ms-1">
                                                    <i className="las la-bell"></i>
                                                    <span className="sidebar-chat-notify__count">
                                                        {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                                    </span>
                                                </span>
                                            )}
                                        </span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userWithdraw ?? '/provider/withdraw'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-money-check-alt"></i></span>
                                        <span className="text">Withdraw</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userTransactions ?? '/provider/transactions'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-exchange-alt"></i></span>
                                        <span className="text">Transactions</span>
                                    </Link>
                                </li>
                                {monetisation?.enabled && (
                                    <li className="sidebar-menu-list__item">
                                        <Link href={routes.userLeadCredits ?? '/provider/lead-credits'} className="sidebar-menu-list__link">
                                            <span className="icon"><i className="las la-coins"></i></span>
                                            <span className="text">Lead Credits</span>
                                        </Link>
                                    </li>
                                )}
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userVerification ?? '/provider/verification'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-certificate"></i></span>
                                        <span className="text">Verification</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userConversation ?? '/provider/conversation'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="lab la-rocketchat"></i></span>
                                        <span className="text">
                                            Chat
                                            <span
                                                className={`sidebar-chat-notify ${unreadCount > 0 ? 'shake text--warning' : 'd-none'}`}
                                                data-sidebar-chat-notify
                                            >
                                                {unreadCount > 0 && (
                                                    <>
                                                        <i className="las la-bell"></i>
                                                        <span className="sidebar-chat-notify__count">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userProfileSetting ?? '/provider/profile-setting'} className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-cog"></i></span>
                                        <span className="text">Settings</span>
                                    </Link>
                                </li>
                                <li className="sidebar-menu-list__item">
                                    <Link href={routes.userLogout ?? '/provider/logout'} method="get" as="button" className="sidebar-menu-list__link">
                                        <span className="icon"><i className="las la-sign-out-alt"></i></span>
                                        <span className="text">Logout</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
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
                                    user={user}
                                    roleLabel="Provider"
                                    unreadCount={unreadCount}
                                    notificationUnreadCount={notificationUnreadCount}
                                    conversationUrl={routes.userConversation ?? '/provider/conversation'}
                                    notificationsUrl={routes.userNotifications ?? '/provider/notifications'}
                                    menuItems={[
                                        {
                                            label: 'My Profile',
                                            href: routes.userProfileSetting ?? '/provider/profile-setting',
                                            icon: 'fas fa-user-circle',
                                        },
                                        ...(user?.username ? [{
                                            label: 'Public Profile',
                                            href: `${routes.talentExplore ?? '/provider/details'}/${user.username}`,
                                            icon: 'las la-external-link-alt',
                                            external: true,
                                        }] : []),
                                        {
                                            label: 'Password',
                                            href: routes.userChangePassword ?? '/provider/change-password',
                                            icon: 'fas fa-lock',
                                        },
                                        {
                                            label: '2FA Security',
                                            href: routes.userTwofactor ?? '/provider/twofactor',
                                            icon: 'fas fa-key',
                                        },
                                        {
                                            label: 'Logout',
                                            href: routes.userLogout ?? '/provider/logout',
                                            icon: 'fas fa-sign-out-alt',
                                            danger: true,
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="dashboard-body">{children}</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
