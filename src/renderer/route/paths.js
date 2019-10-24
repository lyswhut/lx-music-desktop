export default [
  // {
  //   path: '/',
  //   // redirect: '/app',
  //   // props: true,
  //   component: () => import('../views/Dashboard.vue'),
  //   name: 'Dashboard',
  //   alias: '/dashboard'
  // }
  {
    path: '/search',
    name: 'search',
    view: 'Search',
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    view: 'Leaderboard',
  },
  {
    path: '/songList',
    name: 'songList',
    view: 'SongList',
  },
  {
    path: '/list',
    name: 'list',
    view: 'List',
    // props: true,
  },
  {
    path: '/download',
    name: 'download',
    view: 'Download',
  },
  {
    path: '/setting',
    name: 'setting',
    view: 'Setting',
  },
]
