<template>
  <v-layout row wrap>
    <v-flex v-if="!rights" xs12>
      You can't access profile lists until you've completed your extended profile
    </v-flex>
    <v-flex v-if="rights" xs12>
      <v-layout row wrap>
        <v-flex xs12 md6 class="pa-5">
          <v-layout row wrap>
            <v-flex xs12 lg12>
              <v-range-slider
                v-model="age"
                :max="99"
                :min="18"
                :step="1"
                thumb-label="always"
                :thumb-size="24"
                label="Age"
              ></v-range-slider>
            </v-flex>
            <v-flex xs12 lg12>
              <v-range-slider
                v-model="popularity"
                :max="500"
                :min="0"
                :step="10"
                thumb-label="always"
                :thumb-size="24"
                label="Popularity"
              ></v-range-slider>
            </v-flex>
            <v-flex xs12 lg12>
              <v-slider
                label="Distance"
                v-model="distanceValue"
                ticks="always"
                :tick-labels="distanceLabels"
                tick-size="3"
                :max="5"
                step="1"
              ></v-slider>
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex xs12 md6 class="pa-5">
          <v-radio-group label="Sort by: " v-model="sortBy" row>
            <v-radio label="All" value="1"></v-radio>
            <v-radio label="Age" value="2"></v-radio>
            <v-radio label="Popularity" value="3"></v-radio>
            <v-radio label="Distance" value="4"></v-radio>
            <v-radio label="Tags" value="5"></v-radio>
          </v-radio-group>
          <v-combobox
            ref="combobox"
            v-model="chips"
            :loading="isLoading"
            :items="tags"
            :search-input.sync="search"
            label="Select interest centers..."
            chips
            solo
            multiple
            flat
          >
            <template slot="selection" slot-scope="data">
              <v-chip
                :selected="data.selected"
                close
                @input="removeClick(data.item)"
              >
                <strong>{{ data.item }}</strong>
              </v-chip>
            </template>
          </v-combobox>
          <v-btn block color="primary" @click="filterRequest()">Search</v-btn>
        </v-flex>
    </v-layout>

    </v-flex>
    <v-flex xs12 style="text-align: center" v-if="rights && !profiles.length">No result</v-flex>
    <v-flex v-if="rights" xs4 sm3 lg2 xl1 pa-2 v-for="profile in profiles" :key="profile.id">
      <v-card>
        <router-link :to="'/profil/' + profile.id">
          <v-responsive>
            <v-img :src="'/api/images/'+ profile.picture"></v-img>
          </v-responsive>
        </router-link>
        <v-divider></v-divider>
        <v-card-text class="overflow-hidden">
          <span style="font-size: 18px">{{profile.nickname}}</span>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
  import axios from 'axios'

  export default {
    beforeMount() {
      this.checkRights()
    },
    data: () => ({
      profiles: [],
      age: [18, 99],
      popularity: [0, 500],
      distanceValue : 5,
      distanceLabels: ['10km', '25km', '50km', '100km', '250km', 'Everywhere'],
      tags: [],
      chips: [],
      search: [],
      isLoading: false,
      listTags: [],
      rights: false,
      sortBy: "1",
    }),
    methods: {
      checkRights () {
        axios.get('api/users/searchrights', {
          params: {
            userId: this.$user.id,
            userToken: this.$user.token,
          }
        }).then(response => {
          if (response.data) {
            this.rights = true
            this.filterRequest()
            axios.get('api/alltags').then(response => {
              this.listTags = response.data
            })
          } else
            this.rights = false
        })
      },
      filterRequest () {
        axios.post('api/users/profiles', {
          id: this.$user.id,
          token: this.$user.token,
          age: this.age,
          popularity: this.popularity,
          distance: this.convDistance(this.distanceValue),
          tags: this.chips.map(elem => (this.listTags[this.listTags.findIndex(v => (v.name == elem))].id)),
          sortBy : this.sortBy
        }).then(response => {
          this.profiles = response.data
        })
      },
      convDistance: (value) => {
        let km = 0
        switch (value) {
          case 0: km = 10; break
          case 1: km = 25; break
          case 2: km = 50; break
          case 3: km = 100; break
          case 4: km = 250; break
        }
        return km
      },
      removeClick (item) {
        this.chips.splice(this.chips.indexOf(item), 1)
      }
    },
    watch: {
      chips: function (value, old) {
        if (value.length > old.length) {
          this.$nextTick(() => {
            if (old.includes(value[value.length - 1].toLowerCase()) || this.listTags.findIndex(elem => (elem.name == value[value.length - 1].toLowerCase())) == -1) {
              this.chips.pop()
            } else {
              this.chips[value.length - 1] = value[value.length - 1].toLowerCase()
            }
          })
        }
      },
      search (val) {
        if (this.isLoading) return
        if (!val) {
          this.tags = []
          return
        }
        this.isLoading = true
        axios.get('api/tags', {
          params: {input: val}
        }).then(response => {
          if (response.data) {
            this.tags = response.data.map(v => v.name)
            this.isLoading = false
          }
        })
      }
    }
  }
</script>

<style>
</style>
