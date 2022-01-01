// import Vue from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import paths from './paths'


function route(path, view, name, meta, props) {
  return {
    name: name || view,
    path,
    meta,
    props,
    component: (resovle) => import(`../views/${view}.vue`).then(resovle),
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: paths.map(path => route(path.path, path.view, path.name, path.meta, path.props)).concat([
    { path: '/:pathMatch(.*)*', redirect: { name: 'search' } },
  ]),
  linkActiveClass: 'active-link',
  linkExactActiveClass: 'exact-active-link',
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else {
          const position = {}
          // new navigation.
          // scroll to anchor by returning the selector
          if (to.hash) {
            position.selector = to.hash
          }
          // check if any matched route config has meta that requires scrolling to top
          if (to.matched.some(m => m.meta.scrollToTop)) {
            // cords will be used if no selector is provided,
            // or if the selector didn't match any element.
            position.left = 0
            position.top = 0
          }
          // if the returned position is falsy or an empty object,
          // will retain current scroll position.
          resolve(position)
        }
      }, 500)
    })
  },
})


export default router
