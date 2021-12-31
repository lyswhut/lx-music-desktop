// import './axios'
import dialog from './Dialog'
import './Tips'
import svgIcon from './SvgIcon'

export default app => {
  app.use(dialog)

  svgIcon(app)
}
