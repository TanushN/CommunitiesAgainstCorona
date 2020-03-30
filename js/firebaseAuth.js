(function() {

var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

const btnLogin = document.getElementById('loginBtn'); 

var user;
console.log(window.location);

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
.then(function() {
  // In memory persistence will be applied to the signed in Google user
  // even though the persistence was set to 'none' and a page redirect
  // occurred.
  
})
.catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  console.log(errorMessage);
});

$("#loginNavBar").on('click',function(event){
  firebase.auth().signInWithRedirect(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    user = result.user;
    
    // ...
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
});

$("#loginButton").on('click',function(event){
  firebase.auth().signInWithRedirect(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    user = result.user;
    
    // ...
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
});



var userRef = firebase.database().ref("Users");
firebase.auth().onAuthStateChanged(user => {
    if(user) {
      console.log(window.location.pathname);
      console.log('logged in');

      firebase.database().ref('Users/' + user.uid).once("value", snapshot => {
        if (snapshot.exists()){
           console.log("exists!");
        }
        else{
            firebase.database().ref('Users/' + user.uid).set({
                displayname: user.displayName,
                email: user.email,
                profile_picture : user.photoURL
            }, function(error) {
                if (error) {
                // The write failed...
                console.log('failed');
                } else {
                console.log('yay');
                }
            });
        }
     });

        window.location = "gmaps.html";
    
        
      }
      else
      {
        console.log('logged out');
        
      }
    
  });




}());
