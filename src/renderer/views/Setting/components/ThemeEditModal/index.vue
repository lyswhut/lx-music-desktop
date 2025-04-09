<template>
  <material-modal :show="modelValue" max-height="90%" teleport="#view" @close="handleCancel">
    <main :class="$style.main">
      <h2>{{ themeId ? $t('theme_edit_modal__title_edit') : $t('theme_edit_modal__title_add') }}</h2>
      <div class="scroll" :class="$style.content">
        <div :class="[$style.group, $style.base]">
          <div :class="$style.groupContent">
            <div :class="$style.item">
              <div ref="primary_color_ref" :class="$style.color" />
              <div :class="$style.label">{{ $t('theme_edit_modal__primary') }}</div>
            </div>
            <div :class="$style.item">
              <div ref="font_color_ref" :class="$style.color" />
              <div :class="$style.label">{{ $t('theme_edit_modal__font') }}</div>
            </div>
            <div :class="$style.item">
              <div ref="app_bg_color_ref" :class="$style.color" />
              <div :class="$style.label">{{ $t('theme_edit_modal__app_bg') }}</div>
            </div>
            <div :class="$style.item">
              <div ref="aside_font_color_ref" :class="$style.color" />
              <div :class="$style.label">{{ $t('theme_edit_modal__aside_color') }}</div>
            </div>
            <div :class="$style.item">
              <div ref="main_bg_color_ref" :class="$style.color" />
              <div :class="$style.label">{{ $t('theme_edit_modal__main_bg') }}</div>
            </div>
            <div :class="[$style.item, $style.bg]">
              <div :class="[$style.bgImg, {[$style.hasBg]: !!bgImg}]" @click="selectBgImg">
                <img v-if="bgImg" loading="lazy" decoding="async" :class="$style.img" :src="bgImg" alt="Background Image">
                <svg-icon v-else :class="$style.icon" name="plus" />
                <button :class="$style.removeBtn" type="button" @click.stop="removeBgImg">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 212.982 212.982" space="preserve">
                    <use xlink:href="#icon-delete" />
                  </svg>
                </button>
              </div>
              <div :class="$style.label">{{ $t('theme_edit_modal__bg_image') }}</div>
            </div>
          </div>
        </div>
        <div :class="$style.groupContent">
          <div :class="$style.group">
            <div :class="$style.groupTitle">
              <span :class="$style.title">{{ $t('theme_edit_modal__badge') }}</span>
              <span class="badge badge-theme-primary">{{ $t('tag__lossless') }}</span>
              <span class="badge badge-theme-secondary">{{ $t('tag__high_quality') }}</span>
              <span class="badge badge-theme-tertiary">kw</span>
            </div>
            <div :class="$style.groupContent">
              <div :class="$style.item">
                <div ref="badge_primary_color_ref" :class="$style.color" />
                <div :class="$style.label">{{ $t('theme_edit_modal__badge_primary') }}</div>
              </div>
              <div :class="$style.item">
                <div ref="badge_secondary_color_ref" :class="$style.color" />
                <div :class="$style.label">{{ $t('theme_edit_modal__badge_secondary') }}</div>
              </div>
              <div :class="$style.item">
                <div ref="badge_tertiary_color_ref" :class="$style.color" />
                <div :class="$style.label">{{ $t('theme_edit_modal__badge_tertiary') }}</div>
              </div>
            </div>
          </div>
          <div :class="$style.group">
            <div :class="$style.groupTitle">
              <span>{{ $t('theme_edit_modal__control_btn') }}</span>
              <div :class="$style.controlBtn">
                <button type="button" :class="$style.hide">
                  <svg :class="$style.controlBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="80%" viewBox="0 0 30.727 30.727" space="preserve">
                    <use xlink:href="#icon-window-hide" />
                  </svg>
                </button>
                <button type="button" :class="$style.min">
                  <svg :class="$style.controlBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
                    <use xlink:href="#icon-window-minimize" />
                  </svg>
                </button>
                <button type="button" :class="$style.close">
                  <svg :class="$style.controlBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
                    <use xlink:href="#icon-window-close" />
                  </svg>
                </button>
              </div>
            </div>
            <div :class="$style.groupContent">
              <div :class="$style.item">
                <div ref="close_btn_color_ref" :class="$style.color" />
                <div :class="$style.label">{{ $t('theme_edit_modal__close_btn') }}</div>
              </div>
              <div :class="$style.item">
                <div ref="min_btn_color_ref" :class="$style.color" />
                <div :class="$style.label">{{ $t('theme_edit_modal__min_btn') }}</div>
              </div>
              <div :class="$style.item">
                <div ref="hide_btn_color_ref" :class="$style.color" />
                <div :class="$style.label">{{ $t('theme_edit_modal__hide_btn') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div :class="$style.footer">
        <div :class="$style.subContent" style="flex-wrap: wrap;">
          <base-input v-model="themeName" :class="$style.input" :placeholder="$t('theme_selector_modal__theme_name')" />
          <div :class="$style.subContent" style="flex-wrap: wrap;">
            <base-checkbox id="theme_edit_modal__dark" v-model="isDark" :class="$style.checkbox" :label="$t('theme_edit_modal__dark')" @change="handleDark" />
            <div :class="$style.subContent" style="flex-wrap: wrap;">
              <base-checkbox id="theme_edit_modal__dark_font" v-model="isDarkFont" :class="$style.checkbox" :label="$t('theme_edit_modal__dark_font')" @change="handleDarkFont" />
              <base-checkbox id="theme_edit_modal__preview" v-model="preview" :class="$style.checkbox" :label="$t('theme_edit_modal__preview')" @change="handlePreview" />
            </div>
          </div>
        </div>
        <div :class="$style.subContent" style="flex: none;">
          <base-btn v-if="themeId" :class="$style.btn" @click="handleRemove">{{ $t('theme_edit_modal__remove') }}</base-btn>
          <base-btn v-if="themeId" :class="$style.btn" @click="handleSaveNew">{{ $t('theme_edit_modal__save_new') }}</base-btn>
          <!-- <base-btn :class="$style.btn" @click="handleCancel">{{ $t('btn_cancel') }}</base-btn> -->
          <base-btn :class="$style.btn" @click="handleSubmit">{{ $t('btn_save') }}</base-btn>
        </div>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { joinPath, extname, copyFile, checkPath, createDir, removeFile, moveFile, basename } from '@common/utils/nodejs'
import { nextTick, ref, watch } from '@common/utils/vueTools'
import { applyTheme, buildThemeColors, getThemes, copyTheme } from '@renderer/store/utils'
import { isUrl, encodePath } from '@common/utils/common'
// import { appSetting, updateSetting } from '@renderer/store/setting'
// import { applyTheme, getThemes } from '@renderer/store/utils'
import { createThemeColors } from '@common/theme/utils'
import useMainColor from './useMainColor'
import useFontColor from './useFontColor'
import useAppBgColor from './useAppBgColor'
import useMainBgColor from './useMainBgColor'
import useAsideFontColor from './useAsideFontColor'
import useBadgePrimaryColor from './useBadgePrimaryColor'
import useBadgeSecondaryColor from './useBadgeSecondaryColor'
import useBadgeTertiaryColor from './useBadgeTertiaryColor'
import useCloseBtnColor from './useCloseBtnColor'
import useMinBtnColor from './useMinBtnColor'
import useHideBtnColor from './useHideBtnColor'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { removeTheme, saveTheme, showSelectDialog } from '@renderer/utils/ipc'
import { dialog } from '@renderer/plugins/Dialog'
import { themeInfo } from '@renderer/store'


export default {
  name: 'ThemeSelectorModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    themeId: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const themeName = ref('')
    const isDark = ref(false)
    const isDarkFont = ref(false)
    const preview = ref(false)
    const bgImg = ref('')
    let bgImgRaw = ''
    let originBgName = ''
    let currentBgPath = ''

    let theme

    const getColor = (color, theme) => {
      return color.startsWith('var')
        ? theme.config.themeColors[color.replace(/var\((.+)\)/, '$1')]
        : color
    }

    const createPreview = () => {
      if (!preview.value) return
      window.setTheme(buildThemeColors(theme, themeInfo.dataPath))
    }

    // '--color-app-background': string
    // '--color-main-background': string
    // '--color-nav-font': string
    // '--background-image': string
    // '--background-image-position': string
    // '--background-image-size': string

    // // 关闭按钮颜色
    // '--color-btn-hide': string
    // '--color-btn-min': string
    // '--color-btn-close': string

    // // 徽章颜色
    // '--color-badge-primary': string
    // '--color-badge-secondary': string
    // '--color-badge-tertiary': string
    const { primary_color_ref, initMainColor, destroyMainColor } = useMainColor()
    const { font_color_ref, initFontColor, destroyFontColor } = useFontColor()
    const { app_bg_color_ref, initAppBgColor, destroyAppBgColor, setAppBgColor } = useAppBgColor()
    const { aside_font_color_ref, initAsideFontColor, destroyAsideFontColor, setAsideFontColor } = useAsideFontColor()
    const { main_bg_color_ref, initMainBgColor, destroyMainBgColor, setMainBgColor } = useMainBgColor()
    const { badge_primary_color_ref, initBadgePrimaryColor, destroyBadgePrimaryColor, setBadgePrimaryColor } = useBadgePrimaryColor()
    const { badge_secondary_color_ref, initBadgeSecondaryColor, destroyBadgeSecondaryColor, setBadgeSecondaryColor } = useBadgeSecondaryColor()
    const { badge_tertiary_color_ref, initBadgeTertiaryColor, destroyBadgeTertiaryColor, setBadgeTertiaryColor } = useBadgeTertiaryColor()
    const { close_btn_color_ref, initCloseBtnColor, destroyCloseBtnColor, setCloseBtnColor } = useCloseBtnColor()
    const { min_btn_color_ref, initMinBtnColor, destroyMinBtnColor, setMinBtnColor } = useMinBtnColor()
    const { hide_btn_color_ref, initHideBtnColor, destroyHideBtnColor, setHideBtnColor } = useHideBtnColor()

    let appBgColorOrigin
    let appBgColor
    let asideFontColorOrigin
    let asideFontColor
    let mainBgColorOrigin
    let mainBgColor
    let badgePrimaryColorOrigin
    let badgePrimaryColor
    let badgeSecondaryColorOrigin
    let badgeSecondaryColor
    let badgeTertiaryColorOrigin
    let badgeTertiaryColor
    let closeBtnColorOrigin
    let closeBtnColor
    let minBtnColorOrigin
    let minBtnColor
    let hideBtnColorOrigin
    let hideBtnColor

    const applyPrimaryColor = (color, fontColor, isDark, isDarkFont) => {
      theme.config.themeColors = createThemeColors(color, fontColor, isDark, isDarkFont)
      if (theme.config.extInfo['--color-app-background'].startsWith('var')) setAppBgColor(getColor(appBgColorOrigin, theme))
      if (theme.config.extInfo['--color-nav-font'].startsWith('var')) setAsideFontColor(getColor(asideFontColorOrigin, theme))
      if (theme.config.extInfo['--color-main-background'].startsWith('var')) setMainBgColor(getColor(mainBgColorOrigin, theme))
      if (theme.config.extInfo['--color-badge-primary'].startsWith('var')) setBadgePrimaryColor(getColor(badgePrimaryColorOrigin, theme))
      if (theme.config.extInfo['--color-badge-secondary'].startsWith('var')) setBadgeSecondaryColor(getColor(badgeSecondaryColorOrigin, theme))
      if (theme.config.extInfo['--color-badge-tertiary'].startsWith('var')) setBadgeTertiaryColor(getColor(badgeTertiaryColorOrigin, theme))
      if (theme.config.extInfo['--color-btn-close'].startsWith('var')) setCloseBtnColor(getColor(closeBtnColorOrigin, theme))
      if (theme.config.extInfo['--color-btn-min'].startsWith('var')) setMinBtnColor(getColor(minBtnColorOrigin, theme))
      if (theme.config.extInfo['--color-btn-hide'].startsWith('var')) setHideBtnColor(getColor(hideBtnColorOrigin, theme))

      createPreview()
    }

    const initColors = (_theme) => {
      theme = _theme
      // console.log(theme)
      themeName.value = theme.name
      isDark.value = theme.isDark
      isDarkFont.value = theme.isDarkFont ?? false
      currentBgPath = ''
      if (theme.config.extInfo['--background-image'] == 'none') {
        bgImg.value = ''
        bgImgRaw = ''
        originBgName = ''
      } else {
        bgImgRaw = isUrl(theme.config.extInfo['--background-image'])
          ? theme.config.extInfo['--background-image']
          : joinPath(themeInfo.dataPath, theme.config.extInfo['--background-image'])
        bgImg.value = encodePath(bgImgRaw)
        originBgName = theme.config.extInfo['--background-image']
      }
      appBgColorOrigin = theme.config.extInfo['--color-app-background']
      appBgColor = getColor(appBgColorOrigin, theme)
      asideFontColorOrigin = theme.config.extInfo['--color-nav-font']
      asideFontColor = getColor(asideFontColorOrigin, theme)
      mainBgColorOrigin = theme.config.extInfo['--color-main-background']
      mainBgColor = getColor(mainBgColorOrigin, theme)
      badgePrimaryColorOrigin = theme.config.extInfo['--color-badge-primary']
      badgePrimaryColor = getColor(badgePrimaryColorOrigin, theme)
      badgeSecondaryColorOrigin = theme.config.extInfo['--color-badge-secondary']
      badgeSecondaryColor = getColor(badgeSecondaryColorOrigin, theme)
      badgeTertiaryColorOrigin = theme.config.extInfo['--color-badge-tertiary']
      badgeTertiaryColor = getColor(badgeTertiaryColorOrigin, theme)
      closeBtnColorOrigin = theme.config.extInfo['--color-btn-close']
      closeBtnColor = getColor(closeBtnColorOrigin, theme)
      minBtnColorOrigin = theme.config.extInfo['--color-btn-min']
      minBtnColor = getColor(minBtnColorOrigin, theme)
      hideBtnColorOrigin = theme.config.extInfo['--color-btn-hide']
      hideBtnColor = getColor(hideBtnColorOrigin, theme)

      initMainColor(theme.config.themeColors['--color-primary'], (color) => {
        applyPrimaryColor(color, theme.config.themeColors['--color-1000'], theme.isDark, theme.isDarkFont)
      })
      initFontColor(theme.config.themeColors['--color-1000'] ?? (isDark ? 'rgb(229, 229, 229)' : 'rgb(33, 33, 33)'), (color) => {
        applyPrimaryColor(theme.config.themeColors['--color-primary'], color, theme.isDark, theme.isDarkFont)
      })
      initAppBgColor(appBgColor, (color) => {
        // console.log('appBgColor', color)
        theme.config.extInfo['--color-app-background'] = color == appBgColor ? appBgColorOrigin : color
        createPreview()
      }, () => { setAppBgColor(getColor(appBgColorOrigin, theme)) })
      initAsideFontColor(asideFontColor, (color) => {
        theme.config.extInfo['--color-nav-font'] = color == asideFontColor ? asideFontColorOrigin : color
        createPreview()
      }, () => { setAsideFontColor(getColor(asideFontColorOrigin, theme)) })
      initMainBgColor(mainBgColor, (color) => {
        theme.config.extInfo['--color-main-background'] = color == mainBgColor ? mainBgColorOrigin : color
        createPreview()
      }, () => { setMainBgColor(getColor(mainBgColorOrigin, theme)) })
      initBadgePrimaryColor(badgePrimaryColor, (color) => {
        theme.config.extInfo['--color-badge-primary'] = color == badgePrimaryColor ? badgePrimaryColorOrigin : color
        createPreview()
      }, () => { setBadgePrimaryColor(getColor(badgePrimaryColorOrigin, theme)) })
      initBadgeSecondaryColor(badgeSecondaryColor, (color) => {
        theme.config.extInfo['--color-badge-secondary'] = color == badgeSecondaryColor ? badgeSecondaryColorOrigin : color
        createPreview()
      }, () => { setBadgeSecondaryColor(getColor(badgeSecondaryColorOrigin, theme)) })
      initBadgeTertiaryColor(badgeTertiaryColor, (color) => {
        theme.config.extInfo['--color-badge-tertiary'] = color == badgeTertiaryColor ? badgeTertiaryColorOrigin : color
        createPreview()
      }, () => { setBadgeTertiaryColor(getColor(badgeTertiaryColorOrigin, theme)) })
      initCloseBtnColor(closeBtnColor, (color) => {
        theme.config.extInfo['--color-btn-close'] = color == closeBtnColor ? closeBtnColorOrigin : color
        createPreview()
      }, () => { setCloseBtnColor(getColor(closeBtnColorOrigin, theme)) })
      initMinBtnColor(minBtnColor, (color) => {
        theme.config.extInfo['--color-btn-min'] = color == minBtnColor ? minBtnColorOrigin : color
        createPreview()
      }, () => { setMinBtnColor(getColor(minBtnColorOrigin, theme)) })
      initHideBtnColor(hideBtnColor, (color) => {
        theme.config.extInfo['--color-btn-hide'] = color == hideBtnColor ? hideBtnColorOrigin : color
        createPreview()
      }, () => { setHideBtnColor(getColor(hideBtnColorOrigin, theme)) })

      createPreview()
    }
    const destroyColors = () => {
      destroyMainColor()
      destroyFontColor()
      destroyAppBgColor()
      destroyAsideFontColor()
      destroyMainBgColor()
      destroyBadgePrimaryColor()
      destroyBadgeSecondaryColor()
      destroyBadgeTertiaryColor()
      destroyCloseBtnColor()
      destroyMinBtnColor()
      destroyHideBtnColor()
    }

    watch(() => props.modelValue, (visible) => {
      void nextTick(() => {
        getThemes(({ themes, userThemes }) => {
          if (visible) {
            if (props.themeId) {
              const theme = userThemes.find(t => t.id == props.themeId)
              if (theme) {
                initColors(copyTheme(theme))
                return
              }
            }
            const theme = copyTheme(themes[0])
            theme.id = 'user_theme_' + Date.now()
            theme.name = ''
            theme.isCustom = true
            initColors(theme)
          } else {
            destroyColors()
            // 移除临时保存的背景
            if (currentBgPath) removeFile(currentBgPath).catch(_ => _)
          }
        })
      })
    })

    const selectBgImg = async() => {
      const result = await showSelectDialog({
        title: window.i18n.t('theme_edit_modal__select_bg_file'),
        properties: ['openFile'],
        filters: [
          {
            name: 'Image File',
            extensions: [
              'jpg', 'jpeg', 'jfif', 'pjpeg',
              'pjp', 'png', 'apng', 'avif', 'gif', 'svg',
              'webp', 'bmp'],
          },
        ],
      })
      if (result.canceled) return
      const path = result.filePaths[0]
      const fileName = `${theme.id}_${Date.now()}${extname(path)}`
      const tempDir = joinPath(themeInfo.dataPath, 'temp')
      const bgPath = joinPath(tempDir, fileName)
      if (!await checkPath(tempDir)) await createDir(tempDir)
      await copyFile(path, bgPath)
      currentBgPath = bgImgRaw = bgPath
      bgImg.value = encodePath(bgImgRaw)
      theme.config.extInfo['--background-image'] = 'temp/' + fileName

      createPreview()
    }
    const removeBgImg = async() => {
      if (currentBgPath) {
        void removeFile(currentBgPath)
        currentBgPath = ''
      }
      bgImg.value = ''
      bgImgRaw = ''
      theme.config.extInfo['--background-image'] = 'none'
      createPreview()
    }
    const handleDark = (val) => {
      theme.isDark = val
      applyPrimaryColor(theme.config.themeColors['--color-primary'], theme.config.themeColors['--color-1000'], theme.isDark, theme.isDarkFont)
    }
    const handleDarkFont = (val) => {
      theme.isDarkFont = val
      applyPrimaryColor(theme.config.themeColors['--color-primary'], theme.config.themeColors['--color-1000'], theme.isDark, theme.isDarkFont)
    }
    /**
     * 预览主题
     * @param {*} val 是否预览当前编辑的主题
     */
    const handlePreview = (val) => {
      if (val) {
        createPreview()
      } else {
        applyTheme(appSetting['theme.id'], appSetting['theme.lightId'], appSetting['theme.darkId'], themeInfo.dataPath)
      }
    }
    const handleCancel = () => {
      handlePreview(false)
      emit('update:modelValue', false)
    }
    // 保存
    const handleSubmit = async() => {
      if (!themeName.value) return
      theme.name = themeName.value.substring(0, 20)
      // 保存新背景
      if (currentBgPath && !isUrl(currentBgPath)) {
        const name = basename(currentBgPath)
        await moveFile(currentBgPath, joinPath(themeInfo.dataPath, name))
        theme.config.extInfo['--background-image'] = name
      }
      // 移除旧背景
      if (originBgName &&
        theme.config.extInfo['--background-image'] != originBgName &&
        !isUrl(theme.config.extInfo['--background-image'])) void removeFile(joinPath(themeInfo.dataPath, originBgName))
      if (props.themeId) {
        const index = themeInfo.userThemes.findIndex(t => t.id == theme.id)
        if (index > -1) themeInfo.userThemes.splice(index, 1, theme)
      } else themeInfo.userThemes.push(theme)
      handlePreview(false)
      await saveTheme(theme)
      emit('submit')
      emit('update:modelValue', false)
    }
    // 删除
    const handleRemove = async() => {
      const confirm = await dialog.confirm({
        message: window.i18n.t('theme_edit_modal__remove_tip'),
        cancelButtonText: window.i18n.t('cancel_button_text'),
        confirmButtonText: window.i18n.t('confirm_button_text'),
      })
      if (!confirm) return
      let isRequireUpdateSetting = false
      const newSetting = {}
      if (appSetting['theme.id'] == props.themeId) {
        newSetting['theme.id'] = 'green'
        isRequireUpdateSetting = true
      }
      if (theme.isDark) {
        if (appSetting['theme.darkId'] == props.themeId) {
          newSetting['theme.darkId'] = 'black'
          isRequireUpdateSetting = true
        }
      } else {
        if (appSetting['theme.lightId'] == props.themeId) {
          newSetting['theme.lightId'] = 'green'
          isRequireUpdateSetting = true
        }
      }
      if (isRequireUpdateSetting) updateSetting(newSetting)
      if (originBgName) void removeFile(joinPath(themeInfo.dataPath, originBgName))
      await removeTheme(props.themeId)
      const index = themeInfo.userThemes.findIndex(t => t.id == theme.id)
      console.log(index)
      if (index > -1) themeInfo.userThemes.splice(index, 1)
      handlePreview(false)
      emit('submit')
      emit('update:modelValue', false)
    }
    // 另存为
    const handleSaveNew = async() => {
      if (!themeName.value) return
      theme.name = themeName.value.substring(0, 20)
      theme.id = 'user_theme_' + Date.now()
      // 保存新背景
      if (!isUrl(currentBgPath)) {
        if (currentBgPath) {
          const name = basename(currentBgPath)
          await moveFile(currentBgPath, joinPath(themeInfo.dataPath, name))
          theme.config.extInfo['--background-image'] = name
        } else if (bgImgRaw) {
          const fileName = `${theme.id}_${Date.now()}${extname(bgImgRaw)}`
          await copyFile(bgImgRaw, joinPath(themeInfo.dataPath, fileName))
          theme.config.extInfo['--background-image'] = fileName
        }
      }
      themeInfo.userThemes.push(theme)
      handlePreview(false)
      await saveTheme(theme)
      emit('submit')
      emit('update:modelValue', false)
    }

    return {
      themeName,
      bgImg,
      isDark,
      handleDark,
      isDarkFont,
      handleDarkFont,
      preview,
      handlePreview,
      handleCancel,
      handleSubmit,
      handleRemove,
      handleSaveNew,
      selectBgImg,
      removeBgImg,

      primary_color_ref,
      font_color_ref,
      app_bg_color_ref,
      main_bg_color_ref,
      aside_font_color_ref,
      badge_primary_color_ref,
      badge_secondary_color_ref,
      badge_tertiary_color_ref,
      close_btn_color_ref,
      min_btn_color_ref,
      hide_btn_color_ref,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.main {
  // padding: 15px;
  // max-width: 400px;
  min-width: 300px;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  min-height: 0;
  h2 {
    flex: none;
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
    padding: 15px;
  }
  h3 {
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    padding-bottom: 15px;
    font-size: 15px;
  }
}
.content {
  flex: auto;
  // padding: 15px 0;
  font-size: 14px;
  gap: 5px;
  display: flex;
  flex-flow: column nowrap;
}
.group {

}
.groupTitle {
  padding: 20px 20px 0;
  display: flex;
  flex-flow: row wrap;

  .title {
    margin-right: 5px;
  }
}
.groupContent {
  display: flex;
  flex-flow: row wrap;
}
.item {
  padding: 15px 20px 0;
  width: 74px;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
}
.base {
  .color {
    width: 100%;
  }
}
.color {
  width: 80%;
  aspect-ratio: 1 / 1;
  background-color: var(--pcr-color);
  border-radius: @radius-border;
  cursor: pointer;
  transition: @transition-fast !important;
  transition-property: background-color, opacity !important;
  box-shadow: 0 0 3px var(--color-primary-light-100-alpha-300);
  &:hover {
    opacity: .7;
  }
}
.label {
  padding-top: 10px;
  text-align: center;
}

.bg {
  // width: 0;
  // flex: 1 1 auto;
  width: 150px;
  // min-width: 60px;
  // max-width: 200px;
}
.bgImg {
  width: 100%;
  height: 60px;
  border: 1Px dashed var(--color-primary-light-100-alpha-300);
  transition: .3s ease;
  transition-property: border, color;
  box-sizing: border-box;
  border: 1px dashed var(--color-primary-light-100-alpha-300);
  color: var(--color-primary-light-100-alpha-300);
  position: relative;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: @transition-fast !important;
  transition-property: background-color, opacity !important;
  overflow: hidden;
  &:hover {
    opacity: .7;
  }

  &.hasBg {
    border: none;

    .removeBtn {
      display: block;
    }
  }

  .img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .removeBtn {
    position: absolute;
    right: 0;
    top: 0;
    border: none;
    cursor: pointer;
    padding: 6px 8px;
    background-color: rgba(0, 0, 0, 0.6);
    color: rgba(255, 255, 255, 0.9);
    outline: none;
    transition: background-color 0.2s ease;
    line-height: 0;
    display: none;

    svg {
      height: .7em;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }
    &:active {
      background-color: rgba(0, 0, 0, 0.8);
    }
  }
  .icon {
    // position: absolute;
    // font-size: 16px;
    width: auto;
    height: 66%;
  }
}

@control-btn-width: @height-toolbar * .26;
.controlBtn {
  display: flex;
  -webkit-app-region: no-drag;
  align-items: center;
  padding: 0 @control-btn-width;
  flex-direction: row-reverse;
  // height: @height-toolbar * .7;
  transition: opacity @transition-normal;
  opacity: .5;
  &:hover {
    opacity: .8;
    .controlBtnIcon {
      opacity: 1;
    }
  }

  button {
    display: flex;
    position: relative;
    background: none;
    border: none;
    outline: none;
    padding: 1px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: @control-btn-width;
    height: @control-btn-width;
    border-radius: 50%;
    color: var(--color-font);
    + button {
      margin-right: (@control-btn-width / 2);
    }

    &.hide {
      background-color: var(--color-btn-hide);
    }
    &.min, &.fullscreenExit {
      background-color: var(--color-btn-min);
    }
    // &.max {
    //   background-color: var(--color-btn-max);
    // }
    &.close {
      background-color: var(--color-btn-close);
    }
  }
}

.controlBtnIcon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.note {
  padding: 8px 15px;
  font-size: 13px;
  line-height: 1.25;
  color: var(--color-font);
  // p {
  //   + p {
  //     margin-top: 5px;
  //   }
  // }
}
.footer {
  padding: 15px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  font-size: 14px;
  .subContent {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 10px;
  }

  .checkbox {
    flex: none;
  }
  .input {
    max-width: 150px;
    flex: 0 1 auto;
  }
}


.btn {
  // box-sizing: border-box;
  // margin-left: 15px;
  // margin-bottom: 15px;
  // height: 36px;
  // line-height: 36px;
  // padding: 0 10px !important;
  min-width: 70px;
  // .mixin-ellipsis-1();
}

</style>
