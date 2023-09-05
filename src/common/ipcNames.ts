const modules = {
  common: {
    get_env_params: 'get_env_params',
    deeplink: 'deeplink',
    clear_env_params_deeplink: 'clear_env_params_deeplink',
    system_theme_change: 'system_theme_change',
    theme_change: 'theme_change',
    get_system_fonts: 'get_system_fonts',
    get_app_setting: 'get_app_setting',
    set_app_setting: 'set_app_setting',
  },
  player: {
    invoke_play_music: 'play_music',
    invoke_play_next: 'play_next',
    invoke_play_prev: 'play_prev',
    invoke_toggle_play: 'toggle_play',
    player_play: 'player_play',
    player_pause: 'player_pause',
    player_stop: 'player_stop',
    player_error: 'player_error',

    list_data_overwire: 'list_data_overwire',
    list_get: 'list_get',
    list_add: 'list_add',
    list_remove: 'list_remove',
    list_update: 'list_update',
    list_update_position: 'list_update_position',
    list_music_get: 'list_music_get',
    list_music_add: 'list_music_add',
    list_music_move: 'list_music_move',
    list_music_remove: 'list_music_remove',
    list_music_update: 'list_music_update',
    list_music_update_position: 'list_music_update_position',
    list_music_overwrite: 'list_music_overwrite',
    list_music_clear: 'list_music_clear',
    list_music_check_exist: 'list_music_check_exist',
    list_music_get_list_ids: 'list_music_get_list_ids',
  },
  dislike: {
    get_dislike_music_infos: 'get_dislike_music_infos',
    add_dislike_music_infos: 'add_dislike_music_infos',
    overwrite_dislike_music_infos: 'overwrite_dislike_music_infos',
    clear_dislike_music_infos: 'clear_dislike_music_infos',
  },
  winMain: {
    focus: 'focus',
    close: 'close',
    min: 'min',
    max: 'max',
    fullscreen: 'fullscreen',
    set_app_name: 'set_app_name',
    clear_cache: 'clear_cache',
    get_cache_size: 'get_cache_size',
    inited: 'inited',
    show_save_dialog: 'show_save_dialog',
    show_select_dialog: 'show_select_dialog',
    show_dialog: 'show_dialog',
    open_dev_tools: 'open_dev_tools',

    progress: 'progress',
    change_tray: 'change_tray',
    quit_update: 'quit_update',
    update_check: 'update_check',
    update_download_update: 'update_download_update',
    update_available: 'update_available',
    update_error: 'update_error',
    update_progress: 'update_progress',
    update_downloaded: 'update_downloaded',
    update_not_available: 'update_not_available',
    set_ignore_mouse_events: 'set_ignore_mouse_events',
    set_window_size: 'set_window_size',

    handle_request: 'handle_request',
    cancel_request: 'cancel_request',


    restart_window: 'restart_window',

    // lang_s2t: 'lang_s2t',

    handle_kw_decode_lyric: 'handle_kw_decode_lyric',
    handle_tx_decode_lyric: 'handle_tx_decode_lyric',
    get_lyric_info: 'get_lyric_info',
    set_lyric_info: 'set_lyric_info',
    set_config: 'set_config',
    set_hot_key_config: 'set_hot_key_config',
    on_config_change: 'on_config_change',
    key_down: 'key_down',
    quit: 'quit',
    min_toggle: 'min_toggle',
    hide_toggle: 'hide_toggle',

    get_other_source: 'get_other_source',
    save_other_source: 'save_other_source',
    clear_other_source: 'clear_other_source',
    get_other_source_count: 'get_other_source_count',
    get_data: 'get_data',
    save_data: 'save_data',
    get_sound_effect_eq_preset: 'get_sound_effect_eq_preset',
    save_sound_effect_eq_preset: 'save_sound_effect_eq_preset',
    get_sound_effect_convolution_preset: 'get_sound_effect_convolution_preset',
    save_sound_effect_convolution_preset: 'save_sound_effect_convolution_preset',
    // get_sound_effect_pitch_shifter_preset: 'get_sound_effect_pitch_shifter_preset',
    // save_sound_effect_pitch_shifter_preset: 'save_sound_effect_pitch_shifter_preset',
    get_hot_key: 'get_hot_key',

    import_user_api: 'import_user_api',
    remove_user_api: 'remove_user_api',
    set_user_api: 'set_user_api',
    get_user_api_list: 'get_user_api_list',
    request_user_api: 'request_user_api',
    request_user_api_cancel: 'request_user_api_cancel',
    get_user_api_status: 'get_user_api_status',
    user_api_status: 'user_api_status',
    user_api_show_update_alert: 'user_api_show_update_alert',
    user_api_set_allow_update_alert: 'user_api_set_allow_update_alert',

    get_palyer_lyric: 'get_lyric',
    // save_lyric: 'save_lyric',
    // clear_lyric: 'clear_lyric',
    get_lyric_raw: 'get_lyric_raw',
    save_lyric_raw: 'save_lyric_raw',
    clear_lyric_raw: 'clear_lyric_raw',
    get_lyric_raw_count: 'get_lyric_raw_count',
    get_lyric_edited: 'get_lyric_edited',
    save_lyric_edited: 'save_lyric_edited',
    remove_lyric_edited: 'remove_lyric_edited',
    clear_lyric_edited: 'clear_lyric_edited',
    get_lyric_edited_count: 'get_lyric_edited_count',
    get_music_url: 'get_music_url',
    save_music_url: 'save_music_url',
    clear_music_url: 'clear_music_url',
    get_music_url_count: 'get_music_url_count',

    sync_action: 'sync_action',
    sync_get_server_devices: 'sync_get_server_devices',
    sync_remove_server_device: 'sync_remove_server_device',

    process_new_desktop_lyric_client: 'process_new_desktop_lyric_client',

    player_action_set_buttons: 'player_action_set_buttons',
    // player_action_set_thumbnail_clip: 'player_action_set_thumbnail_clip',
    player_action_on_button_click: 'player_action_on_button_click',

    get_themes: 'get_themes',
    save_theme: 'save_theme',
    remove_theme: 'remove_theme',

    download_list_get: 'download_list_get',
    download_list_add: 'download_list_add',
    download_list_update: 'download_list_update',
    download_list_remove: 'download_list_remove',
    download_list_clear: 'download_list_clear',
  },
  winLyric: {
    close: 'close',
    set_config: 'set_config',
    get_config: 'get_config',
    on_config_change: 'on_config_change',
    main_window_inited: 'main_window_inited',
    set_win_bounds: 'set_win_bounds',
    key_down: 'key_down',
    request_main_window_channel: 'request_main_window_channel',
    provide_main_window_channel: 'provide_main_window_channel',
  },
  hotKey: {
    enable: 'enable',
    status: 'status',
    set_config: 'set_config',
  },
}


for (const moduleName of Object.keys(modules) as Array<keyof typeof modules>) {
  let eventNames = modules[moduleName]
  for (const eventName of Object.keys(eventNames) as Array<keyof typeof eventNames>) {
    eventNames[eventName] = `${moduleName}_${eventName as string}` as never
  }
}

// for (const moduleName of Object.keys(modules) as Array<keyof typeof modules>) {
//   let eventNames = modules[moduleName]
//   for (const eventName of Object.keys(eventNames)) {
//     eventNames[eventName] = `${moduleName}_${eventName}`
//   }
// }


export const CMMON_EVENT_NAME = modules.common
export const PLAYER_EVENT_NAME = modules.player
export const DISLIKE_EVENT_NAME = modules.dislike
export const WIN_MAIN_RENDERER_EVENT_NAME = modules.winMain
export const WIN_LYRIC_RENDERER_EVENT_NAME = modules.winLyric
export const HOTKEY_RENDERER_EVENT_NAME = modules.hotKey
