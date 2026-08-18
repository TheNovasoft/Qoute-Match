import { COUNTRIES, citiesForCountry } from '@/data/locations';

export default function CountryCityFields({
    countryValue = '',
    cityValue = '',
    onCountryChange,
    onCityChange,
    countryError,
    cityError,
}) {
    const cities = citiesForCountry(countryValue);
    const cityDisabled = !countryValue;
    const useCityText = Boolean(countryValue) && cities.length === 0;

    return (
        <div className="row gy-3">
            <div className="col-12">
                <label className="form-label">Country</label>
                <select
                    className="form-select form--control form-control-lg"
                    value={countryValue}
                    onChange={(e) => onCountryChange(e.target.value)}
                >
                    <option value="">Select country</option>
                    {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
                {countryError && <small className="text-danger d-block mt-1">{countryError}</small>}
            </div>
            <div className="col-12">
                <label className="form-label">City</label>
                {useCityText ? (
                    <input
                        type="text"
                        className="form-control form--control form-control-lg"
                        placeholder="Enter city"
                        value={cityValue}
                        onChange={(e) => onCityChange(e.target.value)}
                    />
                ) : (
                    <select
                        className="form-select form--control form-control-lg"
                        value={cityValue}
                        onChange={(e) => onCityChange(e.target.value)}
                        disabled={cityDisabled}
                    >
                        <option value="">
                            {cityDisabled ? 'Select a country first' : 'Select city'}
                        </option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                )}
                {cityError && <small className="text-danger d-block mt-1">{cityError}</small>}
            </div>
        </div>
    );
}
