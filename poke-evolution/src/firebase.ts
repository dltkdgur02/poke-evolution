// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTgNmQmDTMnU8NVtE0U8BnWoLEfeVWy_I",
    authDomain: "poke-evolution-db-a1baf.firebaseapp.com",
    projectId: "poke-evolution-db-a1baf",
    storageBucket: "poke-evolution-db-a1baf.firebasestorage.app",
    messagingSenderId: "3735477107",
    appId: "1:3735477107:web:0da58ffc07c14fdb388306",
    measurementId: "G-W7N88XVEQY"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 다른 파일에서 사용할 수 있도록 auth와 db를 export 합니다.
export const auth = getAuth(app);
export const db = getFirestore(app);