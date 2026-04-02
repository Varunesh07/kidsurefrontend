import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export const useLocationInfo = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const fetchLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (err) => {
        setLocationError(err.message);
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <LocationContext.Provider value={{ location, locationError, isLoadingLocation, fetchLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
