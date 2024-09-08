/**
 * `/song/detail` 获取歌曲响应类型(注:该d.ts文件由ai生成 仅供参考, 请以实际为准)
 */
export interface ApiResponse {
    /** 响应代码 */
    code: number;
    /** 歌曲数组 */
    songs: Song[];
    /** 权限数组 */
    privileges: Privilege[];
}

/**
 * 歌曲类型
 */
export interface Song {
    /** 歌曲名称 */
    name: string;
    /** 歌曲 ID */
    id: number;
    /** 歌曲 PST */
    pst: number;
    /** 歌曲类型 */
    t: number;
    /** 艺术家数组 */
    ar: Artist[];
    /** 别名数组 */
    alia: string[];
    /** 热度值 */
    pop: number;
    /** 状态 */
    st: number;
    /** 版权类型 */
    fee: number;
    /** 版本 */
    v: number;
    /** 彩铃 */
    crbt: null | any;
    /** CF 类型 */
    cf: string;
    /** 专辑信息 */
    al: Album;
    /** 时长（毫秒） */
    dt: number;
    /** 高音质信息 */
    h: QualityInfo;
    /** 中音质信息 */
    m: QualityInfo;
    /** 低音质信息 */
    l: QualityInfo;
    /** SQ 音质信息 */
    sq: QualityInfo;
    /** HR 音质信息 */
    hr: QualityInfo;
    /** CD 信息 */
    cd: string;
    /** 歌曲序号 */
    no: number;
    /** 其他字段 */
    a: null | any;
    /** MV ID */
    mv: number;
    /** 发布时间 */
    publishTime: number;
    /** 歌曲别名 */
    tns: string[];
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
    /** 艺术家别名 */
    alias: string[];
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
    /** 专辑别名 */
    tns: string[];
    /** 图片字符串 */
    pic_str: string;
    /** 图片 ID */
    pic: number;
}

/**
 * 音质信息类型
 */
export interface QualityInfo {
    /** 比特率 */
    br: number;
    /** 文件 ID */
    fid: number;
    /** 文件大小（字节） */
    size: number;
    /** 音频视频延迟 */
    vd: number;
    /** 采样率 */
    sr: number;
}

/**
 * 权限类型
 */
export interface Privilege {
    /** 歌曲 ID */
    id: number;
    /** 费用 */
    fee: number;
    /** 是否已支付 */
    payed: number;
    /** 状态 */
    st: number;
    /** 播放比特率 */
    pl: number;
    /** 下载比特率 */
    dl: number;
    /** 额外标识 */
    sp: number;
    /** 版权类型 */
    cp: number;
    /** 订阅类型 */
    subp: number;
    /** 是否可用 */
    cs: boolean;
    /** 最大比特率 */
    maxbr: number;
    /** 播放比特率 */
    fl: number;
    /** 是否显示提示 */
    toast: boolean;
    /** 标记 */
    flag: number;
    /** 是否预售 */
    preSell: boolean;
    /** 播放最大比特率 */
    playMaxbr: number;
    /** 下载最大比特率 */
    downloadMaxbr: number;
    /** 最大比特率等级 */
    maxBrLevel: string;
    /** 播放最大比特率等级 */
    playMaxBrLevel: string;
    /** 下载最大比特率等级 */
    downloadMaxBrLevel: string;
    /** 播放等级 */
    plLevel: string;
    /** 下载等级 */
    dlLevel: string;
    /** 音质等级 */
    flLevel: string;
    /** 免费试用权限 */
    freeTrialPrivilege: FreeTrialPrivilege;
    /** 权利来源 */
    rightSource: number;
    /** 收费信息列表 */
    chargeInfoList: ChargeInfo[];
    /** 响应代码 */
    code: number;
    /** 消息 */
    message: null | string;
}

/**
 * 收费信息类型
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

/**
 * 免费试用权限类型
 */
export interface FreeTrialPrivilege {
    /** 资源是否可消费 */
    resConsumable: boolean;
    /** 用户是否可消费 */
    userConsumable: boolean;
    /** 听歌类型 */
    listenType: null | any;
    /** 无法收听原因 */
    cannotListenReason: null | any;
    /** 播放理由 */
    playReason: null | any;
    /** 免费限制标签类型 */
    freeLimitTagType: null | any;
}