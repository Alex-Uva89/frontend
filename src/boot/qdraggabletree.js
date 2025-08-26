import { boot } from 'quasar/wrappers'
import Plugin from 'quasar-ui-qdraggabletree'

export default boot(({ app }) => {
  app.use(Plugin)
})
