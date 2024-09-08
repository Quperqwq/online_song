/**
 * `/search`搜索响应类型(注:该d.ts文件由ai生成 仅供参考, 请以实际为准)
 */
export interface ApiResponse {
    /** 结果数据 */
    result: Result;
    /** 响应代码 */
    code: 200 | 400;
}

/**
 * 结果类型
 */
export interface Result {
    /** 搜索提示 */
    searchQcReminder: null | string;
    /** 歌曲列表 */
    songs: Song[];
    /** 歌曲总数 */
    songCount: number;
}

/**
 * 歌曲类型
 */
export interface Song {
    /** 歌曲名称 */
    name: string;
    /** 歌曲 ID */
    id: number;
    /** 发布状态 */
    pst: number;
    /** 类型 */
    t: number;
    /** 艺术家列表 */
    ar: Artist[];
    /** 别名 */
    alia: string[];
    /** 流行度 */
    pop: number;
    /** 状态 */
    st: number;
    /** 返回类型 */
    rt: string;
    /** 费用 */
    fee: number;
    /** 版本 */
    v: number;
    /** 彩铃 */
    crbt: null | string;
    /** 配置 */
    cf: string;
    /** 专辑信息 */
    al: Album;
    /** 时长（毫秒） */
    dt: number;
    /** 高质量音频信息 */
    h: Quality;
    /** 中质量音频信息 */
    m: Quality;
    /** 低质量音频信息 */
    l: Quality;
    /** 超高质量音频信息 */
    sq: Quality;
    /** 高分辨率音频信息 */
    hr: null | Quality;
    /** 其他信息 */
    a: null | string;
    /** CD 号 */
    cd: string;
    /** 曲目编号 */
    no: number;
    /** 返回链接 */
    rtUrl: null | string;
    /** 文件类型 */
    ftype: number;
    /** 返回链接列表 */
    rtUrls: string[];
    /** DJ ID */
    djId: number;
    /** 版权信息 */
    copyright: number;
    /** S ID */
    s_id: number;
    /** 标记 */
    mark: number;
    /** 原始封面类型 */
    originCoverType: number;
    /** 原始歌曲简要数据 */
    originSongSimpleData: null | string;
    /** 标签图片列表 */
    tagPicList: null | string;
    /** 资源状态 */
    resourceState: boolean;
    /** 版本 */
    version: number;
    /** 歌曲跳转信息 */
    songJumpInfo: null | string;
    /** 娱乐标签 */
    entertainmentTags: null | string;
    /** 单曲 */
    single: number;
    /** 无版权推荐 */
    noCopyrightRcmd: null | string;
    /** 返回类型 */
    rtype: number;
    /** 返回链接 */
    rurl: null | string;
    /** MST */
    mst: number;
    /** 版权信息 */
    cp: number;
    /** MV ID */
    mv: number;
    /** 发布的时间戳 */
    publishTime: number;
    /** 权限信息 */
    privilege: Privilege;
}

/**
 * 艺术家类型
 */
export interface Artist {
    /** 艺术家 ID */
    id: number;
    /** 艺术家名称 */
    name: string;
    /** 别名 */
    tns: string[];
    /** 其他别名 */
    alias: string[];
    /** 重复的别名字段 */
    alia: string[];
}

/**
 * 专辑类型
 */
export interface Album {
    /** 专辑 ID */
    id: number;
    /** 专辑名称 */
    name: string;
    /** 专辑封面 URL */
    picUrl: string;
    /** 别名 */
    tns: string[];
    /** 图片字符串 */
    pic_str: string;
    /** 图片 ID */
    pic: number;
}

/**
 * 音频质量类型
 */
export interface Quality {
    /** 比特率 */
    br: number;
    /** 文件 ID */
    fid: number;
    /** 文件大小 */
    size: number;
    /** 视频数据 */
    vd: number;
    /** 采样率 */
    sr: number;
}

/**
 * 权限类型
 */
export interface Privilege {
    /** 权限 ID */
    id: number;
    /** 费用 */
    fee: number;
    /** 是否已支付 */
    payed: number;
    /** 状态 */
    st: number;
    /** 播放权限 */
    pl: number;
    /** 下载权限 */
    dl: number;
    /** 分享权限 */
    sp: number;
    /** 版权信息 */
    cp: number;
    /** 子权限 */
    subp: number;
    /** 是否可消费 */
    cs: boolean;
    /** 最大比特率 */
    maxbr: number;
    /** 流媒体权限 */
    fl: number;
    /** 是否显示提示 */
    toast: boolean;
    /** 标记 */
    flag: number;
    /** 是否预售 */
    preSell: boolean;
    /** 最大播放比特率 */
    playMaxbr: number;
    /** 最大下载比特率 */
    downloadMaxbr: number;
    /** 最大比特率级别 */
    maxBrLevel: string;
    /** 最大播放比特率级别 */
    playMaxBrLevel: string;
    /** 最大下载比特率级别 */
    downloadMaxBrLevel: string;
    /** 播放级别 */
    plLevel: string;
    /** 下载级别 */
    dlLevel: string;
    /** 流媒体级别 */
    flLevel: string;
    /** 资源说明 */
    rscl: null | string;
    /** 免费试用权限 */
    freeTrialPrivilege: FreeTrialPrivilege;
    /** 权利来源 */
    rightSource: number;
    /** 费用信息列表 */
    chargeInfoList: ChargeInfo[];
}

/**
 * 免费试用权限类型
 */
export interface FreeTrialPrivilege {
    /** 资源是否可消费 */
    resConsumable: boolean;
    /** 用户是否可消费 */
    userConsumable: boolean;
    /** 收听类型 */
    listenType: null | string;
    /** 无法收听原因 */
    cannotListenReason: null | string;
}

/**
 * 费用信息类型
 */
export interface ChargeInfo {
    /** 比特率 */
    rate: number;
    /** 收费链接 */
    chargeUrl: null | string;
    /** 收费信息 */
    chargeMessage: null | string;
    /** 收费类型 */
    chargeType: number;
}