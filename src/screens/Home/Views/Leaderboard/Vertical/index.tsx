import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'

import MusicList, { type MusicListType } from '../MusicList'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import HeaderBar, { type HeaderBarType, type HeaderBarProps } from './HeaderBar'
import QuickKgBar from './QuickKgBar'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
// import { BorderWidths } from '@/theme'
// import { useTheme } from '@/store/theme/hook'
import BoardsList, { type BoardsListType, type BoardsListProps } from '../BoardsList'
import type { InitState as CommonState } from '@/store/common/state'
import settingState from '@/store/setting/state'
import { getBoardsList } from '@/core/leaderboard'
import { COMPONENT_IDS } from '@/config/constant'
import { handleCollect, handlePlay } from '../listAction'
import boardState from '@/store/leaderboard/state'


const MAX_WIDTH = scaleSizeW(200)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const theme = useTheme()
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  const boardsListRef = useRef<BoardsListType>(null)
  const headerBarRef = useRef<HeaderBarType>(null)
  const boundInfo = useRef<{ source: LX.OnlineSource, id: string | null }>({ source: 'kg', id: 'kg__8888' })
  const [currentBoardId, setCurrentBoardId] = useState<string | null>('kg__8888')
  const [currentSource, setCurrentSource] = useState<LX.OnlineSource>('kg')
  // const [width, setWidth] = useState(0)

  const handleBoundChange = (source: LX.OnlineSource, id: string) => {
    setCurrentSource(source)
    setCurrentBoardId(id)
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }

  const handleSelectKgBoard = (boardId: string) => {
    boundInfo.current.source = 'kg'
    boundInfo.current.id = boardId
    setCurrentSource('kg')
    setCurrentBoardId(boardId)
    void getBoardsList('kg').then(list => {
      requestAnimationFrame(() => {
        const bound = list.find(l => l.id == boardId)
        boardsListRef.current?.setList(list, boardId)
        headerBarRef.current?.setBound('kg', boardId, bound?.name ?? 'Unknown')
      })
    })
    handleBoundChange('kg', boardId)
  }
  const onBoundChange: BoardsListProps['onBoundChange'] = (id) => {
    boundInfo.current.id = id
    void getBoardsList(boundInfo.current.source).then(list => {
      requestAnimationFrame(() => {
        const bound = list.find(l => l.id == id)
        headerBarRef.current?.setBound(boundInfo.current.source, id, bound?.name ?? 'Unknown')
      })
    })
    handleBoundChange(boundInfo.current.source, id)
    requestAnimationFrame(() => {
      drawer.current?.closeDrawer()
    })
  }
  const onPlay: BoardsListProps['onPlay'] = (id) => {
    boundInfo.current.id = id
    void handlePlay(id, boardState.listDetailInfo.list)
  }
  const onCollect: BoardsListProps['onCollect'] = (id, name) => {
    boundInfo.current.id = id
    void handleCollect(id, name, boundInfo.current.source)
  }
  const onShowBound = () => {
    requestAnimationFrame(() => {
      drawer.current?.openDrawer()
    })
  }
  const onSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    boundInfo.current.source = source
    void getBoardsList(source).then(list => {
      const id = list[0].id
      const name = list[0].name
      requestAnimationFrame(() => {
        boardsListRef.current?.setList(list, id)
        headerBarRef.current?.setBound(source, id, name ?? 'Unknown')
        requestAnimationFrame(() => {
          handleBoundChange(source, id)
        })
      })
    })
  }

  const navigationView = () => {
    return (
      <BoardsList
        ref={boardsListRef}
        onBoundChange={onBoundChange}
        onCollect={onCollect}
        onPlay={onPlay}
      />
    )
  }

  // const theme = useTheme()


  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_top') drawer.current?.fixWidth()
    }
    global.state_event.on('navActiveIdUpdated', handleFixDrawer)


    const handleSwitchToKg = () => {
      handleSelectKgBoard('kg__8888')
    }
    global.app_event.on('switchToKgLeaderboard' as any, handleSwitchToKg)

    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      const activeSource = source || 'kg'
      const activeBoardId = boardId || 'kg__8888'
      boundInfo.current.source = activeSource
      boundInfo.current.id = activeBoardId
      setCurrentSource(activeSource)
      setCurrentBoardId(activeBoardId)
      void getBoardsList(activeSource).then(list => {
        const bound = list.find(l => l.id == activeBoardId)
        boardsListRef.current?.setList(list, activeBoardId)
        headerBarRef.current?.setBound(activeSource, activeBoardId, bound?.name ?? 'Unknown')
      })
      musicListRef.current?.loadList(activeSource, activeBoardId)
    })

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('switchToKgLeaderboard' as any, handleSwitchToKg)
      isUnmountedRef.current = true
    }
  }, [])


  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      // drawerWidth={width}
      widthPercentage={0.82}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
      drawerBackgroundColor={theme['c-content-background']}
      style={{ elevation: 1 }}
    >
      <View style={styles.container}>
        <HeaderBar ref={headerBarRef} onShowBound={onShowBound} onSourceChange={onSourceChange} />
        <QuickKgBar
          currentBoardId={currentBoardId}
          currentSource={currentSource}
          onSelectBoard={handleSelectKgBoard}
        />
        <MusicList ref={musicListRef} />
      </View>
    </DrawerLayoutFixed>
    // <View style={styles.container}>
    //   <LeftBar
    //     ref={leftBarRef}
    //     onChangeList={handleChangeBound}
    //   />
    //   <MusicList
    //     ref={musicListRef}
    //   />
    // </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    // borderTopWidth: BorderWidths.normal,
  },
  // content: {
  //   flex: 1,
  // },
})
