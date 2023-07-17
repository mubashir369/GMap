import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  OverlayView,
} from "@react-google-maps/api";

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [Map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 10.850516, lng: 76.27108 });
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [durations, setDurations] = useState([]);
  const [trafficResponse, setTrafficResponse] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);

  const originRef = useRef();
  const destinationRef = useRef();

  if (!isLoaded) {
    return <SkeletonText />;
  }

  function getCurrentLatLog() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setCenter({
            lat: latitude,
            lng: longitude,
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
    }
  }

  async function calculateRoute() {
    if (
      originRef.current.value === "" ||
      destinationRef.current.value === ""
    ) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const modes = [
      window.google.maps.TravelMode.DRIVING,
      window.google.maps.TravelMode.TWO_WHEELER,
      window.google.maps.TravelMode.WALKING,
    ];

    const resultsPromises = modes.map((mode) =>
      directionsService.route({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        travelMode: mode,
        avoidTolls: true,
        avoidHighways: true,
      })
    );

    const results = await Promise.all(resultsPromises);
    const durations = results.map(
      (result) => result.routes[0].legs[0].duration.text
    );

    setDirectionsResponse(results[0]);
    setDistance(results[0].routes[0].legs[0].distance.text);
    setDuration(durations[0]);
    setDurations(durations);

    setTrafficResponse(results);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destinationRef.current.value = "";
    setSelectedRouteIndex(null);
  }

  function handleRouteClick(index) {
    setSelectedRouteIndex(index);
    setDuration(durations[index]);
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      bgColor="blue.200"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100vh" }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => setMap(map)}
        >
          <Marker position={center} />
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
          {trafficResponse.map((result, index) => (
            <React.Fragment key={index}>
              {result && (
                <React.Fragment>
                  <DirectionsRenderer
                    directions={result}
                    options={{
                      suppressMarkers: true,
                      preserveViewport: true,
                      polylineOptions: {
                        strokeColor:
                          index === selectedRouteIndex ? "#00FF00" : "#888888",
                        strokeOpacity: 0.7,
                        strokeWeight: 5,
                      },
                    }}
                    onClick={() => handleRouteClick(index)}
                  />
                  {result.routes &&
                    result.routes.length > 0 &&
                    result.routes.map((route, routeIndex) => (
                      <OverlayView
                        key={`${index}-${routeIndex}`}
                        position={route.legs[0].end_location}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={(width, height) => ({
                          x: -width / 2,
                          y: -height,
                        })}
                      >
                        <Box
                          bg="white"
                          p={2}
                          boxShadow="md"
                          borderRadius="md"
                          zIndex={index === selectedRouteIndex ? 1 : 0}
                        >
                          <Text fontWeight="bold" fontSize="sm">
                            Route {index + 1}
                          </Text>
                          <Text fontSize="sm">
                            Duration (Driving): {durations[index]}
                          </Text>
                          <Text fontSize="sm">
                            Distance: {route.legs[0].distance.text}
                          </Text>
                        </Box>
                      </OverlayView>
                    ))}
                </React.Fragment>
              )}
            </React.Fragment>
          ))}
        </GoogleMap>
      </Box>

      <Box
        p={4}
        borderRadius="lg"
        mt={4}
        bgColor="white"
        shadow="base"
        minW="container.md"
        style={{ zIndex: 10 }}
      >
        <HStack spacing={4}>
          <Autocomplete
            onLoad={(autocomplete) => {
              autocomplete.setComponentRestrictions({ country: "in" });
              autocomplete.setTypes(["(cities)"]);
            }}
            onPlaceChanged={() => {
              const place = originRef.current.getPlace();
              if (place.geometry) {
                setCenter({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                });
              }
            }}
          >
            <Input type="text" placeholder="Origin" ref={originRef} />
          </Autocomplete>

          <Autocomplete
            onLoad={(autocomplete) => {
              autocomplete.setComponentRestrictions({ country: "in" });
              autocomplete.setTypes(["(cities)"]);
            }}
            onPlaceChanged={() => {
              const place = destinationRef.current.getPlace();
              if (place.geometry) {
                setCenter({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                });
              }
            }}
          >
            <Input
              type="text"
              placeholder="Destination"
              ref={destinationRef}
            />
          </Autocomplete>

          <Button colorScheme="pink" type="submit" onClick={calculateRoute}>
            Calculate Route
          </Button>
          <IconButton
            aria-label="center back"
            icon={<FaTimes />}
            onClick={clearRoute}
          />
        </HStack>

        <HStack spacing={4} mt={4} justifyContent="space-between">
          <Text>Distance: {distance} </Text>
          <Text>Duration (CAR): {durations[0]} </Text>
          <Text>Duration (BIKE): {durations[1]} </Text>
          <Text>Duration (WALKING): {durations[2]} </Text>
          <IconButton
            aria-label="center back"
            icon={<FaLocationArrow />}
            isRound
            onClick={getCurrentLatLog}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default App;
