// import './axios'
import { type App } from 'vue'
import dialog from './Dialog'
import './Tips'
import svgIcon from './SvgIcon'

export default (app: App) => {
  app.use(dialog)

  svgIcon(app)
}
