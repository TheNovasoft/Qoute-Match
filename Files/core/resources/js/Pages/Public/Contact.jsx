import { useForm } from '@inertiajs/react';
import FrontendLayout from '@/Components/Layout/FrontendLayout';
import SectionRenderer from '@/Components/Sections/SectionRenderer';
import { useT } from '@/hooks/useT';

export default function Contact({ pageTitle, seo, sections, contact, socialIcons, user }) {
    const t = useT();
    const { data, setData, post, processing } = useForm({
        name: user?.fullname || '',
        email: user?.email || '',
        subject: '',
        message: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/contact');
    };

    return (
        <FrontendLayout pageTitle={pageTitle} seo={seo}>
            <div className="contact-section mb-120">
                <div className="container">
                    <div className="row gy-4 justify-content-between align-items-center flex-wrap-reverse">
                        <div className="col-xl-4">
                            <div className="contact-item-wrapper">
                                <h5 className="contact-item-wrapper__title">{contact.title}</h5>
                                <div className="contact-item">
                                    <span className="contact-item__icon"><i className="fa-solid fa-house-user"></i></span>
                                    <div className="contact-item__content">
                                        <p className="contact-item__title">{t('Office Address')}</p>
                                        <p className="contact-item__desc">{contact.details}</p>
                                    </div>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-item__icon"><i className="fa-solid fa-paper-plane"></i></span>
                                    <div className="contact-item__content">
                                        <p className="contact-item__title">{t('Email Address')}</p>
                                        <p className="contact-item__desc"><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                                    </div>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-item__icon"><i className="fa-solid fa-phone-volume"></i></span>
                                    <div className="contact-item__content">
                                        <p className="contact-item__title">{t('Phone Number')}</p>
                                        <p className="contact-item__desc"><a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
                                    </div>
                                </div>
                                <div className="contact-item-wrapper__bottom">
                                    <div className="social-list-wrapper">
                                        <p className="title">{t('Follow Us')}</p>
                                        <ul className="social-list">
                                            {socialIcons.map((social, index) => (
                                                <li key={index} className="social-list__item">
                                                    <a href={social.url} target="_blank" rel="noreferrer" className="social-list__link flex-center"
                                                        dangerouslySetInnerHTML={{ __html: social.icon }} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-7">
                            <div className="contact-form-wrapper">
                                <h4 className="contact-form-wrapper__title">{contact.heading}</h4>
                                <p className="contact-form-wrapper__desc">{contact.subheading}</p>
                                <form onSubmit={submit} className="verify-form">
                                    <div className="row">
                                        <div className="col-sm-6 form-group">
                                            <label className="form--label">{t('Name')}</label>
                                            <input type="text" className="form-control form--control" value={data.name}
                                                readOnly={!!user?.profile_complete} onChange={(e) => setData('name', e.target.value)} required />
                                        </div>
                                        <div className="col-sm-6 form-group">
                                            <label className="form--label">{t('Email')}</label>
                                            <input type="email" className="form-control form--control" value={data.email}
                                                readOnly={!!user} onChange={(e) => setData('email', e.target.value)} required />
                                        </div>
                                        <div className="col-sm-12 form-group">
                                            <label className="form--label">{t('Subject')}</label>
                                            <input type="text" className="form-control form--control" value={data.subject}
                                                onChange={(e) => setData('subject', e.target.value)} required />
                                        </div>
                                        <div className="col-sm-12 form-group">
                                            <label className="form--label">{t('Message')}</label>
                                            <textarea className="form-control form--control" value={data.message}
                                                onChange={(e) => setData('message', e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <button type="submit" className="btn btn--base w-100" disabled={processing}>
                                                {t('Send Message')}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SectionRenderer sections={sections} />
        </FrontendLayout>
    );
}
