/**
    
        DOCS: https://developers.google.com/maps/documentation/javascript/places#find_place_from_query

        'google' namespace is came from script added to index.html
        1. <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=[YOUR_KEY]&libraries=places"></script>
        2. Installing @types/googlemaps
        3. adding "types": ["googlemaps"] in compilerOptions in tsconfig.json
 */

export type TGooglePlaceSuggestCategories = '(cities)' | 'establishment';

export interface TPosition {
    lat: number
    lng: number
}

const GoogleUtils = {


    geoAddressFields: ['street_number', 'route', 'postal_code', 'country', 'administrative_area_level_1', 'administrative_area_level_2', 'locality', 'sublocality_level_1', 'sublocality_level_2', 'route', 'street_number', 'opening_hours', 'price_level'],

    /* utils functions */
    placeSuggest: (input: string, types: TGooglePlaceSuggestCategories[]) => {
        return (
            new Promise((resolve, reject) => {
                if (google) {
                    let request: google.maps.places.AutocompletionRequest = { input, types }
                    let service = new google.maps.places.AutocompleteService();
                    service.getPlacePredictions(request, (results: any) => {
                        resolve(results)
                    })
                }
            })
        )
    },

    placeDetails: (placeId: string, fields?: Array<string>): Promise<google.maps.places.PlaceResult> => {
        return (
            new Promise((resolve, reject) => {
                if (google) {
                    var request = {
                        placeId: placeId,
                        // fields: GoogleUtils.geoAddressFields
                    };
                    let service = new google.maps.places.PlacesService(document.createElement('div'));
                    service.getDetails(request, result => {
                        resolve(result)
                    })
                }
            }
            ))
    },

    placeTypesParser: (types: string[] | undefined, typeMap: Record<string, string[]>): string[] => {
        if (!types) return [];
        let newTypes: string[] = [];
        const keys = Object.keys(typeMap);
        keys.forEach((item) => {
            let values = typeMap[item];
            values.forEach((val) => {
                const index = types.indexOf(val);
                if (index > -1)
                    newTypes.push(item);
            })
        })
        return newTypes;
    },

    transformAddress: (place: google.maps.places.PlaceResult) => {
        if (!place)
            return;
        let addressComponents = place.address_components || [];
        type TGeoAddress = Record<typeof GoogleUtils.geoAddressFields[number], string>;
        let geoAddress: TGeoAddress = {} as TGeoAddress;

        GoogleUtils.geoAddressFields.forEach(addressField => {
            addressComponents.forEach(addComp => {
                if (addComp.types && addComp.types.length && (addComp.types.indexOf(addressField) !== -1))
                    geoAddress[addressField] = addComp.long_name;
            });

        });
        let shAddress = {
            placeid: place.place_id,
            "full_address": place.formatted_address,
            "address1": [geoAddress.administrative_area_level_1, geoAddress.route, geoAddress.sublocality_level_2].join(', '),
            "state": geoAddress.administrative_area_level_1,
            "city": geoAddress.locality,
            "locality": geoAddress.sublocality_level_1,
            "zipcode": geoAddress.postal_code,
            "country": geoAddress.country
        };
        return shAddress;
    },

    getDistance: (coord1: TPosition, coord2: TPosition): number => {
        const toRad = (x: number) => x * Math.PI / 180;
        var lat1 = coord1.lat;
        var lon1 = coord1.lng;
        var lat2 = coord2.lat;
        var lon2 = coord2.lng;
        var x1 = lat2 - lat1;

        // Earth's mean readius in KMs
        const R = 6371;

        var dLat = toRad(x1);
        var x2 = lon2 - lon1;
        var dLon = toRad(x2);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;

        //Distance in KMs
        return d;
    },

    formatOpeningHours: (openingHours: google.maps.places.OpeningHours | undefined) => {
        if (!openingHours) return undefined;
        let periods: any[] = [];
        openingHours?.periods?.forEach((period) => {
            let p = {
                open: period.open.time,
                close: period.close ? period.close.time : '',
                day: period.open.day,

            };
            periods.push(p);
        })
        return { periods }
    }
}

export default GoogleUtils;
