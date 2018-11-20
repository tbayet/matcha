<template>
  <v-card flat>
    <v-toolbar
      color="primary"
      dark
      extended
      flat
    >
      <v-spacer></v-spacer>
      <v-toolbar-title class="white--text">
        <span>Matcha</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>

    <v-layout row pb-2>
      <v-flex xs8 offset-xs2>
        <v-card class="card--flex-toolbar">
          <v-card-title>Choose a new password</v-card-title>
          <v-divider></v-divider>
          <v-card-text style="min-height: 300px;">
            <v-layout justify-center>
              <v-flex xs12 sm6>
                <v-alert transition="scale-transition" outline :value="!!alert.type" :type="alert.type">{{alert.message}}</v-alert>
                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-text-field
                    outline
                    type="password"
                    v-model="password"
                    :rules="rules.password"
                    label="Password"
                    required
                  ></v-text-field>

                  <v-btn
                    block
                    color="primary"
                    :disabled="!valid"
                    @click="submit"
                  >
                    Reset password
                  </v-btn>
                </v-form>
              </v-flex>
            </v-layout>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
  import axios from 'axios'

  export default {
    data: () => ({
      alert: {},
      password: '',
      valid: true,
      rules: {
        password: [
          v => !!v || 'Password is required',
          v => (v && v.length <= 26 && v.length >= 8) || 'Password must be between 8 and 26 characters',
          v => (/[0-9]/.test(v) && /[A-Z]/.test(v) && /[a-z]/.test(v)) || 'Password must contain up and low letters and numbers'
        ]
      }
    }),
    methods: {
      submit () {
        this.alert = {}
        if (this.$refs.form.validate()) {
          axios.post('/api/users/password', {
            nickname: this.$route.query.nickname,
            key: this.$route.query.key,
            password: this.password
          }).then((response) => {
            console.log(response.data)
            if (response.data) {
              this.$router.push('/welcome')
            } else {
              this.alert = {
                type: 'error',
                message: "Invalid password"
              }
              this.password = '',
              this.valid = true
            }
          })
        }
      }
    },
  }
</script>

<style>
  .card--flex-toolbar {
    margin-top: -64px;
  }
</style>
