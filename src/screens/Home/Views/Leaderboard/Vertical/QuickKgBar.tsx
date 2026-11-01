import React from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import boardState from '@/store/leaderboard/state'
import { handlePlay } from '../listAction'

interface QuickKgBarProps {
  currentBoardId: string | null
  currentSource: LX.OnlineSource
  onSelectBoard: (boardId: string) => void
}

const KG_HOT_BOARDS = [
  { id: 'kg__8888', name: 'TOP500' },
  { id: 'kg__6666', name: '飙升榜' },
  { id: 'kg__52144', name: '抖音热歌' },
  { id: 'kg__52767', name: '快手热歌' },
  { id: 'kg__24971', name: 'DJ热歌' },
  { id: 'kg__23784', name: '网络红歌' },
  { id: 'kg__51341', name: '民谣榜' },
  { id: 'kg__33165', name: '粤语金曲' },
]

export default ({ currentBoardId, currentSource, onSelectBoard }: QuickKgBarProps) => {
  const theme = useTheme()

  const handlePlayCurrent = () => {
    const list = boardState.listDetailInfo.list
    if (list && list.length > 0) {
      void handlePlay(boardState.listDetailInfo.id, list, 0)
    }
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'], borderBottomColor: theme['c-border-background'] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.badge}>
          <Text size={11} color={theme['c-primary-font-active']} style={{ fontWeight: 'bold' }}>酷狗榜单</Text>
        </View>

        {KG_HOT_BOARDS.map((b) => {
          const isActive = currentSource === 'kg' && currentBoardId === b.id
          return (
            <TouchableOpacity
              key={b.id}
              style={{
                ...styles.chip,
                backgroundColor: isActive ? theme['c-primary-font-active'] : theme['c-primary-input-background'],
              }}
              onPress={() => onSelectBoard(b.id)}
            >
              <Text size={12} color={isActive ? '#fff' : theme['c-font']}>
                {b.name}
              </Text>
            </TouchableOpacity>
          )
        })}

        <TouchableOpacity
          style={{ ...styles.playAllBtn, backgroundColor: theme['c-primary-background'] }}
          onPress={handlePlayCurrent}
        >
          <Icon name="play" size={13} color={theme['c-primary-font-active']} style={{ marginRight: 4 }} />
          <Text size={12} color={theme['c-primary-font-active']} style={{ fontWeight: 'bold' }}>
            直接听
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = createStyle({
  container: {
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: 'rgba(7, 197, 86, 0.15)',
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 2,
    marginRight: 8,
  },
})
