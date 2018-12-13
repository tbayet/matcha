<template>
  <div class="text-xs-center">
    <v-combobox
      ref="combobox"
      :readonly="!owner"
      :disabled="disabled"
      v-model="chips"
      :loading="isLoading"
      :items="tags"
      :search-input.sync="search"
      label="Add centers of interest..."
      chips
      solo
      multiple
      flat
    >
      <template slot="selection" slot-scope="data">
        <v-chip
          :selected="data.selected"
          :close="owner"
          @input="removeClick(data.item)"
        >
          <strong>{{ data.item }}</strong>
        </v-chip>
      </template>
    </v-combobox>
  </div>
</template>

<script>
  import axios from 'axios'

  export default {
    props: ['owner', 'id'],

    data: () => ({
      disabled: false,
      search: [],
      tags: [],
      chips: [],
      isLoading: false
    }),

    mounted() {
      axios.get('api/users/tags', {
        params: {
          userId: this.$user.id,
          userToken: this.$user.token,
          id: this.id
        }
      }).then(response => {
        if (response.data)
          this.chips = response.data.map(v => (v.name))
      })
    },

    methods: {
      remove(item, manual) {
        axios.post('api/users/removetag', {
          tag: item,
          id: this.$user.id,
          token: this.$user.token
        }).then(response => {
          if (response.data && manual)
            this.chips.splice(this.chips.indexOf(item), 1)
          this.disabled = false
          this.$nextTick(() => {
            this.$refs.combobox.focus()
          })
        })
      },
      removeClick(item) {
        if (!this.owner) return
        this.disabled = true
        this.$nextTick(() => {
          this.remove(item, 1)
        })
      }
    },

    watch: {
      chips: function (value, old) {
        if (this.owner && value.length > old.length) { // Adding a new tag
          this.disabled = true
          this.$nextTick(() => {
            if (old.includes(value[value.length - 1].toLowerCase())) {
              this.chips.pop()
              this.disabled = false
              this.$nextTick(() => {
                this.$refs.combobox.focus()
              })
            } else {
              axios.post('api/users/addtag', {
                tag: value[value.length - 1].toLowerCase(),
                id: this.$user.id,
                token: this.$user.token
              }).then(response => {
                if (!response.data) {
                  this.chips = JSON.parse(JSON.stringify(old))
                } else
                  this.chips[value.length - 1] = value[value.length - 1].toLowerCase()
                this.disabled = false
                this.$nextTick(() => {
                  this.$refs.combobox.focus()
                })
              })
            }
          })
        } else if (this.owner && value.length < old.length) { // Removing a tag
          this.disabled = true
          this.$nextTick(() => {
            var diff = old.filter(x => !value.includes(x))
            diff.forEach((val) => { this.remove(val, 0) })
          })
        }
      },
      search (val) {
        if (this.isLoading || !this.owner) return
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
