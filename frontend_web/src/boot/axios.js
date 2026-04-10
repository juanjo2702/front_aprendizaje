import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { api } from 'src/services/api'

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
