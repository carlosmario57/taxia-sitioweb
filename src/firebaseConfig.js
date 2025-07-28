// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries



// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM",

  authDomain: "taxia-cimco.firebaseapp.com",

  projectId: "taxia-cimco",

  storageBucket: "taxia-cimco.firebasestorage.app",

  messagingSenderId: "529767434961",

  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0",

  measurementId: "G-GRGT80HX63"

};



// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);