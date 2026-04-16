import { defineBoot } from '#q-app/wrappers'
import { MotionPlugin } from '@vueuse/motion'

export default defineBoot(({ app }) => {
  app.use(MotionPlugin)
})

