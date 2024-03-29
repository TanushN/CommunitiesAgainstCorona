
var map;
var globalmarkers = [];
var globalmarkerC;
var markers = {};
var marker = {};
var geocoder;
var user;
var i = 0;
var alreadyupdated = 0;
var client;

function initMap() {
  mapboxgl.accessToken =
    "";
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    zoom: 4,
    center: [-95.712891, 37.09024],
  });



  client = mapboxSdk({ accessToken: mapboxgl.accessToken });

  var address = "8680 marigold cir Eden prairie MN 55344";


  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      map.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 10,
      });
    });
  } else {
    // Browser doesn't support Geolocation
  }

  var locationsRef = firebase.database().ref("Locations");

  // geocoder = new google.maps.Geocoder();

  locationsRef.on("child_added", function (snapshot) {
    var data = snapshot.val();
    var key = snapshot.key;
    var lat = data.l[0];
    var lng = data.l[1];

    AddMarker(key, lat, lng);
  });

  locationsRef.on("child_removed", function (snapshot) {
    var data = snapshot.val();
    var key = snapshot.key;
    var x;
    markers[key].remove();
    console.log("removed");
    $("#UserMarkersList").empty();
    var k = $(
      '<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>'
    );
    $(".list-group").append(k);
    var user = firebase.auth().currentUser;
    EachUserLocation(user);
  });

  locationsRef.on("child_changed", function (snapshot) {
    var data = snapshot.val();
    var key = snapshot.key;
    var x;

    if (markers[key]) {
      var lat = data.l[0];
      var lng = data.l[1];
      markers[key].remove();
      console.log("childchanged?");
      AddMarker(key, lat, lng);
    }
  });

  var locationsInfoRef = firebase.database().ref("LocationsInfo");
  var locationsCategoryRef = firebase.database().ref("LocationsCategory");

  locationsInfoRef.on("child_changed", function (snapshot) {
    var data = snapshot.val();
    var key = snapshot.key;
    var x;

    if (markers[key]) {
      var lat = markers[key]._lngLat.lat;
      var lng = markers[key]._lngLat.lng;
      markers[key].remove();
      AddMarker(key, lat, lng);
    }
  });

  locationsCategoryRef.on("child_changed", function (snapshot) {
    var data = snapshot.val();
    var key = snapshot.key;
    console.log(data);
    var x;

    if (markers[key]) {
      var lat = markers[key]._lngLat.lat;
      var lng = markers[key]._lngLat.lng;
      markers[key].remove();
      AddMarker(key, lat, lng);
    }
  });
  housekeeping();
}

function housekeeping() {
  $("#submitMarker").on("click", function (event) {
    var isvalid = $("#addMarker")[0].checkValidity();
    if (isvalid) {
      event.preventDefault();
      var adressLine = $("#adressInput").val();
      var city = $("#cityInput").val();
      var state = $("#stateControlSelect").val();
      var fullAdress = adressLine + " " + city + " " + state;
      codeAddress(fullAdress);
    }
  });

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      
      $("#displayNameText").text(user.displayName);
      $("#userProfileImage").attr("src", user.photoURL);
      console.log("signed in");

      EachUserLocation(user);
    } else {
      console.log("signed out");
      window.location = "index.html";
    }
  });

  $("#btnShowFormAddMarker").on("click", function (event) {
    $("#formAddMarker").show();
    $("#btnShowFormAddMarker").hide();
  });

  const bntLogout = document.getElementById("btnLogout");
  bntLogout.addEventListener("click", (e) => {
    console.log("logging out");
    firebase.auth().signOut();
  });
}

function codeAddress(address) {
  client.geocoding
    .forwardGeocode({
      query: address,
      limit: 3,
    })
    .send()
    .then((response) => {
      const match = response.body;
      if (match.features[0].relevance >= 0.9) {
        var lngLat = match.features[0].geometry.coordinates;

        var geoFire = new GeoFire(firebase.database().ref("Locations"));
        some_key = firebase.database().ref("Locations").push().getKey();

        var firstAndLast = $("#nameInput").val();
        var formatted_address = match.features[0].place_name;
        var phoneNumber = $("#phoneNumberInput").val();
        var category = $("#categoryControlSelect").val();
        var description = $("#descriptionTextArea").val();

        var locationsInfoRef = firebase
          .database()
          .ref("LocationsInfo/" + some_key);
        var locationsCategoryRef = firebase
          .database()
          .ref("LocationsCategory/" + some_key);
        var UserLocationsRef = firebase
          .database()
          .ref(
            "UserLocations/" + firebase.auth().currentUser.uid + "/" + some_key
          );
        //firebase.auth().currentUser.uid

        locationsInfoRef.set(
          {
            firstAndLast: firstAndLast,
            formatted_address: formatted_address,
            phoneNumber: phoneNumber,
            description: description,
            user_uid: firebase.auth().currentUser.uid,
          },
          function (error) {
            if (error) {
              // The write failed...
              console.log("failed");
            } else {
              console.log("succes locationsInfo updated");
            }
          }
        );

        locationsCategoryRef.set(
          {
            category: category,
          },
          function (error) {
            if (error) {
              // The write failed...
              console.log("failed");
            } else {
              console.log("succes locationsCategory updated");
            }
          }
        );

        UserLocationsRef.set(
          {
            active: "yes",
          },
          function (error) {
            if (error) {
              // The write failed...
              console.log("failed");
            } else {
              console.log("succes UserLocations updated");
            }
          }
        );

        geoFire.set(some_key, [lngLat[1], lngLat[0]]).then(
          function () {
            console.log("Provided key has been added to GeoFire");
          },
          function (error) {
            console.log("Error: " + error);
          }
        );

        $("#formAddMarker").hide();
        $("#btnShowFormAddMarker").show();

        $("#UserMarkersList").empty();
        var k = $(
          '<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>'
        );
        $(".list-group").append(k);
        var user = firebase.auth().currentUser;
        EachUserLocation(user);
      } else {
        $("#errorLabelAddMarker").text(
          "Invalid Adress, Please Check Fields Carefully"
        );
        console.log("adress search relevance lower than 0.9");
      }
    });
}

function AddMarker(key, lat, lng) {
  var contentType;

  var ref = firebase.database().ref("LocationsCategory/" + key);

  ref.once("value", function (snapshot) {
    var value = snapshot.val().category;

    var f;
    if (value == "TP") {
      f = "assets/toilet-paper.png";
      contentType = "Toilet-Paper/Sanitary Items";
    }
    if (value == "FD") {
      f = "assets/food.png";
      contentType = "Food";
    }
    if (value == "WR") {
      f = "assets/water.png";
      contentType = "Water";
    }
    if (value == "OR") {
      f = "assets/more.png";
      contentType = "Miscellaneous";
    }

    

    var el = document.createElement("div");
    el.style.backgroundImage = "url(" + f + ")";
    el.style.width = "32px";
    el.style.height = "32px";

    var newMarker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);

    var contentPerson;
    var description;
    var formatted_address;
    var q;
    var phoneNumber;

    firebase
      .database()
      .ref("LocationsInfo/" + key)
      .once("value", function (snapshot) {
        var value = snapshot.val();
        contentPerson = value.firstAndLast;
        description = value.description;
        formatted_address = value.formatted_address;
        phoneNumber = value.phoneNumber;
        q = $.trim(value.formatted_address)
          .replace(/\r?\n/, ",")
          .replace(/\s+/g, " ");
      });

    var popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      '<div id="content">' +
        '<h2 id="firstHeading" class="firstHeading">' +
        contentType +
        "</h2>" +
        "<h4 >" +
        "Provided by " +
        contentPerson +
        "</h4>" +
        '<div id="bodyContent">' +
        "<p> Description: " +
        description +
        "</p>" +
        "<p> Phone Number: " +
        phoneNumber +
        "</p>" +
        '<p>Address: <a href="http://maps.google.com/maps?q=' +
        encodeURIComponent(q) +
        '">' +
        formatted_address +
        "</a>" +
        "</p>" +
        "</div>" +
        "</div>"
    );

    newMarker.setPopup(popup);

    markers[key] = newMarker;
  });
}

function addToList(key) {
  

  var category;
  var categoryVal;
  var firstAndLast;
  var phoneNumber;
  var addressLine;
  var city;
  var state;
  var description;

  locationsInfoRef = firebase.database().ref("LocationsInfo/" + key);
  locationsCategoryRef = firebase.database().ref("LocationsCategory/" + key);

  locationsCategoryRef.once("value", function (snapshot) {
    value = snapshot.val().category;
    categoryVal = value;

    if (value == "TP") {
      category = "Toilet-Paper/Sanitary Items";
    }
    if (value == "FD") {
      category = "Food";
    }
    if (value == "WR") {
      category = "Water";
    }
    if (value == "OR") {
      category = "Miscellaneous";
    }
  });

  locationsInfoRef.once("value", function (snapshot) {
    value = snapshot.val();
    firstAndLast = value.firstAndLast;
    phoneNumber = value.phoneNumber;
    description = value.description;

    var stringdone = value.formatted_address.split(",");
   

    addressLine = stringdone[0].trim();
    city = stringdone[1].trim();
    state = getStateMap(stringdone[2].split(" ")[1]);
    

    var r = $(
      '<button id="listButton' +
        i +
        '" class="list-group-item list-group-item-action">' +
        category +
        " Marker In " +
        city +
        "</button>"
    );

    $(".list-group").append(r);
    
    button = "#listButton" + i;
    $(button).on("click", function (event) {
      updateLocationInfo(
        button,
        categoryVal,
        firstAndLast,
        phoneNumber,
        addressLine,
        city,
        state,
        description,
        key
      );
    });
    i++;
  });
}

function updateLocationInfo(
  button,
  categoryVal,
  firstAndLast,
  phoneNumber,
  addressLine,
  city,
  state,
  description,
  key
) {
  

  $("#UserMarkersList").hide();
  $("#formUpdateMarker").show();
  $("#nameInputUpdate").val(firstAndLast);
  $("#phoneNumberInputUpdate").val(phoneNumber);
  $("#adressInputUpdate").val(addressLine);
  $("#cityInputUpdate").val(city);
  $("#stateControlSelectUpdate").val(state);
  $("#categoryControlSelectUpdate").val(categoryVal);
  $("#descriptionTextAreaUpdate").val(description);

  $("#removeMarker").on("click", function (event) {
    

    firebase
      .database()
      .ref("LocationsInfo/" + key)
      .remove();
    firebase
      .database()
      .ref("LocationsCategory/" + key)
      .remove();
    firebase
      .database()
      .ref("UserLocations/" + firebase.auth().currentUser.uid + "/" + key)
      .remove();
    firebase
      .database()
      .ref("Locations/" + key)
      .remove();

    $("#formUpdateMarker").hide();
    $("#UserMarkersList").show();
    $("#UserMarkersList").empty();
    var k = $(
      '<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>'
    );
    $(".list-group").append(k);
    var user = firebase.auth().currentUser;
    EachUserLocation(user);
  });

  $("#closeUpdateForm").on("click", function (event) {
    $("#formUpdateMarker").hide();
    $("#UserMarkersList").show();
  });

  $("#updateMarker").on("click", function (event) {
    var isvalid = $("#updateMarkerForm")[0].checkValidity();
    if (isvalid) {
      event.preventDefault();
      adressLine = $("#adressInputUpdate").val();
      city = $("#cityInputUpdate").val();
      state = $("#stateControlSelectUpdate").val();
      var fullAddress = adressLine + " " + city + " " + state;

      client.geocoding
        .forwardGeocode({
          query: fullAddress,
          limit: 3,
        })
        .send()
        .then((response) => {
          const match = response.body;
          if (match.features[0].relevance >= 0.9) {
            var lngLat = match.features[0].geometry.coordinates;
            var geoFire = new GeoFire(firebase.database().ref("Locations"));
            geoFire.set(key, [lngLat[1], lngLat[0]]).then(
              function () {
                console.log("Provided key has been added to GeoFire");
              },
              function (error) {
                console.log("Error: " + error);
              }
            );

            firstAndLast = $("#nameInputUpdate").val();
            formatted_address = match.features[0].place_name;
            phoneNumber = $("#phoneNumberInputUpdate").val();
            category = $("#categoryControlSelectUpdate").val();
            description = $("#descriptionTextAreaUpdate").val();

            var locationsInfoRef = firebase
              .database()
              .ref("LocationsInfo/" + key);
            var locationsCategoryRef = firebase
              .database()
              .ref("LocationsCategory/" + key);
            var UserLocationsRef = firebase
              .database()
              .ref(
                "UserLocations/" + firebase.auth().currentUser.uid + "/" + key
              );

            locationsInfoRef.set(
              {
                firstAndLast: firstAndLast,
                formatted_address: formatted_address,
                phoneNumber: phoneNumber,
                description: description,
                user_uid: firebase.auth().currentUser.uid,
              },
              function (error) {
                if (error) {
                  // The write failed...
                  console.log("failed");
                } else {
                  console.log("success locationsInfo updated");
                }
              }
            );

            locationsCategoryRef.set(
              {
                category: category,
              },
              function (error) {
                if (error) {
                  // The write failed...
                  console.log("failed");
                } else {
                  console.log("success locationsCategory updated");
                }
              }
            );

            UserLocationsRef.set(
              {
                active: "yes",
              },
              function (error) {
                if (error) {
                  // The write failed...
                  console.log("failed");
                } else {
                  console.log("success UserLocations updated");
                }
              }
            );

            $("#formUpdateMarker").hide();
            $("#UserMarkersList").show();
            $("#UserMarkersList").empty();
            var k = $(
              '<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>'
            );
            $(".list-group").append(k);
            var user = firebase.auth().currentUser;
            EachUserLocation(user);
          } else {
            $("#errorLabelAddMarkerUpdate").text("Invalid Adress");
            console.log(
              "update failed because adress relevance was lower than 0.9"
            );
          }
        });
    }
  });
}

function EachUserLocation(user) {
  var UserLocationsRef = firebase
    .database()
    .ref("UserLocations/" + user.uid)
    .orderByKey();
  UserLocationsRef.once("value").then(function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var key = childSnapshot.key;
      addToList(key);
    });
  });
}


function getStateMap(state) {

  stateList =  {
    Arizona: "AZ",
    Alabama: "AL",
    Alaska: "AK",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
  };

  if(stateList[state]){
    return stateList[state];
  }
  else{
    return state;
  }

  
}

