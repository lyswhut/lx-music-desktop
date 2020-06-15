const { isMac } = require('../../../common/utils')

// mac下的 BrowserView 无法拖动验证栏，改用 BrowserWindow
require(isMac ? './xm_verify_win' : './xm_verify_view')
