import { addUserApi, getUserApiList, getUserApiScript, saveData, saveDataMultiple } from '@/utils/data'
import { action as userApiAction } from '@/store/userApi'
import { BUILTIN_SOURCES } from '@/resources/builtinSources'
import { httpFetch } from '@/utils/request'
import settingState from '@/store/setting/state'
import { updateSetting } from '@/core/common'
import { log } from '@/utils/log'

export interface RemoteSourceItem {
  id: string
  name: string
  author: string
  description: string
  repo: 'pdone/lx-music-source' | 'guoyue2010/lxmusic-'
  urls: string[]
}

export const ONLINE_SOURCE_LIST: RemoteSourceItem[] = [
  {
    id: 'pdone_sixyin',
    name: '六音音源',
    author: '六音',
    description: '支持五大平台全音质解析，长期维护更新',
    repo: 'pdone/lx-music-source',
    urls: [
      'https://fastly.jsdelivr.net/gh/pdone/lx-music-source@main/sixyin/latest.js',
      'https://raw.githubusercontent.com/pdone/lx-music-source/main/sixyin/latest.js',
    ],
  },
  {
    id: 'pdone_lx',
    name: '独家音源',
    author: 'w',
    description: '洛雪官方/基础独家聚合音源',
    repo: 'pdone/lx-music-source',
    urls: [
      'https://fastly.jsdelivr.net/gh/pdone/lx-music-source@main/lx/latest.js',
      'https://raw.githubusercontent.com/pdone/lx-music-source/main/lx/latest.js',
    ],
  },
  {
    id: 'pdone_juhe',
    name: '聚合API接口(CF)',
    author: 'lerd',
    description: '多线路 Cloudflare Worker 聚合解析接口',
    repo: 'pdone/lx-music-source',
    urls: [
      'https://fastly.jsdelivr.net/gh/pdone/lx-music-source@main/juhe/latest.js',
      'https://raw.githubusercontent.com/pdone/lx-music-source/main/juhe/latest.js',
    ],
  },
  {
    id: 'pdone_changqing',
    name: '长青SVIP音源',
    author: 'SVIP',
    description: '支持高品质无损与多源备份',
    repo: 'pdone/lx-music-source',
    urls: [
      'https://fastly.jsdelivr.net/gh/pdone/lx-music-source@main/changqing/latest.js',
      'https://raw.githubusercontent.com/pdone/lx-music-source/main/changqing/latest.js',
    ],
  },
  {
    id: 'pdone_huibq',
    name: 'Huibq音源',
    author: 'Huibq',
    description: '社区热门开源音源',
    repo: 'pdone/lx-music-source',
    urls: [
      'https://fastly.jsdelivr.net/gh/pdone/lx-music-source@main/huibq/latest.js',
      'https://raw.githubusercontent.com/pdone/lx-music-source/main/huibq/latest.js',
    ],
  },
  {
    id: 'guoyue2010_feichangdao',
    name: '非常刀音源',
    author: '群主要进去',
    description: 'guoyue2010 仓库精选，高可用性聚合音源',
    repo: 'guoyue2010/lxmusic-',
    urls: [
      'https://fastly.jsdelivr.net/gh/guoyue2010/lxmusic-@main/V260907/%E9%9D%9E%E5%B8%B8%E5%88%80%20v5.js',
      'https://raw.githubusercontent.com/guoyue2010/lxmusic-/main/V260907/%E9%9D%9E%E5%B8%B8%E5%88%80%20v5.js',
    ],
  },
  {
    id: 'guoyue2010_tongyi',
    name: '统一音乐源',
    author: '7878gyc',
    description: '基于GD音乐台的通用音乐源',
    repo: 'guoyue2010/lxmusic-',
    urls: [
      'https://fastly.jsdelivr.net/gh/guoyue2010/lxmusic-@main/V260907/%E7%BB%9F%E4%B8%80%E9%9F%B3%E4%B9%90%E6%BA%90.js',
      'https://raw.githubusercontent.com/guoyue2010/lxmusic-/main/V260907/%E7%BB%9F%E4%B8%80%E9%9F%B3%E4%B9%90%E6%BA%90.js',
    ],
  },
  {
    id: 'guoyue2010_juhe_net',
    name: '收集の聚合接口',
    author: 'QZ',
    description: '聚合多平台免费音源接口',
    repo: 'guoyue2010/lxmusic-',
    urls: [
      'https://fastly.jsdelivr.net/gh/guoyue2010/lxmusic-@main/V260907/%E6%94%B6%E9%9B%86%E3%81%AE%E8%81%9A%E5%90%88%E6%8E%A5%E5%8F%A3.js',
      'https://raw.githubusercontent.com/guoyue2010/lxmusic-/main/V260907/%E6%94%B6%E9%9B%86%E3%81%AE%E8%81%9A%E5%90%88%E6%8E%A5%E5%8F%A3.js',
    ],
  },
]

/**
 * 抓取远程脚本（自动回退多 URL）
 */
export const fetchSourceScript = async(item: RemoteSourceItem): Promise<string> => {
  let lastError: Error | null = null
  for (const url of item.urls) {
    try {
      const response = await httpFetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      }).promise
      if (response.statusCode === 200 && response.body && typeof response.body === 'string') {
        return response.body
      }
    } catch (e: any) {
      lastError = e
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${item.name}`)
}

/**
 * 导入或更新单个音源
 */
export const importOrUpdateSource = async(script: string, defaultName?: string) => {
  const currentList = await getUserApiList()
  const result = /^\/\*[\S|\s]+?\*\//.exec(script)
  let scriptName = defaultName || ''
  if (result) {
    const rxp = /^\s?\*\s?@name\s(.+)$/m
    const match = rxp.exec(result[0])
    if (match && match[1]) {
      scriptName = match[1].trim()
    }
  }

  // 检查是否已存在同名源
  const existing = currentList.find(api => api.name === scriptName)
  if (existing) {
    // 覆盖现有脚本内容
    await saveData(`@user_api__${existing.id}`, script)
    return existing
  } else {
    // 添加为新源
    const info = await addUserApi(script)
    userApiAction.addUserApi(info)
    return info
  }
}

/**
 * 同步指定的在线源
 */
export const syncOnlineSource = async(item: RemoteSourceItem) => {
  const script = await fetchSourceScript(item)
  return await importOrUpdateSource(script, item.name)
}

/**
 * 批量同步所有在线音源
 */
export const syncAllOnlineSources = async(
  onProgress?: (current: number, total: number, name: string) => void,
) => {
  let successCount = 0
  let failCount = 0
  const total = ONLINE_SOURCE_LIST.length

  for (let i = 0; i < total; i++) {
    const item = ONLINE_SOURCE_LIST[i]
    if (onProgress) onProgress(i + 1, total, item.name)
    try {
      await syncOnlineSource(item)
      successCount++
    } catch (err: any) {
      log.error(`[OnlineSourceSync] Failed to sync ${item.name}: ${err?.message}`)
      failCount++
    }
  }

  // 刷新全局状态中的列表
  userApiAction.setUserApiList(await getUserApiList())
  return { successCount, failCount, total }
}

/**
 * 应用初始化时安装内置预设音源（开箱即用）
 */
export const initBuiltinSources = async() => {
  try {
    const list = await getUserApiList()
    if (list.length === 0) {
      log.info('[BuiltinSources] Initializing pre-packaged sources...')
      let firstApiId = ''
      for (const [key, script] of Object.entries(BUILTIN_SOURCES)) {
        try {
          const info = await addUserApi(script)
          userApiAction.addUserApi(info)
          if (!firstApiId) firstApiId = info.id
        } catch (e: any) {
          log.error(`[BuiltinSources] Failed to add ${key}: ${e?.message}`)
        }
      }
      // 默认自动启用第一个内置音源（通常为六音音源）
      if (firstApiId && !settingState.setting['common.apiSource']) {
        updateSetting({ 'common.apiSource': firstApiId })
      }
      userApiAction.setUserApiList(await getUserApiList())
    }
  } catch (err: any) {
    log.error(`[BuiltinSources] Initialization error: ${err?.message}`)
  }
}
