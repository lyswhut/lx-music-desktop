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
    path: '/songList',
    name: 'songList',
    view: 'songList/SongList',
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    view: 'Leaderboard',
  },
  {
    path: '/list',
    name: 'list',
    view: 'list/List',
  },
  {
    path: '/download',
    name: 'download',
    view: 'Download',
  },
  {
    path: '/setting',
    name: 'setting',
    view: 'setting/Setting',
  },
]
