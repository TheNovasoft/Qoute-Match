import { isNavActive } from '@/utils/helpers';
import { getSidebarNavMode, setSidebarNavMode } from '@/hooks/useSidebarNavMode';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function DropdownItem({ href, label, active }) {
    return (
        <li className={`sidebar-submenu-list__item ${active ? 'active' : ''}`}>
            <Link href={href} className="sidebar-submenu-list__link">
                <span className="text">{label}</span>
            </Link>
        </li>
    );
}

function DropdownMenu({ id, icon, label, openId, setOpenId, active, children }) {
    const isOpen = openId === id || active;

    return (
        <li className={`sidebar-menu-list__item has-dropdown${active ? ' active' : ''}${isOpen ? ' is-open' : ''}`}>
            <button
                type="button"
                className={`sidebar-menu-list__link sidebar-menu-list__link--dropdown w-100 border-0 bg-transparent text-start d-flex align-items-center${active ? ' active' : ''}`}
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen && openId === id && !active ? null : id)}
            >
                <span className="icon"><i className={icon}></i></span>
                <span className="text flex-grow-1">{label}</span>
                <span className="sidebar-menu-list__chevron" aria-hidden="true">
                    <i className="las la-angle-down"></i>
                </span>
            </button>
            <div className={`sidebar-submenu ${isOpen ? 'open-submenu' : ''}`}>{children}</div>
        </li>
    );
}

export default function BuyerSidebar({ unreadCount = 0, notificationUnreadCount = 0, open = false, onClose = () => {} }) {
    const { url, props } = usePage();
    const { auth, site, routes, trialTask, template } = props;
    const buyer = auth?.buyer;

    const jobListHref = routes.buyerJobList ?? '/customer/job/post/index';
    const jobPostHref = routes.buyerJobPost ?? '/customer/job/post/job-details';
    const depositHref = routes.buyerDeposit ?? '/customer/deposit';
    const depositHistoryHref = routes.buyerDepositHistory ?? '/customer/deposit/history';
    const withdrawHref = routes.buyerWithdraw ?? '/customer/withdraw';
    const withdrawHistoryHref = routes.buyerWithdrawHistory ?? '/customer/withdraw/history';
    const ticketOpenHref = routes.buyerTicketOpen ?? '/customer/ticket/new';
    const ticketIndexHref = routes.buyerTicketIndex ?? '/customer/ticket';
    const profileHref = routes.buyerProfileSetting ?? '/customer/profile-setting';
    const passwordHref = routes.buyerChangePassword ?? '/customer/change-password';
    const twofactorHref = routes.buyerTwofactor ?? '/customer/twofactor';

    const sectionOpen = useMemo(() => {
        if (isNavActive(url, jobListHref) || isNavActive(url, jobPostHref)) return 'jobs';
        if (isNavActive(url, depositHref) || isNavActive(url, depositHistoryHref)
            || isNavActive(url, withdrawHref) || isNavActive(url, withdrawHistoryHref)
            || isNavActive(url, routes.buyerTransactions ?? '/customer/transactions')
            || isNavActive(url, routes.buyerInvoices ?? '/customer/invoices')) return 'payments';
        if (isNavActive(url, ticketOpenHref) || isNavActive(url, ticketIndexHref)) return 'support';
        if (isNavActive(url, profileHref) || isNavActive(url, passwordHref) || isNavActive(url, twofactorHref)) return 'settings';
        return null;
    }, [
        url, jobListHref, jobPostHref, depositHref, depositHistoryHref,
        withdrawHref, withdrawHistoryHref, ticketOpenHref, ticketIndexHref,
        profileHref, passwordHref, twofactorHref, routes.buyerTransactions, routes.buyerInvoices,
    ]);

    const [openId, setOpenId] = useState(sectionOpen);
    const [navMode, setNavMode] = useState(getSidebarNavMode);
    const isSimple = navMode === 'simple';

    useEffect(() => {
        setOpenId(sectionOpen);
    }, [sectionOpen]);

    const toggleNavMode = () => {
        const next = navMode === 'simple' ? 'advanced' : 'simple';
        setSidebarNavMode(next);
        setNavMode(next);
    };

    const currentOpenId = openId;

    return (
        <div className={`sidebar-menu flex-between${open ? ' show-sidebar' : ''}`}>
            <div className="sidebar-menu__inner">
                <span
                    className="sidebar-menu__close d-lg-none d-block"
                    onClick={onClose}
                    role="button"
                    tabIndex={0}
                >
                    <i className="fas fa-times"></i>
                </span>

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
                        <span className="title">Wallet Balance</span>
                        <h6 className="number">{buyer?.balance_formatted ?? buyer?.balance ?? '0.00'}</h6>
                    </div>
                </div>

                <ul className="sidebar-menu-list">
                    <li className="sidebar-menu-list__item px-3 py-2">
                        <button type="button" className="btn btn-sm btn-outline--secondary w-100" onClick={toggleNavMode}>
                            {isSimple ? 'Show all menu items' : 'Simple menu'}
                        </button>
                    </li>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerDashboard ?? '/customer/dashboard', { exact: true }) ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerDashboard ?? '/customer/dashboard'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerDashboard ?? '/customer/dashboard', { exact: true }) ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-home"></i></span>
                            <span className="text">Dashboard</span>
                        </Link>
                    </li>

                    <DropdownMenu
                        id="jobs"
                        icon="las la-rocket"
                        label="My Jobs"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'jobs'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={jobListHref} label="All Jobs" active={isNavActive(url, jobListHref)} />
                            <DropdownItem href={jobPostHref} label="Post a Job" active={isNavActive(url, jobPostHref)} />
                        </ul>
                    </DropdownMenu>

                    {(!isSimple || trialTask) && trialTask && (
                        <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerTrialTasks ?? '/customer/trial-task/index') ? ' active' : ''}`}>
                            <Link
                                href={routes.buyerTrialTasks ?? '/customer/trial-task/index'}
                                className={`sidebar-menu-list__link${isNavActive(url, routes.buyerTrialTasks ?? '/customer/trial-task/index') ? ' active' : ''}`}
                            >
                                <span className="icon"><i className="las la-tasks"></i></span>
                                <span className="text">Trial Tasks</span>
                            </Link>
                        </li>
                    )}

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerProjects ?? '/customer/project/index') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerProjects ?? '/customer/project/index'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerProjects ?? '/customer/project/index') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-briefcase"></i></span>
                            <span className="text">My Projects</span>
                        </Link>
                    </li>

                    {!isSimple && (
                        <>
                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerSavedSearches ?? '/customer/saved-searches') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerSavedSearches ?? '/customer/saved-searches'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerSavedSearches ?? '/customer/saved-searches') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-bookmark"></i></span>
                            <span className="text">Saved Searches</span>
                        </Link>
                    </li>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerDisputes ?? '/customer/disputes') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerDisputes ?? '/customer/disputes'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerDisputes ?? '/customer/disputes') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-exclamation-triangle"></i></span>
                            <span className="text">
                                Disputes
                                {(buyer?.active_disputes ?? 0) > 0 && (
                                    <span className="shake text--warning"><i className="las la-bell"></i></span>
                                )}
                            </span>
                        </Link>
                    </li>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerNotifications ?? '/customer/notifications') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerNotifications ?? '/customer/notifications'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerNotifications ?? '/customer/notifications') ? ' active' : ''}`}
                        >
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

                    <DropdownMenu
                        id="payments"
                        icon="las la-wallet"
                        label="Payments & Billing"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'payments'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={depositHref} label="Add Money" active={isNavActive(url, depositHref, { exact: true })} />
                            <DropdownItem href={depositHistoryHref} label="Deposit History" active={isNavActive(url, depositHistoryHref)} />
                            <DropdownItem href={withdrawHref} label="Withdraw" active={isNavActive(url, withdrawHref, { exact: true })} />
                            <DropdownItem href={withdrawHistoryHref} label="Withdraw History" active={isNavActive(url, withdrawHistoryHref)} />
                            <DropdownItem href={routes.buyerTransactions ?? '/customer/transactions'} label="Transactions" active={isNavActive(url, routes.buyerTransactions ?? '/customer/transactions')} />
                            <DropdownItem href={routes.buyerInvoices ?? '/customer/invoices'} label="Invoices" active={isNavActive(url, routes.buyerInvoices ?? '/customer/invoices')} />
                        </ul>
                    </DropdownMenu>
                        </>
                    )}

                    <DropdownMenu
                        id="support"
                        icon="las la-life-ring"
                        label="Get Help"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'support'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={ticketOpenHref} label="Create New" active={isNavActive(url, ticketOpenHref)} />
                            <DropdownItem href={ticketIndexHref} label="Ticket History" active={isNavActive(url, ticketIndexHref)} />
                        </ul>
                    </DropdownMenu>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerConversation ?? '/customer/conversation') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerConversation ?? '/customer/conversation'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerConversation ?? '/customer/conversation') ? ' active' : ''}`}
                        >
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

                    <DropdownMenu
                        id="settings"
                        icon="las la-cog"
                        label="Settings"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'settings'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={profileHref} label="Profile Setting" active={isNavActive(url, profileHref)} />
                            <DropdownItem href={passwordHref} label="Change Password" active={isNavActive(url, passwordHref)} />
                            <DropdownItem href={twofactorHref} label="Extra Login Protection" active={isNavActive(url, twofactorHref)} />
                        </ul>
                    </DropdownMenu>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerLogout ?? '/customer/logout'} method="get" as="button" className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-sign-out-alt"></i></span>
                            <span className="text">Logout</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}
