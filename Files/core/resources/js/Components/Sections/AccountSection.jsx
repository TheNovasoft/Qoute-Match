import { Link, usePage } from '@inertiajs/react';
import { quotePostUrl } from '@/utils/quotePostUrl';

export default function AccountSection({ data }) {
    const { routes, auth } = usePage().props;
    const postJobUrl = quotePostUrl(routes, auth);

    return (
        <div className="account-section my-120">
            <div className="container">
                <div className="row gy-4">
                    <div className="col-12 col-xl-6">
                        <div className="account-item">
                            <div className="account-item__content highlight">
                                <h3 className="account-item__title s-highlight" data-s-break="-1" data-s-length="1">
                                    {data.providerTitle}
                                </h3>
                                <p className="account-item__text">{data.providerContent}</p>
                                <div className="account-item__btn">
                                    <Link href={routes.userRegister} className="btn btn--base">
                                        {data.providerButton}
                                    </Link>
                                </div>
                            </div>
                            <div className="account-item__thumb">
                                <img src={data.providerImage} alt="" />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-xl-6">
                        <div className="account-item">
                            <div className="account-item__content highlight">
                                <h3 className="account-item__title s-highlight" data-s-break="-1" data-s-length="1">
                                    {data.customerTitle}
                                </h3>
                                <p className="account-item__text">{data.customerContent}</p>
                                <div className="account-item__btn">
                                    <Link href={postJobUrl} className="btn btn--base">
                                        {data.customerButton}
                                    </Link>
                                </div>
                            </div>
                            <div className="account-item__thumb">
                                <img src={data.customerImage} alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
