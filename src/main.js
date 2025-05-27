import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'

// Importancion de autosize de los textarea
import VueTextareaAutosize from "vue-textarea-autosize";
Vue.use(VueTextareaAutosize);

// Importacion de base de datos con firebase
import firebase from "firebase/app";
import "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRv1bZILAsVAOF2F7TyZXxJ8oiJApEQLA",
  authDomain: "vue-calendario-yt-6c91f.firebaseapp.com",
  projectId: "vue-calendario-yt-6c91f",
  storageBucket: "vue-calendario-yt-6c91f.firebasestorage.app",
  messagingSenderId: "505865408610",
  appId: "1:505865408610:web:4824276343da4a4499813b"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
