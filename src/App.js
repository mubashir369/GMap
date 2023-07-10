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
import { useJsApiLoader, GoogleMap,Marker,Autocomplete,DirectionsRenderer } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
function App() {
 
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries:[
      'places'
    ]
  });
  const [Map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [center,setCenter]=useState({ lat: 10.850516, lng: 76.27108 })
  const [directionsResponse,setDirectionsResponse]=useState(null)
  const [distance,setDestance]=useState('')
  const [duration,setDuration]=useState('')
  const originRef=useRef()
  const destinationRef=useRef()

  if (!isLoaded) {
    return <SkeletonText />;
  }

  function getCurrentLatLog(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setCenter({
            lat:latitude,
            lng:longitude
          })
          console.log("Latitude:", latitude);
          console.log("Longitude:", longitude);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
    }
  }
  const fetchGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // setLatitude(latitude);
          // setLongitude(longitude);
          setCenter({
            lat:latitude,
            lng:longitude
          })
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
    }
  };
 
  async function calculateRoute(){
   
    if(originRef.current.value==''||destinationRef.current.value==''){
      return 
    }
    const directionsService=new window.google.maps.DirectionsService()
    
    const results=await directionsService.route({
      origin:originRef.current.value,
      destination:destinationRef.current.value,
      travelMode:window.google.maps.TravelMode.DRIVING
    })
    setDirectionsResponse(results)
    setDestance(results.routes[0].legs[0].distance.text)
    setDuration(results.routes[0].legs[0].duration.text)
  }
  function clearRoute(){
    setDirectionsResponse(null)
    setDestance('')
    setDuration('')
    originRef.current.value=''
    destinationRef.current.value=''
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
          options={
            {
              zoomControl:false,
              streetViewControl:false,
              mapTypeControl:false,
              fullscreenControl:false
            }
          }
          onLoad={map=>setMap(map)}
        >
          <Marker position={center} />
          {
            directionsResponse&&<DirectionsRenderer directions={directionsResponse} />
          }
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
          <div >
          <Autocomplete style={{ zIndex: 15 }}>
          <Input   type="text" placeholder="Origin" ref={originRef} />
          </Autocomplete>
          </div>
          <div>
          <Autocomplete style={{ zIndex: 15 }}>
          <Input type="text" placeholder="Destination" ref={destinationRef} />
          </Autocomplete>
          </div>
         
         
          <ButtonGroup>
            <Button colorScheme="pink" type="submit" onClick={calculateRoute}>
              Calculate Route
            </Button>
            <IconButton
              aria-label="center back"
              icon={<FaTimes />}
              onClick={() => clearRoute()}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent="space-between">
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label="center back"
            icon={<FaLocationArrow />}
            isRound
            onClick={() =>{
              fetchGeolocation()
              Map.panTo(center) 
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default App;
