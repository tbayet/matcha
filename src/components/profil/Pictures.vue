<template>
  <v-responsive style="position:relative">
    <span style="position:absolute; z-index:2">
      <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-btn slot="activator" fab light color="white" v-if="owner" icon>
          <v-icon>person_add</v-icon>
        </v-btn>
        <v-card>
          <v-toolbar dark color="primary">
            <v-toolbar-title>Profile pictures</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
              <v-btn dark flat @click.native="dialog = false; alert = {}">Close</v-btn>
            </v-toolbar-items>
          </v-toolbar>
          <v-layout justify-center>
            <v-flex class="text-xs-center" xs12 md10>
              <v-alert transition="scale-transition" outline :value="!!alert.type" :type="alert.type">{{alert.message}}</v-alert>
              <v-layout wrap v-if="gallery && gallery.length" justify-center>
                <v-flex xs6 sm4 lg3
                  v-for="(img, key) in gallery"
                  :key="key"
                >
                  <v-card>
                    <v-img :src="'/api/images/'+img.picture" height="150" />
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn @click="selectImg(key)" icon>
                        <v-icon :color="key == 0 ? 'primary': 'black'">bookmark</v-icon>
                      </v-btn>
                      <v-btn @click="deleteImg(key)" icon>
                        <v-icon>delete</v-icon>
                      </v-btn>
                      <v-spacer></v-spacer>
                    </v-card-actions>
                  </v-card>
                </v-flex>
              </v-layout>

              <img v-if="imageFile" :src="imageFile" height="200" />
              <v-text-field label="Select Image" @click='browse' v-model='imageName' prepend-icon='attach_file'></v-text-field>
              <input
                type="file"
                style="display: none"
                ref="image"
                accept="image/*"
                @change="loadFile"
              >
              <v-btn :disabled="!imageFile" @click="addFile" color="primary">Add</v-btn>
            </v-flex>
          </v-layout>

        </v-card>
     </v-dialog>
    </span>
    <v-carousel height="60vh" style="background: grey" :cycle="false" :hide-controls="!gallery.length">
      <v-carousel-item
        v-for="(img,i) in gallery"
        :key="i"
        :src="'/api/images/'+img.picture"
      >
      </v-carousel-item>
    </v-carousel>
  </v-responsive>
</template>

<script>
  import axios from 'axios'
  import FormData from 'form-data'

  export default {
    props: ['owner', 'id'],

    data: () => ({
      alert: {},
      gallery: [],
      dialog: false,
      imageName: '',
      imageFile: null,
    }),

    beforeMount() {
      this.loadGallery()
    },

    methods: {
      selectImg(key) {
        this.alert = {}
        if (key != 0) {
          axios.post('api/users/favpicture', {
            user: this.$user,
            imgId: this.gallery[key].id
          }).then(response => {
            if (response.data) {
              this.loadGallery()
            }
          })
        }
      },
      deleteImg(key) {
        this.alert = {}
        axios.post('api/users/deletepicture', {
          user: this.$user,
          imgId: this.gallery[key].id
        }).then(response => {
          if (response.data) {
            this.loadGallery()
          }
        })
      },
      loadGallery() {
        axios.get('api/users/pictures', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
            id: this.id
          }
        }).then(response => {
          if (response.data) {
            if (response.data.length == 0)
              this.gallery = []
            else
              this.gallery = response.data
          }
        })
      },
      browse () {
        this.$refs.image.click ()
      },
      loadFile (e) {
        this.alert = {}
        const file = e.target.files[0]
        if (file.type.substr(0, file.type.indexOf('/')) == "image") {
          const fr = new FileReader()
          this.imageName = file.name
          fr.onloadend = () => {
            this.imageFile = fr.result
          }
          fr.readAsDataURL(file)
        }
        else {
          this.alert = {
            type: 'error',
            message: "Wrong format (expected an image)",
          }
          this.$refs.image.value = null
          this.imageFile = null
        }
      },
      addFile() {
        this.alert = {}
        if (this.imageFile) {
          axios.post('api/users/addpicture', {
            id: this.$user.id,
            token: this.$user.token,
            picture: this.imageFile
          }).then(response => {
            if (response.data) {
              this.loadGallery()
              this.imageName = ''
              this.imageFile = null
              this.$refs.image.value = null
              this.alert = {
                type: 'success',
                message: "Your image have been added",
              }
            } else {
              this.alert = {
                type: 'error',
                message: "Your maximum pictures is 5",
              }
            }
          }).catch(error => {
            if (error.response) {
              this.alert = {
                type: 'error',
                message: "File too big",
              }
            }
          })
        }
      },
    },
  }
</script>

<style>

</style>
