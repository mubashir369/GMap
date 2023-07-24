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
  Polyline,
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
  const [trafficResponseNew, setTrafficResponseNew]=useState([])
  const originRef = useRef();
  const destinationRef = useRef();
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
          console.log("Error getting geolocation:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser");
    }
  }
  async function calculateRoute() {
    if (originRef.current.value === "" || destinationRef.current.value === "") {
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
        provideRouteAlternatives:true
      })
    );
    const avoidOptions = [
      { avoidTolls: false, avoidHighways: false },
      { avoidTolls: true, avoidHighways: false },
      { avoidTolls: false, avoidHighways: true },
      // Add more options as needed
    ];
    const resultsPromises2 = modes.flatMap((mode) =>
    avoidOptions.map((options) =>
      directionsService.route({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        travelMode: mode,
        ...options,
      })
    )
  );
  const results = await Promise.all(resultsPromises2);

  // Using an object to remove duplicates based on the 'overview_path' contents
  
  const uniqueRoutesObject = {};
  
  for (const curr of results) {
    const overviewPathStr = JSON.stringify(curr.routes[0].overview_path);
    uniqueRoutesObject[overviewPathStr] = curr;
  }
  
  const uniqueArray = Object.values(uniqueRoutesObject);
  
  console.log("Unique Routes:", uniqueArray);
  console.log("All Routes:", results);
    // const results = await Promise.all(resultsPromises);
  let dd=[]
  
    let w=results.find((obj)=>obj.request.travelMode=="WALKING")
    let t=results.find((obj)=>obj.request.travelMode=="TWO_WHEELER")
    let d=results.find((obj)=>obj.request.travelMode=="DRIVING")
    dd[0]=d
    dd[1]=t
    dd[2]=w
    const durations = dd.map(
      (result) => result.routes[0].legs[0].duration.text
    );
  console.log("durationsdurations",durations);
    setDirectionsResponse(results[0]);
    setDistance(results[0].routes[0].legs[0].distance.text);
    setDuration(durations[0]);
    setDurations(durations);
    setTrafficResponse(results);
    setTrafficResponseNew(uniqueArray)

  }
  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destinationRef.current.value = "";
    setSelectedRouteIndex(null);
  }
  function handleRouteClick(index,i) {
    // const selectedRoute = trafficResponse[index];
    console.log("trafficResponseNewtrafficResponseNew",trafficResponseNew[i]);
    const selectedDurations=trafficResponse.filter((obj)=>obj.routes[0].overview_path.length==index)
    const selectedRoute =trafficResponse.reverse().find((obj)=>{
     return obj.routes[0].overview_path.length==index
    })
    console.log(index,"trafficResponsetrafficResponse",trafficResponse);
    console.log("selectedDurationsselectedDurations",selectedDurations);
  console.log(selectedRoute);
    if (selectedDurations) {
      let w=selectedDurations.find((obj)=>obj.request.travelMode=="WALKING")
      console.log("walking tkime",w);
      const walkingTime =
        selectedRoute.routes[0]?.legs[0]?.duration?.text || "";
      const twoWheelerTime =
        selectedRoute.routes[1]?.legs[0]?.duration?.text || "";
      const drivingTime =
        selectedRoute.routes[2]?.legs[0]?.duration?.text || "";

      setDistance(selectedRoute.routes[0]?.legs[0]?.distance?.text || "");
      setSelectedRouteIndex(i);

      const newDurations = [...durations];
      newDurations[0] = drivingTime ? drivingTime : durations[0];
      newDurations[1] = twoWheelerTime ? twoWheelerTime : durations[1];
      // newDurations[2] = walkingTime ? walkingTime : durations[2];
  
      setDurations(newDurations);
      // console.log("Walking Time:", walkingTime);
      // console.log("Two-Wheeler Time:", twoWheelerTime);
      // console.log("Driving Time:", drivingTime);
  
      setDirectionsResponse(selectedRoute);
      setDuration(newDurations[index]);
    }
  }
   
  
  if (!isLoaded) {
    return <SkeletonText />;
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
          {trafficResponseNew.map((result, index) => (
            <React.Fragment key={index}>
              {result && result.routes && result.routes.length > 0 && (
                <Polyline
                  path={result.routes[0].overview_path}
                  options={{
                    strokeColor:
                      index === selectedRouteIndex ? "#00FF00" : "#888888",
                    strokeOpacity: 0.7,
                    strokeWeight: 5,
                  }}
                  onClick={
                    () => handleRouteClick(result.routes[0].overview_path.length,index)
                  }
                />
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
            <Input type="text" placeholder="Destination" ref={destinationRef} />
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
