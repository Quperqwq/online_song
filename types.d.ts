/**歌曲列表 - 歌曲数据 */
interface SongListData {
    /**歌曲标题 */
    title: string
    /**歌曲源 */
    src: string;
    /**歌手 */
    singer: string | null
    /**歌曲封面 */ 
    cover: string | null
    /**歌曲总时长 */
    time: number
    /**歌曲歌词 */
    lyric: string | null
}

/**歌曲列表 - 歌曲信息 */
interface SongListInfo {
    /**歌曲ID */
    id: number
    /**点歌时间 */
    ctime: number
}

/**歌曲列表 - 点歌人信息*/
interface SongListOrder {
    /**点歌人名称 */
    name: string
    /**点歌人UID */
    uid: number
    /**点歌人头像 */
    avatar: string
}

/**歌曲条目 */
export interface SongItem {
    /**歌曲数据 */
    data: SongListData
    /**歌曲相关信息 */
    info: SongListInfo
    /**点歌者相关信息 */
    order: SongListOrder
}

/**歌曲列表 */
export type SongList = SongItem[]


/** 用户文件内容 */
interface UserFileContent {
    /** 所有注册用户数据 */
    users: Record<number, UserData>
    /** 关于注册用户文件或UID信息 */
    info: UserFileInfoContent
    /** 所有注册用户登入信息 */
    login: Record<number, UserLogin>
}

/** 注册用户文件信息 */
interface UserFileInfoContent {
    /** 文件版本 */
    ver: string
    /** 文件创建时间 */
    ctime: number
    /** 文件上次修改时间 */
    mtime: number
    /** 上一个用户的UID(通常用于注册新用户) */
    last_uid: number
}

/** 用户登入信息 */
interface UserLogin {
    /** 登入凭证; 区别于 `UserData.verify.token` */
    token: string
    /** 随机值 */
    slat: string
    /** 用户ID */
    id: number
    /** 登入时间 */
    time: number
}

/** 用户信息标准格式 */
interface UserData {
    /** 用户信息 */
    profile: UserProfile
    /** 用户验证信息 */
    verify: UserVerify
    /** 用户权限 */
    role: UserRole
    /** 关于用户 */
    info: UserInfo
}

/** 用户信息 */
interface UserProfile {
    /** 昵称 */
    name: string
    /** 密码 */
    password?: string
    /** 邮箱 */
    email: string | null
    /** 头像地址 */
    avatar: string | null
    /** UID */
    id: number
}

/** 用户验证信息 */
interface UserVerify {
    /** 用户身份验证信息; 区别于 `UserLogin.token` */
    token: string
    /** 随机值 */
    salt: string
}

/** 用户权限 */
interface UserRole {
    /** 是否在播放 */
    playing: boolean
    /** 是否可以点歌 */
    order: boolean
    /** 是否为管理员 */
    admin: boolean
}

/** 关于用户 */
export interface UserInfo {
    /** 创建时间 */
    ctime: number
    /** 修改时间 */
    mtime: number
    /** 上次登入时间(非临时登入) */
    login_time: number
}



/**`page-player`页面内播放列表条目 */
interface DocPlayerDOMListItem {
    /**(li)根元素 */
    root: Element

    /**歌曲信息 */
    item: {
        title: Element
        singer: Element
    }

    /**点歌者信息 */
    info: {
        number: Element
        avatar: Element
        name: Element
    }
}

/**`page-player`页面播放列表 */
export type DocPlayerDOMList = DocPlayerDOMListItem[]