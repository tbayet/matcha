<template>
  <v-layout justify-center>
    <v-flex xs12 sm6>
      <v-alert transition="scale-transition" outline :value="!!alert.type" :type="alert.type">{{alert.message}}</v-alert>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-text-field
          outline
          single-line
          v-model="nickname"
          :rules="rules.nickname"
          label="Nickname"
          required
        ></v-text-field>
        <v-text-field
          type="password"
          outline
          single-line
          v-model="password"
          :rules="rules.password"
          label="Password"
          required
        ></v-text-field>
        <div v-if="!!nickname" class="right">
          <p>
            <v-dialog
              v-model="dialog"
              width="500"
            >
              <a slot="activator" @click="sendMail">
                Forgot your password ?
              </a>

              <v-card>
                <v-card-title
                  class="headline grey lighten-2"
                  primary-title
                >
                  An email has been sent
                </v-card-title>

                <v-card-text>
                  <p v-if="email">We sent you a link at {{email}} to reinit your password.</p>
                  <p v-else>This nickname isn't registered</p>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    flat
                    @click="dialog = false; email = null"
                  >
                    OK
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </p>
        </div>

        <v-btn
          block
          color="primary"
          :disabled="!valid"
          @click="submit"
        >
          Loggin
        </v-btn>
      </v-form>
    </v-flex>
  </v-layout>
</template>

<script>
  const axios = require('axios');

  export default {
    methods: {
      sendMail() {
        axios.post('api/users/mailpassword', {
          nickname: this.nickname
        }).then(response => {
          if (!response.data)
            console.log("Unknown nickname")
          else {
            this.email = response.data
          }
        })
      },
      submit () {
        var logUser = (data) => {
          this.alert = {}
          this.$user = {
            id: data.id,
            token: data.token
          }
          var d = new Date();
          d.setTime(d.getTime() + (48*3600*1000));
          var expires = "Expires="+ d.toUTCString();
          document.cookie = "id=" + data.id+ "; " + expires
          //document.cookie = "nickname=" + this.nickname + "; " + expires + "; Secure; HttpOnly"
          document.cookie = "token=" + data.token + "; " + expires
          console.log(data)

          this.$router.push('profil/')
        }

        if (this.$refs.form.validate()) {
          axios.post('api/users/connect', {
            nickname: this.nickname,
            password: this.password
          }).then(response => {
            if (!response.data) {
              this.alert = {
                type: 'error',
                message: "Invalid identifiers"
              }
            } else {
              logUser(response.data)
            }
          })
        }
      }
    },
    data: () => ({
      alert: {
      },
      email: null,
      nickname: '',
      password: '',
      valid: true,
      dialog: false,
      rules: {
        nickname: [
          v => !!v || 'Nickname is required'
        ],
        email: [
          v => !!v || 'Email is required',
          v => /.+@.+/.test(v) || 'E-mail must be valid'
        ],
        password: [
          v => !!v || 'Password is required'
        ]
      }
    })
  }
</script>

<style>

</style>
