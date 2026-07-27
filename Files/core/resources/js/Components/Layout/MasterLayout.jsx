import AppLayout from '@/Components/Layout/AppLayout';
import DashboardUserMenu from '@/Components/Layout/DashboardUserMenu';
import useInboxNotifications from '@/hooks/useInboxNotifications';
import useMessageNotifications from '@/hooks/useMessageNotifications';
import { isNavActive } from '@/utils/helpers';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function SidebarLink({ href, icon, label, active, badge, asButton, cta }) {
    const linkClass = `sidebar-menu-list__link${active ? ' active' : ''}`;
    const content = (
        <>
            <span className="icon"><i className={icon}></i></span>
            <span className="text">
                {label}
                {badge}
            </span>
        </>
    );

    return (
        <li className={`sidebar-menu-list__item${cta ? ' sidebar-menu-list__item--cta' : ''}${active ? ' active' : ''}`}>
            {asButton ? (
                <Link href={href} method="get" as="button" className={linkClass}>{content}</Link>
            ) : (
                <Link href={href} className={linkClass}>{content}</Link>
            )}
        </li>
    );
}

export default function MasterLayout({ children, pageTitle }) {
    const { url, props } = usePage();
    const { auth, site, template, routes, monetisation } = props;
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

    const homeHref = routes.userHome ?? '/freelancer/dashboard';
    const browseHref = routes.freelanceJobs ?? '/freelance-jobs';
    const bidsHref = routes.userBidIndex ?? '/freelancer/bid/list';
    const projectsHref = routes.userProjectIndex ?? '/freelancer/project/index';
    const disputesHref = routes.userDisputes ?? '/freelancer/disputes';
    const notificationsHref = routes.userNotifications ?? '/freelancer/notifications';
    const withdrawHref = routes.userWithdraw ?? '/freelancer/withdraw';
    const transactionsHref = routes.userTransactions ?? '/freelancer/transactions';
    const leadCreditsHref = routes.userLeadCredits ?? '/freelancer/lead-credits';
    const verificationHref = routes.userVerification ?? '/freelancer/verification';
    const conversationHref = routes.userConversation ?? '/freelancer/conversation';
    const settingsHref = routes.userProfileSetting ?? '/freelancer/profile-setting';
    const logoutHref = routes.userLogout ?? '/freelancer/logout';

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
                                <SidebarLink
                                    href={homeHref}
                                    icon="las la-home"
                                    label="Dashboard"
                                    active={isNavActive(url, homeHref, { exact: true })}
                                />
                                <SidebarLink
                                    href={browseHref}
                                    icon="las la-search"
                                    label="Browse Requests"
                                    cta
                                    active={isNavActive(url, browseHref)}
                                />
                                <SidebarLink
                                    href={bidsHref}
                                    icon="las la-gavel"
                                    label="All Bids"
                                    active={isNavActive(url, bidsHref)}
                                />
                                <SidebarLink
                                    href={projectsHref}
                                    icon="las la-briefcase"
                                    label="My Projects"
                                    active={isNavActive(url, projectsHref)}
                                />
                                <SidebarLink
                                    href={disputesHref}
                                    icon="las la-exclamation-triangle"
                                    label="Disputes"
                                    active={isNavActive(url, disputesHref)}
                                    badge={(user?.active_disputes ?? 0) > 0 ? (
                                        <span className="shake text--warning"><i className="las la-bell"></i></span>
                                    ) : null}
                                />
                                <SidebarLink
                                    href={notificationsHref}
                                    icon="las la-bell"
                                    label="Notifications"
                                    active={isNavActive(url, notificationsHref)}
                                    badge={notificationUnreadCount > 0 ? (
                                        <span className="shake text--warning ms-1">
                                            <i className="las la-bell"></i>
                                            <span className="sidebar-chat-notify__count">
                                                {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                            </span>
                                        </span>
                                    ) : null}
                                />
                                <SidebarLink
                                    href={withdrawHref}
                                    icon="las la-money-check-alt"
                                    label="Withdraw"
                                    active={isNavActive(url, withdrawHref)}
                                />
                                <SidebarLink
                                    href={transactionsHref}
                                    icon="las la-exchange-alt"
                                    label="Transactions"
                                    active={isNavActive(url, transactionsHref)}
                                />
                                {monetisation?.enabled && (
                                    <SidebarLink
                                        href={leadCreditsHref}
                                        icon="las la-coins"
                                        label="Lead Credits"
                                        active={isNavActive(url, leadCreditsHref)}
                                    />
                                )}
                                <SidebarLink
                                    href={verificationHref}
                                    icon="las la-certificate"
                                    label="Verification"
                                    active={isNavActive(url, verificationHref)}
                                />
                                <SidebarLink
                                    href={conversationHref}
                                    icon="lab la-rocketchat"
                                    label="Chat"
                                    active={isNavActive(url, conversationHref)}
                                    badge={(
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
                                    )}
                                />
                                <SidebarLink
                                    href={settingsHref}
                                    icon="las la-cog"
                                    label="Settings"
                                    active={isNavActive(url, settingsHref)
                                        || isNavActive(url, routes.userChangePassword ?? '/freelancer/change-password')
                                        || isNavActive(url, routes.userTwofactor ?? '/freelancer/twofactor')}
                                />
                                <SidebarLink
                                    href={logoutHref}
                                    icon="las la-sign-out-alt"
                                    label="Logout"
                                    asButton
                                />
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
                                    conversationUrl={conversationHref}
                                    notificationsUrl={notificationsHref}
                                    menuItems={[
                                        {
                                            label: 'My Profile',
                                            href: settingsHref,
                                            icon: 'fas fa-user-circle',
                                        },
                                        ...(user?.username ? [{
                                            label: 'Public Profile',
                                            href: `${routes.talentExplore ?? '/talent/details'}/${user.username}`,
                                            icon: 'las la-external-link-alt',
                                            external: true,
                                        }] : []),
                                        {
                                            label: 'Password',
                                            href: routes.userChangePassword ?? '/freelancer/change-password',
                                            icon: 'fas fa-lock',
                                        },
                                        {
                                            label: '2FA Security',
                                            href: routes.userTwofactor ?? '/freelancer/twofactor',
                                            icon: 'fas fa-key',
                                        },
                                        {
                                            label: 'Logout',
                                            href: logoutHref,
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
