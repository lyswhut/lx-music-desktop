<template>
  <div :class="$style.container">
    <div :class="$style.songListHeader">
      <div :class="$style.songListHeaderLeft" :style="{ backgroundImage: 'url('+(picUrl || listDetailInfo.info.img)+')' }" />
      <div :class="$style.songListHeaderMiddle">
        <span :class="$style.eyebrow">{{ sourceLabel }}</span>
        <h1 :title="listDetailInfo.info.name">{{ listDetailInfo.info.name }}</h1>
        <p :title="cleanDesc">{{ cleanDesc }}</p>
        <div :class="$style.tools">
          <base-btn
            primary
            :disabled="!!listDetailInfo.noItemLabel"
            @click="playSongListDetail(listDetailInfo.id, listDetailInfo.source, listDetailInfo.list)"
          >
            <svg :class="$style.playIcon" viewBox="0 0 24 24" aria-hidden="true">
              <use xlink:href="#icon-line-play-fill" />
            </svg>
            {{ $t('lists__play_all') }}
          </base-btn>
          <base-btn
            outline
            :disabled="!!listDetailInfo.noItemLabel"
            @click="addSongListDetail(listDetailInfo.id, listDetailInfo.source, listDetailInfo.info.name)"
          >
            {{ $t('list__collect') }}
          </base-btn>
          <base-btn outline @click="handleBack">{{ $t('back') }}</base-btn>
          <span :class="$style.count">{{ $t('lists__song_count', { num: listDetailInfo.total || listDetailInfo.list.length }) }}</span>
        </div>
      </div>
    </div>
    <p :class="$style.hint">{{ $t('lists__list_hint') }}</p>
    <div :class="$style.list">
      <material-online-list
        ref="listRef"
        :page="listDetailInfo.page"
        :limit="listDetailInfo.limit"
        :total="listDetailInfo.total"
        :list="listDetailInfo.list"
        :no-item="listDetailInfo.noItemLabel"
        @play-list="handlePlayList"
        @toggle-page="togglePage"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { ref, watch, computed } from '@common/utils/vueTools'
import { listDetailInfo } from '@renderer/store/songList/state'
import { setVisibleListDetail } from '@renderer/store/songList/action'
import { useRouter } from '@common/utils/vueRouter'
import { addSongListDetail, playSongListDetail } from './action'
import useList from './useList'
import useKeyBack from './useKeyBack'
import { sourceNames } from '@renderer/store'


const source = ref<LX.OnlineSource>('kw')
const id = ref<string>('')
const page = ref<number>(1)
const picUrl = ref<string>('')
const refresh = ref<boolean>(false)


interface Query {
  source?: string
  id?: string
  page?: string
  picUrl?: string
  refresh?: 'true'
  fromName?: string
}

const verifyQueryParams = async function(this: any, to: { query: Query, path: string }, from: any, next: (route?: { path: string, query: Query }) => void) {
  let _source = to.query.source
  let _id = to.query.id
  let _page: string | undefined = to.query.page
  let _picUrl: string | undefined = to.query.picUrl
  let _refresh: 'true' | undefined = to.query.refresh

  if (_source == null || _id == null) {
    if (listDetailInfo.key) {
      _source = listDetailInfo.source
      _id = listDetailInfo.id
      _page = listDetailInfo.page.toString()
      _picUrl = listDetailInfo.info.img
    } else {
      setVisibleListDetail(false)
      next({ path: '/songList/list', query: {} })
      return
    }

    next({
      path: to.path,
      query: { ...to.query, source: _source, id: _id, page: _page, picUrl: _picUrl, refresh: _refresh },
    })
    return
  }
  next()
  setVisibleListDetail(true)
  source.value = _source as LX.OnlineSource
  id.value = _id
  page.value = _page ? parseInt(_page) : 1
  picUrl.value = _picUrl ?? ''
  refresh.value = _refresh ? _refresh == 'true' : false
  if (to.query.fromName) window.lx.songListInfo.fromName = to.query.fromName
}


export default {
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const router = useRouter()

    const {
      listRef,
      listDetailInfo,
      getListData,
      handlePlayList,
    } = useList()


    const togglePage = (page: number) => {
      void getListData(source.value, id.value, page, refresh.value)
    }

    const handleBack = () => {
      setVisibleListDetail(false)
      if (window.lx.songListInfo.fromName) void router.replace({ name: window.lx.songListInfo.fromName })
      else router.back()
    }

    useKeyBack(handleBack)

    watch([source, id, page, refresh], async([_source, _id, _page, _refresh]) => {
      if (!_source || !_id) return router.replace({ path: '/songList/list' })
      // console.log(_source, _id, _page, _refresh, picUrl.value)
      // source.value = _source
      // id.value = _id
      // refresh.value = _refresh
      // page.value = _page ?? 1
      void getListData(_source, _id, _page, _refresh)
    }, {
      immediate: true,
    })

    const sourceLabel = computed(() => sourceNames.value[source.value] ?? '')
    const cleanDesc = computed(() => String(listDetailInfo.info.desc ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())

    return {
      source,
      sourceLabel,
      cleanDesc,
      id,
      page,
      picUrl,
      listDetailInfo,
      listRef,
      togglePage,
      addSongListDetail,
      playSongListDetail,
      handlePlayList,
      handleBack,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  padding: 29px 32px 0;
  box-sizing: border-box;
}

.songListHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  min-height: 144px;
  padding: 0;
  margin-bottom: 20px;
  gap: 20px;
  box-sizing: border-box;
}
.songListHeaderLeft {
  flex: none;
  width: 144px;
  height: 144px;
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  border-radius: 11px;
  background-position: center;
  background-size: cover;
  background-color: var(--color-button-background);
  box-shadow: 0 10px 24px #163b2825;
}

.songListHeaderMiddle {
  flex: auto;
  min-width: 0;
  .eyebrow {
    display: block;
    font-size: 9px;
    font-weight: 650;
    letter-spacing: 2.4px;
    text-transform: uppercase;
    color: var(--color-primary);
    margin-bottom: 10px;
  }
  h1 {
    margin: 0 0 9px;
    font-size: 30px;
    line-height: 1.35;
    font-weight: 720;
    letter-spacing: -1.1px;
    .mixin-ellipsis-1();
    color: var(--color-font);
  }
  p {
    margin: 8px 0;
    max-width: 590px;
    .mixin-ellipsis(2);
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-font-label);
  }
}
.tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.playIcon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  fill: currentColor;
}
.count {
  font-size: 11px;
  color: var(--color-font-label);
}

.hint {
  flex: none;
  margin: 0 0 12px;
  font-size: 11px;
  color: var(--color-font-label);
}
.list {
  position: relative;
  width: 100%;
  min-height: 0;
  flex: auto;
  height: 100%;
  :global {
    .thead th {
      font-size: 10px;
      font-weight: 450;
      line-height: 32px;
      padding: 0 10px;
      color: var(--color-secondary, var(--color-font-label));
    }
  }
}
</style>

