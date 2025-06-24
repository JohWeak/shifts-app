// frontend/src/shared/data/locations.js
export const locations = {
    Israel: {
        cities: [
            'Tel Aviv',
            'Jerusalem',
            'Haifa',
            'Rishon LeZion',
            'Petah Tikva',
            'Ashdod',
            'Netanya',
            'Beersheba',
            'Holon',
            'Bnei Brak',
            'Ramat Gan',
            'Ashkelon',
            'Rehovot',
            'Bat Yam',
            'Herzliya'
        ]
    },
    USA: {
        cities: [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose'
        ]
    },
    UK: {
        cities: [
            'London',
            'Birmingham',
            'Manchester',
            'Glasgow',
            'Liverpool',
            'Leeds',
            'Sheffield',
            'Edinburgh',
            'Bristol',
            'Leicester'
        ]
    }
};

export const countries = Object.keys(locations);

export const getCitiesForCountry = (country) => {
    return locations[country]?.cities || [];
};