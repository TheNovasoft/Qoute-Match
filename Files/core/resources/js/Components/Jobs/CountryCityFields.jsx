import { COUNTRIES, citiesForCountry } from '@/data/locations';
import { useJobPostFormTranslation } from '@/Components/Jobs/JobPostFormTranslationProvider';

export default function CountryCityFields({
    countryValue = '',
    cityValue = '',
    onCountryChange,
    onCityChange,
    countryError,
    cityError,
}) {
    const { tx } = useJobPostFormTranslation();
    const cities = citiesForCountry(countryValue);
    const cityDisabled = !countryValue;
    const useCityText = Boolean(countryValue) && cities.length === 0;

    return (
        <div className="row gy-3">
            <div className="col-12">
                <label className="form-label">{tx('Country')}</label>
                <select
                    className={`form-select form--control form-control-lg${countryError ? ' is-invalid' : ''}`}
                    value={countryValue}
                    onChange={(e) => onCountryChange(e.target.value)}
                >
                    <option value="">{tx('Select country')}</option>
                    {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
                {countryError && <small className="text-danger d-block mt-1">{tx(countryError)}</small>}
            </div>
            <div className="col-12">
                <label className="form-label">{tx('City')}</label>
                {useCityText ? (
                    <input
                        type="text"
                        className={`form-control form--control form-control-lg${cityError ? ' is-invalid' : ''}`}
                        placeholder={tx('Enter city')}
                        value={cityValue}
                        onChange={(e) => onCityChange(e.target.value)}
                    />
                ) : (
                    <select
                        className={`form-select form--control form-control-lg${cityError ? ' is-invalid' : ''}`}
                        value={cityValue}
                        onChange={(e) => onCityChange(e.target.value)}
                        disabled={cityDisabled}
                    >
                        <option value="">
                            {cityDisabled ? tx('Select a country first') : tx('Select city')}
                        </option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                )}
                {cityError && <small className="text-danger d-block mt-1">{tx(cityError)}</small>}
            </div>
        </div>
    );
}
