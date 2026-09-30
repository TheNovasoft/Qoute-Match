import { useState } from 'react';
import { notify } from '@/utils/helpers';
import { useT } from '@/hooks/useT';

export default function SubscribeSection({ data }) {
    const [email, setEmail] = useState('');
    const t = useT();

    const submit = async (event) => {
        event.preventDefault();
        if (!email) {
            notify('error', t('Email field is required'));
            return;
        }

        try {
            const response = await window.axios.post(data.submitUrl, { email });
            if (response.data.success) {
                notify('success', response.data.message);
                setEmail('');
            } else {
                notify('error', response.data.error);
            }
        } catch (error) {
            notify('error', t('Subscription failed'));
        }
    };

    return (
        <div className="subscribe-section pt-120">
            <div className="container">
                <div className="subscribe-wrapper highlight">
                    <div className="subscribe-wrapper__shape"><img src={data.shape} alt="" /></div>
                    <div className="subscribe-content">
                        <span className="subscribe-content__shape"><img src={data.contentShape} alt="" /></span>
                        <h4 className="subscribe-content__title s-highlight" data-s-break="-1" data-s-length="1">{data.heading}</h4>
                        <p className="subscribe-content__text"><span className="fw-bold">{data.subheading}</span></p>
                        <form className="subscribe-form" onSubmit={submit}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="form-control form--control h-50"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('Enter your email address')}
                                />
                                <button className="input-group-text input-text-style" type="submit">
                                    <i className="fa-regular fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="subscribe-thumb"><img src={data.image} alt="" /></div>
                </div>
            </div>
        </div>
    );
}
