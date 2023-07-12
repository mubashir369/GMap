import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
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

    const trafficResultPromises = modes.map((mode) =>
      directionsService.route({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        travelMode: mode,
        avoidTolls: true,
        avoidHighways: true,
        provideRouteAlternatives: true,
      })
    );

    const trafficResults = await Promise.all(trafficResultPromises);

    const trafficRoutes = trafficResults.map((result) => result);

    setTrafficResponse(trafficRoutes);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destinationRef.current.value = "";
  }
console.log("ddddddddddsdsds",trafficResponse);
  function selectRoute(routeIndex) {
    setDirectionsResponse(trafficResponse[routeIndex]);

    const selectedRoute = trafficResponse[routeIndex];
    const selectedDuration = selectedRoute.routes[0].legs[0].duration.text;

    setDuration(selectedDuration);
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
              autocomplete.setComponentRestrictions({ country: "in" }); // Restrict search to India
              autocomplete.setTypes(["(cities)"]); // Restrict search to cities
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
              autocomplete.setComponentRestrictions({ country: "in" }); // Restrict search to India
              autocomplete.setTypes(["(cities)"]); // Restrict search to cities
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

          <ButtonGroup>
            <Button
              colorScheme="pink"
              type="submit"
              onClick={calculateRoute}
            >
              Calculate Route
            </Button>
            <IconButton
              aria-label="center back"
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent="space-between">
          <Text>Distance: {distance} </Text>
          <Text>Duration (CAR): {durations[0]} </Text>
          <Text>Duration (BIKE) : {durations[1]} </Text>
          <Text>Duration (WALKING) : {durations[2]} </Text>
          <IconButton
            aria-label="center back"
            icon={<FaLocationArrow />}
            isRound
            onClick={getCurrentLatLog}
          />
        </HStack>

        {trafficResponse.length > 0 && (
          <Flex direction="column" mt={4}>
            <Text fontWeight="bold">Alternate Routes:</Text>
            {trafficResponse.map((result, index) => (
              <Button
                key={index}
                onClick={() => selectRoute(index)}
                mt={2}
                colorScheme="teal"
              >
                Route {index + 1}
              </Button>
            ))}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

export default App;
