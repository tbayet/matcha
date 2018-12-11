import Vue from "vue";
import './plugins/vuetify'
import App from "./App.vue";
import VueRouter from 'vue-router'
import axios from 'axios'

import Welcome from './components/Welcome'
import Profil from './components/Profil'
import ResetPassword from './components/ResetPassword'
import Browse from './components/Browse'
import Chat from './components/Chat'
import Matches from './components/Matches'

let globalData = new Vue({
  data: {
    $user: {
      id: "",
      token: ""
    }
  }
});
Vue.mixin({
  computed: {
    $user: {
      get: function () { return globalData.$data.$user },
      set: function (newUser) { globalData.$data.$user = newUser; }
    },
    $APIKEY: () => ("matcha42")
  }
})

const getCookieUser = () => {
  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }
  var cookie_user = {
    id: getCookie("id"),
    token: getCookie("token")
  }
  if (cookie_user.id && cookie_user.token)
    globalData.$data.$user = cookie_user
}

const checkUserRights = () => {
  if (!globalData.$data.$user.id || !globalData.$data.$user.token)
    getCookieUser()
  return axios.post('api/users/check', globalData.$data.$user).then(response => (response))
}

const logged_page = (to, from, next) => {
  checkUserRights().then(response => {
    console.log(response.data)
    if (response.data)
      next()
    else
      next("/welcome")
  })
}
const loggout_page = (to, from, next) => {
  checkUserRights().then(response => {
    if (response.data)
      next("/profil")
    else {
      globalData.$data.$user = {id: '', token: ''}
      next()
    }
  })
}

const resetPassword = (to, from, next) => {
  if (to.query.nickname && to.query.key) {
    axios.get('api/users/resetpassword', {params: to.query}).then(response => {
      if (response.data)
        next()
      else
        next('/welcome')
    })
  } else
    next('/welcome')
}

Vue.use(VueRouter)
/*Vue.prototype.$user = {
  nickname: "",
  token: ""
}*/

const router = new VueRouter({
  routes : [
    { path: '/welcome', component: Welcome, alias: '/', beforeEnter: loggout_page},
    { path: '/profil', component: Profil, props: true, beforeEnter: logged_page},
    { path: '/profil/:id', component: Profil, props: true, beforeEnter: logged_page},
    { path: '/resetpassword', component: ResetPassword, beforeEnter: resetPassword},
    { path: '/browse', component: Browse, beforeEnter: logged_page},
    { path: '/chat', component: Chat, beforeEnter: logged_page},
    { path: '/matches', component: Matches, props: true, beforeEnter: logged_page},
    { path: '/matches/:onglet', component: Matches, props: true, beforeEnter: logged_page},
    { path: '*', redirect: '/' }
  ]
})

Vue.config.productionTip = false;


new Vue({
  router,
  render: h => h(App)
}).$mount("#app");
