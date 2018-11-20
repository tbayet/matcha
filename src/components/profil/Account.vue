<template>
  <v-card-title>
    <div>
      <h2>{{profile.nickname}} <span v-if="profile.age">({{calcAge(profile.age)}} yo)</span></h2>
      <p class="grey--text">{{profile.firstname}} {{profile.lastname}}</p>
    </div>
    <v-spacer></v-spacer>
    <v-spacer>{{profile.popularity}}</v-spacer>
    <h3>{{gender(profile.gender)}} {{orientation(profile.orientation)}}</h3>

    <v-dialog v-if="owner" v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-btn icon slot="activator">
        <v-icon>create</v-icon>
      </v-btn>
      <v-card>
        <v-toolbar dark color="primary">
          <v-toolbar-title>Account settings</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn dark flat @click.native="dialog = false">Cancel</v-btn>
            <v-btn dark flat @click.native="submit">Save</v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-alert transition="scale-transition" outline :value="!!alert.type" :type="alert.type">{{alert.message}}</v-alert>
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-text-field
            v-model="newProfile.email"
            :rules="rules.email"
            label="E-mail"
          ></v-text-field>
          <v-text-field
            v-model="newProfile.firstname"
            :rules="rules.firstname"
            label="Firstname"
          ></v-text-field>
          <v-text-field
            v-model="newProfile.lastname"
            :rules="rules.lastname"
            label="Lastname"
          ></v-text-field>
          <v-text-field
            type="password"
            v-model="newProfile.password"
            :rules="rules.password"
            label="Password"
            placeholder="********"
          ></v-text-field>

          <v-radio-group v-model="newProfile.gender" row>
            <v-radio label="Male" color="blue" value="1"></v-radio>
            <v-radio label="Female" color="pink" value="2"></v-radio>
          </v-radio-group>
          <v-radio-group v-model="newProfile.orientation" row>
            <v-radio label="Heterosexual" color="green" value="1"></v-radio>
            <v-radio label="Homosexual" color="orange" value="2"></v-radio>
            <v-radio label="Bisexual" color="purple" value="3"></v-radio>
          </v-radio-group>
          <v-text-field
            type="date"
            v-model="newProfile.age"
            label="Birthdate"
            :rules="rules.birth"
          ></v-text-field>
        </v-form>
      </v-card>
    </v-dialog>

  </v-card-title>
</template>

<script>
  import axios from 'axios'

  export default {
    props: ['owner', 'id'],

    data: () => ({
      alert: {},
      dialog: false,
      valid: true,
      profile : {},
      newProfile : {},
      rules: {
        birth: [
          v => (!v || (v && new Date(new Date().getTime() - new Date(v).getTime()).getFullYear() - 1970 > 18 )) || 'You must have 18 years old or more',
        ],
        email: [
          v => (!v || (v && v.length <= 32)) || 'Email must be less than 32 characters',
          v => (!v || /.+@.+/.test(v)) || 'E-mail must be valid'
        ],
        firstname: [
          v => (!v || (v && v.length >= 2 && v.length <= 16)) || 'Firstname must be between 2 and 16 characters'
        ],
        lastname: [
          v => (!v || (v && v.length >= 2 && v.length <= 16)) || 'Lastname must be between 2 and 16 characters'
        ],
        password: [
          v => (!v || (v && v.length <= 26 && v.length >= 8)) || 'Password must be between 8 and 26 characters',
          v => (!v || (/[0-9]/.test(v) && /[A-Z]/.test(v) && /[a-z]/.test(v))) || 'Password must contain up and low letters and numbers'
        ]
      }
    }),
    beforeMount () {
      this.init_profile()
    },
    methods: {
      gender: v => (v == "1" ? "Male" : (v == "2") ? "Female" : ""),
      orientation: v => (v == "1" ? "Heterosexual" : (v == "2") ? "Homosexual" : "Bisexual"),
      init_profile () {
        axios.get('api/users/profile/' + this.id, {
          params: this.$user
        }).then(response => {
          if (response.data) {
            this.profile = response.data
            this.profile.password = ''
            this.profile.gender = this.profile.gender ? this.profile.gender.toString() : ''
            this.profile.orientation = this.profile.orientation ? this.profile.orientation.toString() : ''
            this.newProfile = JSON.parse(JSON.stringify(this.profile))
          }
        })
      },
      calcAge: d => (new Date(new Date().getTime() - new Date(d).getTime()).getFullYear() - 1970),
      submit () {
        const update = {
          password: this.newProfile.password ? this.newProfile.password : false,
          email: this.newProfile.email ? (this.newProfile.email == this.profile.email ? false : this.newProfile.email) : false,
          firstname: this.newProfile.firstname ? (this.newProfile.firstname == this.profile.firstname ? false : this.newProfile.firstname) : false,
          lastname: this.newProfile.lastname ? (this.newProfile.lastname == this.profile.lastname ? false : this.newProfile.lastname) : false,
          age: this.newProfile.age ? (this.newProfile.age == this.profile.age ? false : this.newProfile.age) : false,
          gender: this.newProfile.gender && this.newProfile.gender != "0" ? (this.newProfile.gender == this.profile.gender ? false : parseInt(this.newProfile.gender)) : false,
          orientation: this.newProfile.orientation ? (this.newProfile.orientation == this.profile.orientation ? false : parseInt(this.newProfile.orientation)) : false
        }
        const keys = Object.keys(update)
        let hasChanged = false
        keys.map(key => {
          if (update[key] != false)
            hasChanged = true
        })
        if (hasChanged) {
          if (this.$refs.form.validate()) {
            axios.post('/api/users/edit', {
              props: update,
              id: this.$user.id,
              token: this.$user.token
            }).then(response => {
              if (response.data) {
                this.dialog = false
                this.init_profile()
              } else {
                this.alert = {
                  type: 'error',
                  message: "Invalid entries"
                }
              }
            })
          } else {
            this.alert = {
              type: 'error',
              message: "Invalid entries"
            }
          }
        } else
          this.dialog = false
      }
    }
  }
</script>

<style>

</style>
