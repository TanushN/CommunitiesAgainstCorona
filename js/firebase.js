(function() {

    var firebaseConfig = {
        apiKey: "AIzaSyA0FHVj7r7SflnZkuIMAfnsRfxjxST4B3I",
        authDomain: "corona-crisis-4691e.firebaseapp.com",
        databaseURL: "https://corona-crisis-4691e.firebaseio.com",
        projectId: "corona-crisis-4691e",
        storageBucket: "corona-crisis-4691e.appspot.com",
        messagingSenderId: "234329755517",
        appId: "1:234329755517:web:cac82a16c8a57a663e4614",
        measurementId: "G-WRTP3BLFHF"
    };
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

}());