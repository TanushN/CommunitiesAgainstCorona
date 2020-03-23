var map;
var globalmarkers = [];
var globalmarkerC
var marker = {};
var geocoder;
var user;
var i = 0;



function initMap(){


    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 13
    });
    

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.setCenter(pos);
      } else {
        //x.innerHTML = "Geolocation is not supported by this browser.";
      }
    }
    
    var locationsRef = firebase.database().ref("Locations");
    geocoder = new google.maps.Geocoder();
    locationsRef.on('child_added', function(snapshot) {
    var data = snapshot.val();
    var key = snapshot.key;
    var lat = data.l[0];
    var lng = data.l[1];
    
    AddMarker(key,lat,lng);
    
        });

    locationsRef.on('child_removed', function(snapshot) {
        var data = snapshot.val();
        var key = snapshot.key;
        console.log(data);
        var x;
        for(x in globalmarkers){
            if(globalmarkers[x].key_id == key){
                globalmarkers[x].setMap(null);
                console.log('removed')
            }
        };

        });

        locationsRef.on('child_changed', function(snapshot) {
            var data = snapshot.val();
            var key = snapshot.key;
            console.log(data);
            var x;
            for(x in globalmarkers){
                if(globalmarkers[x].key_id == key){
                
                    var lat = data.l[0];
                    var lng = data.l[1];
                    globalmarkers[x].setMap(null);
                    console.log('removedMarker?')
                    AddMarker(key,lat,lng);
                }
            };
    
            });

            var locationsInfoRef = firebase.database().ref("LocationsInfo");
            var locationsCategoryRef = firebase.database().ref("LocationsCategory");

            locationsInfoRef.on('child_changed', function(snapshot) {
                var data = snapshot.val();
                var key = snapshot.key;
                console.log(data);
                var x;
                for(x in globalmarkers){
                    if(globalmarkers[x].key_id == key){
        
                        var lat = globalmarkers[x].getPosition().lat();
                        var lng = globalmarkers[x].getPosition().lng();
                        globalmarkers[x].setMap(null);
                        console.log('removedMarker?')
                        AddMarker(key,lat,lng);
                    }
                };
        
                });

            locationsCategoryRef.on('child_changed', function(snapshot) {
                var data = snapshot.val();
                var key = snapshot.key;
                console.log(data);
                var x;
                for(x in globalmarkers){
                    if(globalmarkers[x].key_id == key){
                        var lat = globalmarkers[x].getPosition().lat();
                        var lng = globalmarkers[x].getPosition().lng();
                        globalmarkers[x].setMap(null);
                        console.log('removedMarker?')
                        AddMarker(key,lat,lng);
                    }
                };
        
                });


            housekeeping();



function housekeeping(){

    $('#submitMarker').on('click', function(event) {
        var isvalid = $("#addMarker")[0].checkValidity();
        if (isvalid) {
            event.preventDefault();
            var adressLine = $('#adressInput').val();
            var city = $('#cityInput').val();
            var state = $('#stateControlSelect').val();
            var fullAdress = adressLine + "," + city + "," + state;
            codeAddress(fullAdress);

        }
      });

      
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log(user.uid);
            $('#displayNameText').text(user.displayName)
            $("#userProfileImage").attr("src",user.photoURL);
            console.log('signed in');

            EachUserLocation(user);



        } else {
            console.log('signed out');
            if(window.location.pathname == "/CoronaCrisis/gmaps.html"){
                window.location = "/CoronaCrisis/index.html";
            }
        }
      });

    $('#btnShowFormAddMarker').on('click', function(event) {
        $("#formAddMarker").show();
        $("#btnShowFormAddMarker").hide();
      });

      
    const bntLogout = document.getElementById('btnLogout');
    bntLogout.addEventListener('click', e =>{
        console.log('logging out');
        firebase.auth().signOut();


    });
}

function codeAddress(address) {
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
        
        console.log(results[0]);
        var geoFire = new GeoFire(firebase.database().ref("Locations"));
        some_key = firebase.database().ref("Locations").push().getKey();
        
        var firstAndLast = $('#nameInput').val();
        var formatted_address = results[0].formatted_address;
        var phoneNumber = $('#phoneNumberInput').val();
        var category = $('#categoryControlSelect').val();
        var description = $('#descriptionTextArea').val();

        var locationsInfoRef = firebase.database().ref("LocationsInfo/" + some_key);
        var locationsCategoryRef = firebase.database().ref("LocationsCategory/" + some_key);
        var UserLocationsRef = firebase.database().ref("UserLocations/" + firebase.auth().currentUser.uid + "/" + some_key);
        //firebase.auth().currentUser.uid

        locationsInfoRef.set({
            firstAndLast: firstAndLast,
            formatted_address: formatted_address,
            phoneNumber: phoneNumber,
            description: description,
            user_uid: firebase.auth().currentUser.uid
        }, function(error) {
            if (error) {
            // The write failed...
            console.log('failed');
            } else {
            console.log('succes locationsInfo updated');
            }
        });

        locationsCategoryRef.set({
            category: category
        }, function(error) {
            if (error) {
            // The write failed...
            console.log('failed');
            } else {
            console.log('succes locationsCategory updated');
            }
        });

        UserLocationsRef.set({
            active:'yes'
        }, function(error) {
            if (error) {
            // The write failed...
            console.log('failed');
            } else {
            console.log('succes UserLocations updated');
            }
        });

        geoFire.set(some_key, [results[0].geometry.location.lat(),results[0].geometry.location.lng()]).then(function() {
            console.log("Provided key has been added to GeoFire");
        }, function(error) {
            console.log("Error: " + error);
        });

        $("#formAddMarker").hide();
        $("#btnShowFormAddMarker").show();

        $('#UserMarkersList').empty();
        var k = $('<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>')
        $('.list-group').append(k);
        var user = firebase.auth().currentUser;
        EachUserLocation(user);
            
      }
      else if(status == "ZERO_RESULTS"){
          console.log('error')

        $("#errorLabelAddMarker").text('Invalid Adress');
      }
      else {
        alert('Geocode was not successful for the following reason: ' + status);
        console.log('status');
      }
    });
  }

function AddMarker(key,lat,lng){

    console.log(key);
    var contentType;

    var ref = firebase.database().ref("LocationsCategory/" + key);
 
    ref.once('value', function(snapshot) {

        var value = snapshot.val().category;
        

        var f;
    if(value == "TP"){
        f = "assets/toilet-paper.png";
        contentType = "Toilet-Paper/Sanitary Items"
    }
    if(value == "FD"){
        f = "assets/food.png";
        contentType = "Food";
    }
    if(value == "WR"){
        f = "assets/water.png";
        contentType = "Water"
    }
    if(value == "OR"){
        f = "assets/more.png";
        contentType = "Miscellaneous"
    }

    marker = new google.maps.Marker({ // create a marker and set id
        position: {
            lat: lat,
            lng: lng,
        },
        map: map,
        key_id : key,
        icon: f
    });
    
    var contentPerson;
    var description;
    var formatted_address;
    var q;
    var phoneNumber;

    firebase.database().ref('LocationsInfo/' + key).once('value', function(snapshot) {

        var value = snapshot.val();
        contentPerson = value.firstAndLast;
        description = value.description;
        formatted_address = value.formatted_address;
        phoneNumber = value.phoneNumber;
        q  = $.trim(value.formatted_address).replace(/\r?\n/, ',').replace(/\s+/g, ' ');  
        
    });

    marker.addListener('click', function() {
        if(!this.infoWindow) {
          this.infoWindow = new google.maps.InfoWindow({
            content: '<div id="content">'+
            '<h2 id="firstHeading" class="firstHeading">'+ contentType +'</h2>'+
            '<h4 >'+ "Provided by " + contentPerson +'</h4>'+
            '<div id="bodyContent">'+
            '<p>'+ description +'</p>'+
            '<p> Phone Number: '+ phoneNumber +'</p>'+
            '<p>Address: <a href="http://maps.google.com/maps?q=' + encodeURIComponent(q) + '">'+ formatted_address + '</a>'+
            '</p>'+
            '</div>'+
            '</div>'
          });
        }
        this.infoWindow.open(map,this);
      })

    globalmarkers.push(marker);
    
    });

}

function addToList(key){

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

    locationsCategoryRef.once('value',function(snapshot) {

        value = snapshot.val().category;
        categoryVal = value;

        if(value == "TP"){
            category = "Toilet-Paper/Sanitary Items"
        }
        if(value == "FD"){
            
            category = "Food";
        }
        if(value == "WR"){
            
            category = "Water"
        }
        if(value == "OR"){
            
            category = "Miscellaneous"
        }

    });

    locationsInfoRef.once('value',function(snapshot) {
        value = snapshot.val();
        firstAndLast = value.firstAndLast;
        phoneNumber = value.phoneNumber;
        description = value.description;

        var stringdone = value.formatted_address.split(",");
    
        addressLine = stringdone[0].trim();
        city = stringdone[1].trim();
        state = (stringdone[2].split(" "))[1];
    
        var r= $('<button id="listButton' + i + '" class="list-group-item list-group-item-action">' + category + ' Marker In ' + city + '</button>')
    
        $('.list-group').append(r);
        button = "#listButton" + i;
        $(button).on('click', function(event) {

            updateLocationInfo(button,categoryVal,firstAndLast,phoneNumber,addressLine,city,state,description,key);
            

        });
        i++;

    });

    
    

}

function updateLocationInfo(button, categoryVal,firstAndLast,phoneNumber,addressLine,city,state,description,key){
    
    console.log(key);

    $("#UserMarkersList").hide();
    $("#formUpdateMarker").show();
    $("#nameInputUpdate").val(firstAndLast);
    $("#phoneNumberInputUpdate").val(phoneNumber);
    $("#adressInputUpdate").val(addressLine);
    $("#cityInputUpdate").val(city);
    $("#stateControlSelectUpdate").val(state);
    $("#categoryControlSelectUpdate").val(categoryVal);
    $("#descriptionTextAreaUpdate").val(description);

    $('#removeMarker').on('click', function(event){

        console.log('removing starting');
        
        firebase.database().ref("LocationsInfo/" + key).remove();
        firebase.database().ref("LocationsCategory/" + key).remove();
        firebase.database().ref("UserLocations/" + firebase.auth().currentUser.uid + "/" + key).remove();
        firebase.database().ref("Locations/" + key).remove();

        $("#formUpdateMarker").hide();
        $("#UserMarkersList").show();
        $('#UserMarkersList').empty();
        var k = $('<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>')
        $('.list-group').append(k);
        var user = firebase.auth().currentUser;
        EachUserLocation(user);


    });

    $('#closeUpdateForm').on('click',function(event){
        $("#formUpdateMarker").hide();
        $("#UserMarkersList").show();
    });



    $('#updateMarker').on('click', function(event) {
        var isvalid = $("#updateMarkerForm")[0].checkValidity();
        if (isvalid) {
            event.preventDefault();
            adressLine = $('#adressInputUpdate').val();
            city = $('#cityInputUpdate').val();
            state = $('#stateControlSelectUpdate').val();
            var fullAddress = adressLine + "," + city + "," + state;
            

            geocoder.geocode( {'address': fullAddress}, function(results, status) {
                if (status == 'OK') {
                  
                 console.log(key);
                  var geoFire = new GeoFire(firebase.database().ref("Locations"));
                  geoFire.set(key, [results[0].geometry.location.lat(),results[0].geometry.location.lng()]).then(function() {
                      console.log("Provided key has been added to GeoFire");
                  }, function(error) {
                      console.log("Error: " + error);
                  });
          
                  firstAndLast = $('#nameInputUpdate').val();
                  formatted_address = results[0].formatted_address;
                  phoneNumber = $('#phoneNumberInputUpdate').val();
                  category = $('#categoryControlSelectUpdate').val();
                  description = $('#descriptionTextAreaUpdate').val();
          
                  var locationsInfoRef = firebase.database().ref("LocationsInfo/" + key);
                  var locationsCategoryRef = firebase.database().ref("LocationsCategory/" + key);
                  var UserLocationsRef = firebase.database().ref("UserLocations/" + firebase.auth().currentUser.uid + "/" + key);
          
                  locationsInfoRef.set({
                      firstAndLast: firstAndLast,
                      formatted_address: formatted_address,
                      phoneNumber: phoneNumber,
                      description: description,
                      user_uid: firebase.auth().currentUser.uid
                  }, function(error) {
                      if (error) {
                      // The write failed...
                      console.log('failed');
                      } else {
                      console.log('success locationsInfo updated');
                      }
                  });
          
                  locationsCategoryRef.set({
                      category: category
                  }, function(error) {
                      if (error) {
                      // The write failed...
                      console.log('failed');
                      } else {
                      console.log('success locationsCategory updated');
                      }
                  });
          
                  UserLocationsRef.set({
                      active:'yes'
                  }, function(error) {
                      if (error) {
                      // The write failed...
                      console.log('failed');
                      } else {
                      console.log('success UserLocations updated');
                      }
                  });
                  $("#formUpdateMarker").hide();
                  $("#UserMarkersList").show();
                  $('#UserMarkersList').empty();
                  var k = $('<button type="button" class="list-group-item list-group-item-action active" style="margin-top: 10px" disabled>Click on the item to view and manage it </button>')
                  $('.list-group').append(k);
                  var user = firebase.auth().currentUser;
                  EachUserLocation(user);


                }
                else if(status == "ZERO_RESULTS"){
                    console.log('error')
          
                  $("#errorLabelAddMarkerUpdate").text('Invalid Adress');
                }
                else {
                  alert('Geocode was not successful for the following reason: ' + status);
                  console.log('status');
                }
              });



        }
      });
    


}

function EachUserLocation(user){
    console.log(user)
    var UserLocationsRef = firebase.database().ref("UserLocations/" + user.uid).orderByKey();
        UserLocationsRef.once("value")
        .then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
            var key = childSnapshot.key; 
            addToList(key);
            
        });
        });


}

function removeMarker(key){




}



