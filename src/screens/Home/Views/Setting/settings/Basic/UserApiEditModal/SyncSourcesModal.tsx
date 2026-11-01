import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { useTheme } from '@/store/theme/hook'
import { createStyle, toast } from '@/utils/tools'
import { ONLINE_SOURCE_LIST, syncAllOnlineSources, syncOnlineSource, type RemoteSourceItem } from '@/core/onlineSources'

export interface SyncSourcesModalType {
  show: () => void
}

export default forwardRef<SyncSourcesModalType, {}>((props, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const theme = useTheme()
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')

  useImperativeHandle(ref, () => ({
    show() {
      dialogRef.current?.setVisible(true)
    },
  }))

  const handleClose = () => {
    if (isSyncingAll) return
    dialogRef.current?.setVisible(false)
  }

  const handleSyncSingle = async(item: RemoteSourceItem) => {
    if (isSyncingAll || syncingId) return
    setSyncingId(item.id)
    try {
      await syncOnlineSource(item)
      toast(`已成功同步【${item.name}】`)
    } catch (e: any) {
      toast(`同步失败: ${e?.message ?? '网络超时'}`)
    } finally {
      setSyncingId(null)
    }
  }

  const handleSyncAll = async() => {
    if (isSyncingAll || syncingId) return
    setIsSyncingAll(true)
    setSyncProgress('准备同步...')
    try {
      const { successCount, failCount, total } = await syncAllOnlineSources((cur, tot, name) => {
        setSyncProgress(`正在同步 (${cur}/${tot}): ${name}`)
      })
      toast(`同步完成！成功: ${successCount} 个，失败: ${failCount} 个`)
    } catch (e: any) {
      toast(`批量同步异常: ${e?.message ?? '未知错误'}`)
    } finally {
      setIsSyncingAll(false)
      setSyncProgress('')
    }
  }

  return (
    <Dialog ref={dialogRef} bgHide={!isSyncingAll}>
      <View style={styles.container}>
        <Text size={16} style={styles.title}>同步音源仓库</Text>
        <Text size={12} color={theme['c-font-label']} style={styles.subtitle}>
          整合 pdone/lx-music-source 与 guoyue2010/lxmusic- 开源仓库最新音源
        </Text>

        {isSyncingAll ? (
          <View style={styles.progressBox}>
            <ActivityIndicator size="small" color={theme['c-primary-font']} />
            <Text size={13} color={theme['c-primary-font']} style={{ marginLeft: 8 }}>
              {syncProgress}
            </Text>
          </View>
        ) : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {ONLINE_SOURCE_LIST.map((item) => {
            const isItemSyncing = syncingId === item.id
            return (
              <View
                key={item.id}
                style={{
                  ...styles.item,
                  borderBottomColor: theme['c-border-background'],
                }}
              >
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text size={14} style={{ fontWeight: 'bold' }}>
                      {item.name}
                    </Text>
                    <View
                      style={{
                        ...styles.tag,
                        backgroundColor:
                          item.repo.indexOf('pdone') !== -1
                            ? theme['c-primary-light-900-alpha-700']
                            : theme['c-primary-light-700-alpha-500'],
                      }}
                    >
                      <Text size={10} color={theme['c-primary-font-active']}>
                        {item.repo.split('/')[0]}
                      </Text>
                    </View>
                  </View>
                  <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text size={11} color={theme['c-font-label']}>
                    作者: {item.author}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    ...styles.syncBtn,
                    backgroundColor: theme['c-primary-background'],
                  }}
                  disabled={isSyncingAll || !!syncingId}
                  onPress={() => void handleSyncSingle(item)}
                >
                  {isItemSyncing ? (
                    <ActivityIndicator size="small" color={theme['c-primary-font']} />
                  ) : (
                    <Text size={12} color={theme['c-primary-font']}>
                      同步
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            style={{
              ...styles.btn,
              backgroundColor: theme['c-button-background'],
              marginRight: 10,
            }}
            disabled={isSyncingAll}
            onPress={handleClose}
          >
            <Text size={14} color={theme['c-button-font']}>关闭</Text>
          </Button>
          <Button
            style={{
              ...styles.btn,
              backgroundColor: theme['c-primary-font-active'],
            }}
            disabled={isSyncingAll || !!syncingId}
            onPress={() => void handleSyncAll()}
          >
            <Text size={14} color="#fff">一键同步全部</Text>
          </Button>
        </View>
      </View>
    </Dialog>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
    maxHeight: 480,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  list: {
    maxHeight: 280,
  },
  listContent: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tag: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  syncBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 4,
  },
})
