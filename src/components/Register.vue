  <template>
  <v-layout justify-center>
    <v-flex xs12 sm6>
      <v-alert transition="scale-transition" outline :value="!!alert.type" :type="alert.type">{{alert.message}}</v-alert>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-text-field
          outline
          v-model="user.nickname"
          :rules="rules.nickname"
          label="Nickname"
          required
        ></v-text-field>
        <v-text-field
          outline
          v-model="user.email"
          :rules="rules.email"
          label="E-mail"
          required
        ></v-text-field>
        <v-text-field
          outline
          v-model="user.firstname"
          :rules="rules.firstname"
          label="Firstname"
          required
        ></v-text-field>
        <v-text-field
          outline
          v-model="user.lastname"
          :rules="rules.lastname"
          label="Lastname"
          required
        ></v-text-field>
        <v-text-field
          outline
          type="password"
          v-model="user.password"
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
          Register
        </v-btn>
      </v-form>
    </v-flex>
  </v-layout>
</template>

<script>
  import axios from 'axios'
  import { sha224 } from 'js-sha256'


  export default {
    methods: {
      submit () {
        this.alert = {}
        if (this.$refs.form.validate()) {
          axios.post('/api/users/add', {
            user: {
              nickname: this.user.nickname,
              email: this.user.email,
              firstname: this.user.firstname,
              lastname: this.user.lastname,
              password: sha224(this.user.password)
            }
          }).then((response) => {
            if (response.data) {
              this.alert = {
                type: 'success',
                message: "You are now registered, you have to valid your mail"
              }
              this.user = {
                nickname: '',
                email: '',
                firstname: '',
                lastname: '',
                password: '',
              }
              this.valid = true
            } else {
              this.alert = {
                type: 'error',
                message: "Invalid entries"
              }
            }
          })
        }
      }
    },
    data: () => ({
      alert: {},
      user: {
        nickname: '',
        email: '',
        firstname: '',
        lastname: '',
        password: ''
      },
      valid: true,
      rules: {
        nickname: [
          v => !!v || 'Nickname is required',
          v => (v && v.length <= 12) || 'Nickname must be between 2 and 16 characters',
          v => v && !/[[:blank:]]/.test(v) || 'Nickname can\'t contain any space caracter',
        ],
        email: [
          v => !!v || 'Email is required',
          v => (v && v.length <= 32) || 'Email must be less than 32 characters',
          v => /.+@.+/.test(v) || 'Email must be valid',
          v => v && !/[[:blank:]]/.test(v) || 'Email can\'t contain any space caracter',
        ],
        firstname: [
          v => !!v || 'Firstname is required',
          v => (v && v.length <= 16) || 'Firstname must be between 2 and 16 characters',
          v => v && !/[[:blank:]]/.test(v) || 'Firstname can\'t contain any space caracter',
        ],
        lastname: [
          v => !!v || 'Lastname is required',
          v => (v && v.length <= 16) || 'Lastname must be between 2 and 16 characters',
          v => v && !/[[:blank:]]/.test(v) || 'Lastname can\'t contain any space caracter',
        ],
        password: [
          v => !!v || 'Password is required',
          v => (v && v.length <= 26 && v.length >= 8) || 'Password must be between 8 and 26 characters',
          v => (/[0-9]/.test(v) && /[A-Z]/.test(v) && /[a-z]/.test(v)) || 'Password must contain up and low letters and numbers'
        ]
      }
    })
  }
</script>

<style>

</style>
