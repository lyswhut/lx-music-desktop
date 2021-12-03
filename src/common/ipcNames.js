const names = {
  mainWindow: {
    focus: 'focus',
    close: 'close',
    min: 'min',
    max: 'max',
    set_app_name: 'set_app_name',
    clear_cache: 'clear_cache',
    get_cache_size: 'get_cache_size',
    get_env_params: 'get_env_params',
    wait: 'wait',
    wait_cancel: 'wait_cancel',

    set_music_meta: 'set_music_meta',
    progress: 'progress',
    change_tray: 'change_tray',
    quit_update: 'quit_update',
    update_available: 'update_available',
    update_error: 'update_error',
    update_progress: 'update_progress',
    update_downloaded: 'update_downloaded',
    update_not_available: 'update_not_available',
    set_ignore_mouse_events: 'set_ignore_mouse_events',
    set_app_setting: 'set_app_setting',
    set_window_size: 'set_window_size',
    show_save_dialog: 'show_save_dialog',
    get_system_fonts: 'get_system_fonts',

    handle_request: 'handle_request',
    cancel_request: 'cancel_request',

    handle_xm_verify_open: 'handle_xm_verify_open',
    handle_xm_verify_close: 'handle_xm_verify_close',
    select_dir: 'select_dir',

    restart_window: 'restart_window',

    lang_s2t: 'lang_s2t',

    handle_kw_decode_lyric: 'handle_kw_decode_lyric',
    get_lyric_info: 'get_lyric_info',
    set_lyric_info: 'set_lyric_info',
    set_config: 'set_config',
    set_hot_key_config: 'set_hot_key_config',
    key_down: 'key_down',
    quit: 'quit',
    min_toggle: 'min_toggle',
    hide_toggle: 'hide_toggle',
    get_data_path: 'get_data_path',
    show_dialog: 'show_dialog',

    get_setting: 'get_setting',
    get_playlist: 'get_playlist',
    save_playlist: 'save_playlist',
    get_data: 'get_data',
    save_data: 'save_data',
    get_hot_key: 'get_hot_key',

    import_user_api: 'import_user_api',
    remove_user_api: 'remove_user_api',
    set_user_api: 'set_user_api',
    get_user_api_list: 'get_user_api_list',
    request_user_api: 'request_user_api',
    request_user_api_cancel: 'request_user_api_cancel',
    get_user_api_status: 'get_user_api_status',
    user_api_status: 'user_api_status',

    get_lyric: 'get_lyric',
    save_lyric: 'save_lyric',
    clear_lyric: 'clear_lyric',
    get_music_url: 'get_music_url',
    save_music_url: 'save_music_url',
    clear_music_url: 'clear_music_url',

    sync_enable: 'sync_enable',
    sync_status: 'sync_status',
    sync_get_status: 'sync_get_status',
    sync_generate_code: 'sync_generate_code',
    sync_action_list: 'sync_action_list',
    sync_list: 'sync_list',

  },
  winLyric: {
    close: 'close',
    set_lyric_info: 'set_lyric_info',
    get_lyric_info: 'get_lyric_info',
    set_lyric_config: 'set_lyric_config',
    get_lyric_config: 'get_lyric_config',
    set_win_bounds: 'set_win_bounds',
    key_down: 'key_down',
  },
  hotKey: {
    enable: 'enable',
    status: 'status',
    set_config: 'set_config',
  },
}

for (const item of Object.keys(names)) {
  let name = names[item]
  for (const key of Object.keys(name)) {
    name[key] = `${item}_${name[key]}`
  }
}

exports.mainWindow = names.mainWindow
exports.winLyric = names.winLyric
exports.hotKey = names.hotKey
