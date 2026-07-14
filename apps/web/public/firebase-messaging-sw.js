// Classic worker outside Vite's module graph: no import.meta.env, so the
// Firebase config is inlined literally (public identifiers, duplicated from
// src/shared/firebase/config.ts by hand — keep the two in sync).
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js',
)
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js',
)

firebase.initializeApp({
  apiKey: 'AIzaSyCvTPBzyvCQ5izsnb1hgg2Ef0t1Vrj-NYY',
  authDomain: 'raiymbek-park-sa99.firebaseapp.com',
  projectId: 'raiymbek-park-sa99',
  storageBucket: 'raiymbek-park-sa99.firebasestorage.app',
  messagingSenderId: '1017112042712',
  appId: '1:1017112042712:web:239e65ecd84d615ed54bad',
})

firebase.messaging()
