// 导入模块
import fs from 'fs' // 文件系统
import path from 'path' // 路径

import fetch from 'node-fetch' // fetch网络API
import mime from 'mime' // 文件mime类型
import crypto from 'crypto'


// 初始化常量
const __dirname = process.cwd()
const __salt = '3d93bbd10a66ea6ad85bc39434c5f677' // 定义特征值用于对token生成的唯一性



// 初始化配置
export const config = {
    /**设置显示语言 */
    lang: 'zh-CN',
    /**静态文件路径 */
    static_path: './src/static',
    /**用户头像存放路径 */
    user_avatar_path: './src/static/avatar',
    /**(APP)HTML路径 */
    html_path: './src/html',
    /**(APP)语言模板文件路径 */
    lang_file: './lang.json',
    /**(User)用户信息存储路径 */
    user_file: './user.json',

    /**静态文件路由路径 */
    static_url: '/src',
    /**(Player)默认封面地址 */
    normal_cover_url: '/src/image/normal_cover.webp',
    /**(User)默认头像 */
    normal_avatar: '/src/avatar/normal.webp',
    /**(User)登入有效期`秒` */
    login_valid_time: 2678400,
    /**允许请求内容最大的大小 */
    req_max_size: '2mb',

    /**(Player)是否为本地模式 */
    local_music_mode: true,
    /**(Player)本地模式下音乐存放到文件系统的路径 */
    local_music_path: './local_music',
    /**(Player)音乐文件对应的HTTP服务路由位置 */
    local_music_url: '/music',

    /**(APP)设置HTML模板文件头部内容 */
    html_head_cont: `<link rel="stylesheet" href="/src/picnic.css" data-tip="picnic css库">\n<script src="/src/common.js"></script>\n<link rel="stylesheet" href="/src/common.css">`,

    /**(User)初始化后的admin账户 */
    admin_user: {
        name: 'admin',
        password: '12345678',
        avatar: null
    },

    /**(User)访客账户 @type {UserData} */
    guest_user: {
        'profile': {
            'avatar': null,
            'email': null,
            'id': -1,
            'name': 'Guest',
            'password': null
        },
        'info': {
            'ctime': -1,
            'mtime': -1
        },
        'role': {
            'admin': false,
            'order': false,
            'playing': false
        },
        'verify': {
            'token': ''
        }
    },

    /**非登入用户可访问的路由(可使用通配符) */
    guest_routes: ['/profile', '/', '/dev', '/src/*', '/api'],

    /**最大打印POST访问信息的字符串长度 */
    print_access_max_length: 100,
}




/** 控制台字体颜色预设*/
const colors = {
    /**重设背景色*/
    reset_background: '\x1b[49m',
    /**重设样式,一般用于文本最后*/
    reset: '\x1b[0m',
    /**设置字体高亮*/
    bright: '\x1b[1m',
    /**设置字体变暗*/
    dim: '\x1b[2m',
    /**设置字体下划线*/
    underscore: '\x1b[4m',
    /**设置字体闪烁*/
    blink: '\x1b[5m',
    /**设置字体反色*/
    reverse: '\x1b[7m',
    /**设置字体隐藏*/
    hidden: '\x1b[8m',
    font: {
        /**黑色*/
        black: '\x1b[30m',
        /**红色*/
        red: '\x1b[31m',
        /**绿色*/
        green: '\x1b[32m',
        /**黄色*/
        yellow: '\x1b[33m',
        /**蓝色*/
        blue: '\x1b[34m',
        /**洋红色*/
        magenta: '\x1b[35m',
        /**青色*/
        cyan: '\x1b[36m',
        /**白色*/
        white: '\x1b[37m',
        /**灰色*/
        gray: '\x1b[90m'
    },
    background: {
        /**黑色*/
        black: '\x1b[40m',
        /**红色*/
        red: '\x1b[41m',
        /**绿色*/
        green: '\x1b[42m',
        /**黄色*/
        yellow: '\x1b[43m',
        /**蓝色*/
        blue: '\x1b[44m',
        /**洋红色*/
        magenta: '\x1b[45m',
        /**青色*/
        cyan: '\x1b[46m',
        /**白色*/
        white: '\x1b[47m',
        /**灰色*/
        gray: '\x1b[100m'
    }
}

// 定义app相关的内容
class App {
    /**对象是否已初始化 */
    isInit = false
    /**是否启用调试(启用调试将打印所有级别日志) */
    debug_mode = false
    /**是否启用测试模式(启用测试模式时不会运行HTTP服务) */
    test_mode = false
    /**项目名称 */
    name = 'online song'
    /**默认继承到HTML模板内头部的内容('__html_head'值) */
    html_head_cont = config.html_head_cont
    /**参数对应的命令 */
    param_command = {
        start: () => { this.debug_mode = false },
        debug: () => { this.debug_mode = true },
        test: () => { this.test_mode = true; this.debug_mode = true },
        /**指定服务器运行在哪个端口 */
        port: (server_port = 5000) => {
            this.prot = server_port
            app.info('change_port', server_port)
        },
        host: (server_host = '0.0.0.0') => {
            this.host = server_host
            app.info('change_host', server_host)
        }
        /**指定语言 */
        // lang: (local_lang = 'zh-CN') => {
        //     if (this.isValidLang(local_lang)) {
        //         // 指定的语言有效
        //         this.lang = local_lang
        //         app.info('change_lang', local_lang)
        //     } else {
        //         // 指定的语言无效
        //         app.warn('change_lang_invalid', local_lang)
        //     }
        // }
    }

    /**颜色代码(控制台样式) */
    colors = colors // 这里调用了全局变量,这里是一个object
    /**数据类型对应的颜色代码(控制台样式) */
    color_type = {
        'string': 'green',
        'null': 'yellow',
        'boolean': 'yellow',
        'number': 'yellow',
        'array': 'cyan',
        'function': 'yellow',
        'undefined': 'yellow',
        '_token': 'gray'
    }

    constructor() {
        // 初始化设置项
        /**指定语言(默认) */
        this.lang = config.lang
        this.version = '' // 定义版本
        /**指定服务器端口 */
        this.prot = 5000
        /**指定服务器host */
        this.host = '0.0.0.0'

        // 初始化常见对象
        this.modDate = new Date()


        /* 文本映射(模板字符),以便实现多语言
        *  其中字符串内容'$cont_number$'表示占位符，用于后期字符串替换
        */
        this.template_text = this.readJson(config.lang_file)
        // 这是一个lazy function，用于返回一个指定语言对应的值
        this.text = (key, ...value) => {
            const lang_data = this.template_text[this.lang] // 读取默认语言
            /**
             * 初始化文本,替换占位符
             * @param {string} text 
             * @param {Array} list 
             */
            const formatText = (text, list) => {
                // app.debug(list)
                if (!list) return text
                list.forEach((rep_text, index) => { // 替换文本字符
                    // app.debug(index, rep_text, text)
                    text = text.replace(
                        `$cont_${index}$`,
                        // this.colorFont(rep_text ? rep_text.toString() : '', '', 'white'), // 如果需要替换值背景色 取消注释
                        rep_text ? rep_text.toString() : '', // 如果需要替换值背景色 注释这个
                    )
                })
                return text
            }

            if (lang_data) { // 如果包含支持的语言，这个函数按期望返回值
                this._text = lang_data
                this.text = (key, ...value) => {
                    const result_text = this._text[key]
                    return result_text ? formatText(result_text, value) : `${key}: ${value}[template error:key not found]`
                }
            } else { // 如果不包含支持的语言，这个函数只返回key的值
                this.text = (key, ...value) => { return `${key}: ${value}[template error:unsupported languages]` }
            }
            return this.text(key, ...value)
        }

        this.isInit = true
    }

    // 控制台日志相关
    /**
     * 将字符转转换为在控制台打印的彩色字体
     * @param {string} str 输入字符串
     * @param {string | undefined} font_color 字体颜色
     * @param {string | undefined} back_color 背景颜色
     */
    colorFont(str, font_color = void 0, back_color = void 0) {
        const color_code_font = colors.font[font_color]
        const color_code_back = colors.background[back_color]

        return `${color_code_font ? color_code_font : ''}${color_code_back ? color_code_back : ''}${str}${colors.reset}`
    }
    /**
     * (this.colorFont)将字符转转换为在控制台打印类型对应彩的色字体
     * @param {any} value 传入任意对象
     */
    colorFontType(value) {
        let type = typeof value
        if (Array.isArray(value)) type = 'array'

        let color_code = this.color_type[type]
        color_code = color_code ? color_code : ''

        let text = ''
        if (value === null | type === 'undefined') { // null特殊处理
            const _type = type === 'undefined' ? 'undefined' : 'null'
            text = _type
            color_code = this.color_type[_type]
        } else {
            text = value.toString()
        }

        text = this.colorFont(text, color_code)
        if (type === 'string') { // 对于string加入引号
            const _token = this.colorFont('\'', this.color_type['_token'])
            text = _token + text + _token
        }
        if (type === 'array') { // 对于Array加入中括号
            text = this.colorFont('[', this.color_type['_token']) + text + this.colorFont(']', this.color_type['_token'])
        }

        return text
    }
    /**向控制台打印debug日志 */
    debug(...value) {
        if (this.debug_mode) {
            if (!Array.isArray(value)) { value = [value] }
            console.debug(
                `${colors.font.gray}${this.date()} [DEBUG]`, ...value, colors.reset
            )
        }
    }
    /**向控制台打印日志 */
    log(...value) {
        if (!Array.isArray(value)) { value = [value] }
        console.log(`${colors.font.gray}${this.date()} `, ...value, colors.reset)
    }
    /**向控制台打印信息;key是一个对应在语言模板的键,value是对应语言模板的值 */
    info(key = '', ...value) {
        console.log(
            this.colorFont(`${this.date()} [INFO] ${this.text(key, ...value)}`, 'black')
        )
    }
    /**向控制台打印警告信息;key是一个对应在语言模板的键,value是对应语言模板的值 */
    warn(key = '', ...value) {
        console.warn(
            this.colorFont(`${this.date()} [WARN] ${this.text(key, ...value)}`, 'yellow')
        )
    }
    /**向控制台打印错误信息;key是一个对应在语言模板的键,value是对应语言模板的值 */
    error(key = '', ...value) {
        console.error(
            this.colorFont(`${this.date()} [ERRO] ${this.text(key, ...value)}`, 'red')
        )
    }
    /**获取错误对象;key是一个对应在语言模板的键,value是对应语言模板的值 */
    throwError(key = '', ...value) {
        return new Error(this.text(key, ...value))
    }
    /** 在控制台打印对象*/
    logObj(obj) { this.log(this.objToStr(obj)) }

    // 工具函数相关...
    /**
     * 语言是否有效
     * @param {string} lang_name 语言名
     * @returns {boolean}
     */
    isValidLang(lang_name) {
        return lang_name in this.template_text
    }

    /**
     * 字符串是否为有效URL
     * @param {string} url 传入URL
     */
    isValidURL(url) {
        // 尝试解析URL 如果解析失败那就是非URL字符串
        try {
            new URL(url)
            return true
        } catch (err) {
            return false
        }
    }
    
    /**
     * 判断一个值是否有效
     * @param {any} value 指定值
     */
    isValidValue(value) {
        if (Array.isArray(value)) {
            if (value.length <= 0) return false
        }
        if (this.isObj(value)) {
            if (Object.keys(value).length <= 0) return false
        }

        return Boolean(value)
    }

    /**
     * 格式化一个路径
     * @param {string | Array.<string>} path 需要格式化的路径
     * @param {boolean} _array 是否需要返回数组
     */
    formatPath(path, _array = false) {
        if (!path) return _array ? [] : ''
        if (Array.isArray(path)) {
            let new_path = ''
            path.forEach((path_item) => {
                new_path += `/${path_item}`
            })
            path = new_path
        }
        let dir_list = path.split(/[//|\\]/g)
        /**@type {string[]} */
        let path_list = []
        dir_list.forEach((dir) => {
            if (!dir) return
            if (dir === '..') {
                path_list.pop()
                return
            }
            dir = dir.toLowerCase()
            path_list.push(dir)
        })
        return _array ? path_list : path_list.join('/')
    }

    /**
     * 检查两个路径是否指向一致
     * @param {string} path 路径
     * @param {string} rel_path 对比路径
     */
    isRepeatPath(path, rel_path) {
        const format = this.formatPath
        return format(path) === format(rel_path)
    }

    /**
     * 是否是比对目录的子目录
     * @param {string} root_path 根路径
     * @param {string} rel_path 对比路径
     */
    isSubPath(root_path, rel_path) {
        const format = this.formatPath
        const root = format(root_path)
        const rel = format(rel_path)

        return rel.slice(0, root.length) === root
    }

    /**
     * 转换为URL编码格式的字符串
     * @param  {...any} str 
     */
    toUrlStr(...str) {
        let encode_str = ''
        str.forEach((item_str) => {
            const _str = encodeURIComponent(item_str)
            encode_str += _str
        })
        return encode_str
    }

    /**
     * 使用通配符匹配
     * (i)该代码使用了生成式AI
     * @param {string} pattern 包含通配符的字符串
     * @param {string} path 需要匹配的字符串
     */
    matchPath(pattern, path) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
        return regex.test(path)
    }


    /**
     * 判断一个值是不是非数组的对象
     * @param {any} obj 传入参数
      */
    isObj(obj) {
        const type = typeof obj
        return type === 'object' && !(obj === null) && !Array.isArray(obj)
    }

    /**
     * 获取字符串格式的时间以便阅读
     * @returns {string}
     */
    date() {
        // return this.modDate.toLocaleString()
        return new Date().toLocaleString()
    }

    /**
     * 获取时间戳
     */
    getTime() {
        // return this.modDate.getTime() // 容易触发缓存机制
        return new Date().getTime()
    }

    /**
     * 读取文件内容(内置模块功能封装)
     * @param {string} file_name 需要读取的文件目录
     * @param {function(string|undefined)=} [callback=undefined] 回调函数;如果值不存在则这个函数是同步函数,若这个值是合法的函数对象则是异步函数,将返回的参数作为回调函数的参数
     * @returns {string|undefined} 如果 callback 参数不存在,则返回文件内容字符串;否则返回 undefined
     */
    readFile(file_name, callback = void 0) {
        let cont
        try { // 尝试读取
            cont = fs.readFileSync(file_name, 'utf-8') // 读取文件采用默认编码
        } catch (err) { // 读取出现错误时打印错误并返回undefined
            this.isInit ? app.error('try_read_file_error', err) : console.error(err) // 打印错误信息
        }
        return callback ? callback(cont) : cont
    }

    /**
     * 读取Json文件为object
     * @param {string} file_name 需要读取的文件目录
     * @param {function(string|undefined)=} [callback=undefined] 回调函数
     * @returns {object|undefined} 如果 callback 参数不存在,则返回文件内容对象;否则返回 undefined
     */
    readJson(file_name, callback = void 0) {
        let returns
        try {
            this.readFile(file_name, (cont) => {
                const obj = JSON.parse(cont)

                returns = callback ? callback(obj) : obj
            })
        } catch (err) {
            return callback ? callback(undefined) : undefined
        }

        return returns
    }

    /**
     * 写入文件(内置模块功能封装)
     * @param {string} file_name 传入文件名
     * @param {string | Buffer} data 需要写入的内容
     * @param {function | undefined} callback 回调函数
     * @returns {boolean} 是否写入成功
     */
    writeFile(file_name, data, callback = void 0) {
        let valid = true
        try {
            fs.writeFileSync(file_name, data, 'utf-8')
        } catch (err) {
            this.error('try_write_file_error', err)
            valid = false
        }
        return callback ? callback(valid) : valid
    }

    /**
     * 写入对象到Json文件
     * @param {string} file_name 传入文件名
     * @param {object} data 需要写入的对象
     * @param {function | undefined} callback 回调函数
     * @returns {boolean} 是否成功
     */
    writeJson(file_name, data, callback = void 0) {
        if (!(path.extname(file_name).toLowerCase() === '.json')) { // 若文件名非json则判定为无效
            return false
        }
        const returns = this.writeFile(file_name, JSON.stringify(data))
        return callback ? callback(returns) : returns
    }

    /**
     * 下载文件到本机; 若没有给定`ext_name`值下载的文件名将会是`{download_path}.{ext_name}`
     * (i) 注意:这段代码部分由AI提供生成;
     * @param {{url: string, download_path: string, ext_name: string}} param0 传入基本参数; `URL`: 文件的链接; `download_path`: 需要下载到本机的路径或指定下载的文件名; `ext_name`: 指定文件扩展名, 若未指定则认定为download_path是文件名
     * 
     * @param {function(string)=} callback 下载操作成功后会返回文件的散列值, 若失败会返回空字符串
     * 
     * @returns {undefined | string}
     * 
     * @example
     * const app = new App()
     * app.downloadFile({
     *  url: 'http://example.com/audio.mp3',
     *  download_path: './dir/filename.mp3'
     * }, (hash) => {
     *  app.log(hash_value) // 文件下载成功, 打印出文件的哈希值
     * })
     */
    downloadFile({ url, download_path, ext_name }, callback) {
        /**
         * 获取预设返回内容
         * @param {any} value 返回值
         * @param {any} err 错误信息
         */
        const returns = (value, err = '', index = void 0) => {
            // app.debug('returns index:', index)
            if (err) {
                app.error('try_download_file_error', url, err)
                app.debug('^^^ url:', url, ',download_path:', download_path, ',ext_name:', ext_name)
            }

            // return typeof callback === 'function' ? callback(value) : value
            return callback(value)
        }
        let is_hash_name = false
        if (ext_name) {
            ext_name = ext_name.replace('.', '')
            is_hash_name = true
        }


        // 校验给定参数是否有效
        const file_stat = app.getFileStat(is_hash_name ? download_path : path.dirname(download_path))

        const file_valid = is_hash_name ? file_stat.isDirectory() : file_stat.isDirectory()// 给定了文件扩展名 则download_path路径部分必须为路径; 没有给定文件扩展名 则download_path必须为路径
        if (!file_valid) return returns('', `'${file_stat}' is not dir or file`, '365')

        fetch(url) // 创建一个fetch请求
            .then((response) => { // 处理响应内容
                // 判断文件类型
                const res_type = response.headers.get('Content-Type').split(';')[0] // 获取响应类型
                const save_type = mime.getType(is_hash_name ? ext_name : download_path) // 获取保存文件名的mime值

                if (save_type !== res_type) { // 如果保存类型不是响应类型则判定为请求失败
                    return returns('', `the response type is '${res_type}', but the save file name type is '${save_type}'`, '375')
                }
                if (response.status !== 200) { // 如果响应码不是200则判定为请求失败
                    return returns('', `status code: ${response.status}`, '379')
                }



                // 响应有效
                let save_name = download_path // 初始化保存为的名称
                let file_hash = '' // 初始化文件哈希值
                let data_buffer = [] // 设置内容缓冲区


                response.body.on('data', (chunk) => { // 将内容暂存到缓冲区
                    data_buffer.push(chunk)
                })
                response.body.on('finish', () => { // 缓存完成
                    const data = Buffer.concat(data_buffer) // 获取data

                    const hash = crypto.createHash('sha256') // 创建一个哈希流 用于计算文件的散列值
                    hash.write(data) // 连接到哈希计算流
                    file_hash = hash.digest('hex') // 获取哈希值
                    if (is_hash_name) save_name = path.join(save_name, file_hash + '.' + ext_name) // 需要获取散列值 更改save_name为 path/hash.ext_name

                    if (this.getFileStat(save_name).isFile() && is_hash_name) { // 如果文件已经存在且是哈希文件名则不需要再保存
                        app.debug(`download file '${save_name}' is exist, hash is '${file_hash}'`)
                        return returns(file_hash)
                    }

                    // 开始写入文件到文件系统
                    const write = fs.createWriteStream(save_name) // 创建一个写入流 用于写入文件
                    write.write(data, (err) => { // 写入文件
                        if (err) return returns('', err, '413') // 写入文件出现错误

                        // 写入文件成功
                        app.debug(`download file '${save_name}' ok, hash is '${file_hash}'`)
                        return returns(file_hash)
                    })
                })
            })

            .catch((err) => { // 捕获错误并打印日志
                return returns('', err, '424')
            })
    }

    /**
     * 获取文件信息(使用fs.statSync方法,捕获了报错)
     * @param {string} file_name 需要获取的文件目录
     * @param {function(fs.Stats|undefined)=} [callback=undefined] 回调函数
     * @returns {fs.Stats|undefined} 如果文件不存在或指定了回调函数则返回undefined
     */
    getFileStat(file_name, callback = void 0) {
        let file_stat
        try {
            file_stat = fs.statSync(file_name)
        } catch (err) {
            file_stat = undefined
        }
        // try {
        //     file_stat = fs.statSync(file_name)
        // } catch (err) {
        //     this.isInit ? app.error('try_read_file_error', err) : console.error(err) // 打印错误信息
        // }
        if (!file_stat) {
            file_stat = {}
            file_stat.isDirectory = () => { return false }
            file_stat.isFile = () => { return false }
        }
        return callback ? callback(file_stat) : file_stat
    }

    /**
     * 获取静态文件的路由
     * @param {string} path 文件在静态路由内的路径
     * @returns {string} 
     */
    getStaticURL(path) {
        const arr_path = this.formatPath([config.static_url, path], true)
        return `/${arr_path.join('/')}`
    }

    /**
     * 获取用户头像的绝对路径
     * @param {string} filename 用户头像的文件名
     */
    getUserAvatarPath(filename) {
        return path.join(__dirname, config.user_avatar_path, filename)
    }

    /**
     * 获取一个字符串的哈希
     * @param {string} str 传入需要获取哈希的字符串
     * @param {'sha256' | 'sha512' | 'md5' | 'sha1'} type 获取的类型
     */
    getStrHash(str, type = 'sha256') {
        return crypto.createHash(type).update(str).digest('hex')
    }

    /**
     * 获取一个16进制的随机数
     * @param {number} length 长度
     */
    getRandomHex(length) {
        const bytes = Math.ceil(length / 2) // 每个字节生成两个十六进制字符
        const randomBytes = crypto.randomBytes(bytes)
        return randomBytes.toString('hex').slice(0, length) // 截取到指定长度
    }

    /**
     * (regex)基础渲染模板引擎
     * @param {string} template 模板内容
     * @param {object} data 模板数据
     * 
     * @example
     * app.renderTemplate('hello, my name is {{ name }}.', {name: 'Quper'}) // hello, my name is Quper.
     */
    renderTemplate(template, data) {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
            // 从 data 对象中获取对应的值并返回
            return data[key] === undefined ? '' : data[key]
        })
    }

    /**
     * (regex)根据格式渲染彩色字体
     * @param {string} str 指定字体
     * 
     * @example
     * // ...
     * app.renderColorText('[[red]]test') // test
     */
    renderColorText(str) {
        const font_color = colors.font
        const text = str.replace(/\[\[\s*(\w+)\s*\]\]/g, (_, key) => {
            return font_color[key] === undefined ? '' : font_color[key]
        })
        return text + colors.reset
    }

    /**
     * 将对象转换为可读性强字符串样式
     * @param {Object} obj 传入对象
     * @param {object} [param1]
     * @param {string} [param1.title] 显示样式上根的标题
     * @param {string} [param1.indent='    |-'] 缩进内容
     * @param {number} [param1.rep_indent=1] 缩进内容重复次数
     * @param {boolean} [param1.no_color=false] 是否不启用控制台颜色
     */
    objToStr(obj, { title = undefined, rep_indent = 1, indent = ' |-', no_color = false } = {}) {
        if (!(typeof obj === 'object')) {
            app.warn('consol_invalid_param', obj)
        }
        title = title ? '\n' + title : ''
        let line = [''] // 初始化line数组用于存储每一行内容 (PS:留下一个空字符串用于首行换行)
        Object.keys(obj).forEach((key) => { // 遍历整个对象
            let value = obj[key]

            let cont = `${key}: ` // 初始化该行内容
            if (this.isObj(value)) { // 判断是否对象, 形似分支的操作
                // app.debug('is obj:', value)
                cont += this.objToStr(value, { rep_indent: rep_indent + 1, indent: indent, no_color: no_color }) // 将对象再转换
            } else { // not对象
                if (!(value === null || value === undefined)) {
                    value = value.replace ? value.replace('\n', '\\n') : value // 转义转义换行, 如果不是字符串返回原值
                }
                // app.debug(value, typeof value)
                cont += no_color ? value : this.colorFontType(value) // 调用方法来染色类型对应的字体颜色

            }
            line.push(cont)
        })  // ~ 漂亮滴很呐!(赞赏)
        const cont = title + line.join(`\n${indent.repeat(rep_indent)}`)
        return (no_color ? '' : colors.reset) + cont
    }


    // 路由中间函数相关...
    /**
     * (Express)用于路由函数,返回获取到的HTML文件值到客户端
     * @param {string} file_name HTML文件名(定义在config路径的相对路径)
     * @param {Request} req Request值
     * @param {Response} res Response值
     * @param {object | undefined} data 传入到网页的键值对用于模板替换
     * @param {boolean} [is_meat_data=false] 是否创建meat以传递数据
     */
    returnHTML(file_name, res, data = {}, is_meat_data = false) {
        /**头部元素 */
        let head_cont = `${this.html_head_cont}\n`

        /**创建网页的meat元素用于传递数据 */
        const createMeatElement = (name, data) => {
            // /(TAG)传递数据的meat元素/ 在这里创建
            return `<meta name="data-${name}" content="${data}">\n`
        }
        /**向`head_cont`后添加数据 */
        const appendMeats = (obj) => {
            Object.keys(obj).forEach((key) => {
                const value = obj[key]
                head_cont += createMeatElement(key, value)
            })
        }
        // 读取HTML文件内容
        res.set('Content-Type', 'charset=utf-8')
        this.readFile(path.join(__dirname, config.html_path, file_name), (html_cont) => {
            if (!html_cont) { // HTML文件不存在
                res.status(500)
                res.type('text')
                res.send(`file '${file_name}' not found the server.`)
                app.error('file_not_found', file_name)
                return
            }

            // HTML文件存在

            res.type('HTML')

            // 来自中间件传输的预传入内容
            const pre_data = res.locals.pre_data
            if (pre_data) { // 如果有预传入内容
                appendMeats(pre_data)
            }

            // 是否是meat数据
            if (is_meat_data) {
                appendMeats(data)
                html_cont = this.renderTemplate(html_cont, {
                    '__html_head': head_cont
                })
            } else {
                data.__html_head = head_cont
                html_cont = this.renderTemplate(html_cont, data)
            }
            res.send(html_cont) // 进行模板渲染
            res.end()
        })
        // this.printAccess(req, res) // 打印访问日志
        return
    }

    /**
     * 打印访问日志
     * @param {Request} req Request值
     * @param {string} [msg] 对于这条日志的补充信息
     */
    printAccess(req, msg) {
        const color = this.colorFont
        const new_line = '\n        '
        let more_info = ''
        if (req.method === 'POST') {
            const max_len = config.print_access_max_length
            more_info = '| data: ' + new_line + (this.isObj(req.body) ? JSON.stringify(req.body) : req.body)
            if (more_info.length >= max_len) {
                more_info = more_info.slice(0, max_len) + '...'
            }
        }

        let message = ''
        if (msg) {
            message = '| ' + msg
        }
        app.log( // 打印访问日志
            color(req.ip, 'blue'),
            color(req.method, 'green'),
            color(req.url, 'gray'),
            color(`HTTP/${req.httpVersion}`, 'yellow'),
            message,
            more_info,
        )
    }
    /**
     * 抛出错误
     * @param {string} message 
     */
    onError(message) { throw new Error(`${message}`) }

    /**
     * (Express)获取上下文的user实例
     * @param {Response} res 
     * @returns {undefined | User}
     */
    getLoginUser(res) {
        const user = res.locals.user
        if (!user.is_login) return
        
        return user
    }

    // /**
    //  * (Express)结束这次访问, 通常用于错误请求的结束访问; 在错误状态码下会返回错误提示页面
    //  * @param {Response} res 
    //  * @param {number} [status] 指定状态
    //  * @param {string} [to_url] 4xx状态码下跳转到哪个URL
    //  * @param {string} [type] 指定显示提示信息
    //  */
    // endReq(res, status = 403, to_url, type = 'unknown') {
    //     let need_page = false
    //     if (Number.toString(status).startsWith('4')) { // 4xx
    //         need_page = true
    //     }


    //     if (need_page) { // 在错误状态码渲染页面
    //         this.returnHTML('4xx.html', res, {
    //             'status': status,
    //             'type': type,
    //             'to': to_url
    //         }, true)
    //     }
    //     res.status(status)
    //     res.end()
    // }

    /**
     * (Express)返回客户端错误请求的页面
     * @param {Response} res 
     * @param {number} status 响应码
     * @param {string} type 错误类型(传递到页面)
     * @param {string} to_url 跳转到的url
     */
    badReq(res, status = 403, type = 'unknown', to_url = '/') {
        this.returnHTML('4xx.html', res, {
            'status': status,
            'type': type,
            'to': to_url
        }, true)
        res.status(status).end()
    }
}


class Player {
    list = []
    /**
     * @typedef {Object} Song
     * @property {SongData} data
     * @property {SongInfo} info
     * 
     * @typedef {Object} SongData - 歌曲数据
     * @property {string} title - 歌曲标题
     * @property {string} src - 歌曲源
     * @property {string | null} singer - 歌曲歌手
     * @property {string | null} cover - 歌曲封面源
     * @property {number} time - 歌曲总时长(秒)
     * @property {number | null} lyric - 歌曲歌词内容
     * 
     * @typedef {Object} SongInfo - 点歌相关信息
     * @property {number} id - 歌曲ID
     * @property {string} name - 点歌人
     * @property {number} ctime - 点歌时间
     */
    /**
     * 构建一个播放器
     * @param {boolean} local_mode 是否启用本地模式(本地模式将缓存歌曲URL)
     * @param {string} static_path 缓存音乐存放路径
     * @param {string} static_url 指定访问音乐文件在服务器的路由根路径
     * 
     */
    constructor(
        local_mode = config.local_music_mode,
        static_path = config.local_music_path,
        static_url = config.local_music_url
    ) {
        if (!app.getFileStat(static_path).isDirectory()) throw app.throwError('error_value_is_invalid', static_path) // static_path必须为路径

        /**本地模式 */
        this.local_mode = local_mode
        /**缓存音乐存放路径 */
        this.static_path = static_path
        /**音乐路由的根路径 */
        this.static_url = static_url

    }

    /**
     * 向播放列表添加歌曲
     * 
     * @param {SongData} song_data 传入歌曲信息
     * 
     * @param {function(string)=} callback 当为local_mode的时候会调用callback返回是否成功
     * @param {string} order_name 传入点歌者信息
     * @returns {string | undefined} 返回错误信息, 若没有问题则会为空字符串
     */
    push(song_data, order_name, callback) {
        const returns = (value) => { return this.local_mode ? callback(value) : value }
        const valid = (value, normal = null) => { return value ? value : normal }
        if (!(song_data.title && song_data.src)) { // 检查必要参数
            app.warn('missing_param', this.push.name, song_data)
            return returns('missing_param')
        }
        const push = () => { // 临时定义函数用于兼容异步函数
            if (!Player.list) Player.list = []
            const song_id = Player.list.length
            /**@type {Song} */
            const push_data = {
                data: {
                    'cover': valid(song_data.cover),
                    'singer': valid(song_data.singer),
                    'src': song_src,
                    'time': valid(song_data.time, 0),
                    'title': song_data.title,
                    'lyric': valid(song_data.lyric)
                },
                info: {
                    'id': song_id,
                    'name': valid(order_name),
                    'ctime': app.getTime()
                }
            }
            Player.list.push(push_data) // 将播放歌曲的信息push到Player.list对象中
            // 打印新歌信息
            app.info('push_song', app.objToStr(push_data.data, { title: `song_data[${song_id}]` }), song_id, push_data.info.name)
        }


        let song_src = song_data.src
        if (this.local_mode) { // 如果是本地模式先将远程文件保存到文件系统
            if (!callback) throw app.throwError('error_value_is_invalid', callback)
            app.debug('Player: local mode, download music.')
            app.downloadFile({
                'download_path': this.static_path,
                'ext_name': 'mp3',
                'url': song_src
            }, (hash) => {
                if (!hash) { // 如果无效
                    return callback('url_is_invalid')
                }
                song_src = this.static_url + '/' + hash + '.mp3'
                // app.log(song_src)
                push()
                return callback('')
            })
        } else { // 如果非本地模式直接添加
            push()
            return returns('')
        }

    }

    /**
     * 检查该源是否存在于播放列表中
     * @param {string} src 歌曲源链接
     */
    isExits(src) {
        Player.list.forEach((item) => { // 遍历播放列表,如果存在该源直接返回true
            if (item.data.src === src) return true
        })
        return false
    }

    /**
     * 获取音乐文件的内容(local_mode下)
     * @param {string} file_name 
     * @returns {Buffer | null} 如果文件不存在或非local_mode下则返回null
     */
    getMusicBuffer(file_name) {
        if (!this.local_mode) return null
        const music_path = this.getMusicPath(file_name)
        return fs.readFileSync(music_path)
    }

    /**
     * 获取音乐文件在文件系统的路径
     * @param {string} file_name 传入文件名
     * @returns {string} 获取到的路径, 如果文件不存在则返回空字符串
     */
    getMusicPath(file_name) {
        const music_path = path.join(__dirname, this.static_path, file_name)
        // app.log(music_path)
        if (!app.getFileStat(music_path).isFile()) return ''
        return music_path
    }

    getMusicList(keyword) { }
}


export class User extends Player {
    /**登入有效时间 */
    login_valid_time = config.login_valid_time
    /**
     * @typedef {Object} UserFileContent 注册用户文件内容
     * @property {Object<number, UserData>} users 所有注册用户数据
     * @property {UserFileInfoContent} info 关于注册用户文件或UID信息
     * @property {Object<number, UserLogin>} login 所有注册用户登入信息
     * 
     * @typedef {Object} UserFileInfoContent
     * @property {string} ver 文件版本
     * @property {number} ctime 文件创建时间
     * @property {number} mtime 文件上次修改时间
     * @property {number} last_uid 上一个用户的UID(通常用于注册新用户)
     * 
     * 
     * 
     * @typedef {Object} UserLogin
     * @property {string} token 登入凭证;区别于`UserData.verify.token`,该值适用于验证客户端的用户凭证
     * @property {string} slat 随机值
     * @property {number} id 用户ID
     * @property {number} time 登入时间
     * 
     * @typedef {Object} UserData User类内存储用户信息的标准格式
     * @property {UserProfile} profile
     * @property {UserVerify} verify
     * @property {UserRole} role
     * @property {UserInfo} info
     * 
     * @typedef {Object} UserProfile 用户信息
     * @property {string} name 昵称
     * @property {string | undefined} password 密码
     * @property {string | null} email 邮箱
     * @property {string | null} avatar 头像地址
     * @property {number} id UID
     * 
     * @typedef {Object} UserVerify 用户验证信息相关
     * @property {string} token 用户身份验证信息; 区别于`UserLogin.token`,该值是用于校验密码和账户是否一致
     * @property {string} salt 随机值
     * 
     * @typedef {Object} UserRole 用户权限
     * @property {boolean} playing 
     * @property {boolean} order 
     * @property {boolean} admin 
     * 
     * @typedef {Object} UserInfo 关于用户
     * @property {number} ctime 创建时间
     * @property {number} mtime 修改时间时间
     * @property {number} login_time 上次登入时间(非临时登入)
     */
    /**
     * 构建一个User类
     * @param {object} param0 用户信息
     * @param {string | undefined} param0.user_name 用户名
     * @param {number | undefined} param0.id 用户ID
     * @param {string} param0.password 用户密码
     * @param {boolean} param0.is_guest 是否是访客用户 (访客用户不需要密码或client凭证)
     * @param {string | undefined} param0.avatar 用户头像
     * @param {string | undefined} param0.email 用户邮箱
     * @param {string | undefined} param0.client_token client(临时)用户凭证
     * 
     */
    constructor({ user_name, id, password, is_guest = false, avatar, email, client_token } = {}) {
        super() // 构造继承的Player

        /**存储用户数据内容文件 */
        this.user_file = config.user_file
        /**默认头像 */
        this.normal_avatar = config.normal_avatar

        /**是否是访客用户 */
        this.is_guest = false
        if (is_guest) { // 访客用户
            this.profile = config.guest_user.profile // 使用来自配置信息的访客用户信息
            this.is_login = false
            this.is_guest = true
            return
        }

        /**
         * 用户基本信息
         * @type {UserProfile}
         */
        this.profile = {
            name: user_name,
            avatar: avatar,
            email: email,
            id: id,
            password: password
        }

        /**(临时)登入凭证 */
        this.client_token = client_token

        /**是否已登入; 判断是否有效登入: 确保`config.user_file`的用户信息比对一致且算是有效登入*/
        this.is_login = false

        if (!app.getFileStat(this.user_file).isFile()) { // 如果用户信息文件不存在 初始化文件
            this._initData()
            app.info('create_file', this.user_file)
        }
    }

    /**(文件或缓存)获取所有用户数据 @returns {UserFileContent}*/
    get all_data() {
        if (!User.cache_data) {
            User.cache_data = app.readJson(this.user_file)
            if (!User.cache_data) {
                throw app.throwError('error_read_file_invalid', this.user_file)
            }
        }
        return User.cache_data
    }

    /**
     * (all_data)获取所有用户信息
     */
    get all_user() {
        return this.all_data.users
    }

    /**(all_data)获取data的info */
    get data_info() {
        return this.all_data.info
    }

    /**(all_data)获取data的login */
    get all_login_data() {
        if (!this.all_data.login) {
            this.all_data.login = {}
            this.update()
        }
        return this.all_data.login
    }
    
    /**
     * (all_user)获取用户数据
     * @returns {UserData} 
     */
    get user_data() {
        if (!this.is_login || !this.is_guest) app.throwError('not_init_use_method', User.name)
        if (this.is_login) {
            return this.all_user[this.profile.id] // 正常登入的账户从`all_data`中获得数据
        } else {
            return config.guest_user // 其他账户返回访客登入信息
        }
    }

    /**(user_data)获取用户profile信息 */
    get user_profile() {
        return this.user_data.profile
    }

    /**(user_data)获取用户verify信息 */
    get user_verify() {
        return this.user_data.verify
    }

    /**(user_data)获取用户role信息 */
    get user_role() {
        return this.user_data.role
    }

    /**初始化内容 */
    _initData() {
        const time = app.getTime()
        /**@type {UserFileContent} */
        const data = {
            'users': {},
            'info': {
                'ver': app.version,
                'ctime': time,
                'mtime': time,
                'last_uid': 10000
            },
            'login': {}
        }
        if (!this.update(data)) throw app.throwError('error_init_user_file', this.user_file)

        const reg_valid = this.add(config.admin_user, true)
        if (reg_valid) app.warn('error_reg_user', config.admin_user.name, reg_valid)
    }

    /**
     * (Array.forEach)遍历每个用户
     * @param {function(UserData)=} callback 
     */
    forEachUser(callback) {
        return Object.keys(this.all_user).forEach((uid) => {
            const user_data = this.all_data['users'][uid]
            callback(user_data)
        })
    }
    // /**
    //  * (Array.forEach)遍历每个登入信息
    //  * @param {function(UserLogin)=} callback 
    //  */
    // forEachLoginData(callback) {
    //     return Object.keys(this.login_data).forEach((uid) => {
    //         callback(this.login_data[uid])
    //     })
    // }

    /**
     * (文件)更新所有用户用户数据
     * @param {object} value 
     */
    update(value = User.cache_data) {
        if (!app.writeJson(this.user_file, value)) {
            return false
        }
        User.cache_data = value
        return true
    }

    /**
     * 用户信息是否重复
     * @param {object} param0 
     * @param {object} param0.name 用户名称
     * @param {object} param0.id 用户ID
     * @returns {'name_is_exist' | 'uid_is_exist' | ''} 返回哪个值存在于用户列表中
     */
    isExits({ name, id } = this.profile) {
        let text = ''
        this.forEachUser((user_data) => {
            if (user_data.profile.name === name) text = 'name_is_exist'
            if (user_data.profile.id === id) text = 'uid_is_exist'
        })
        return text
    }

    /**
     * 检查一个值是否有效
     * @param {'password' | 'name'} type 判断类型
     * @param {string} value 判断值
     */
    isValid(type, value) {
        const reg = {
            /**特殊字符 */
            special: /[\\\/\*\+\?\.\^\$\|\(\)\[\]\{\}]/,
            /**密码 */
            password: /^[a-zA-Z0-9_]+$/,
            /**全部是数字 */
            all_number: /^\d+$/,
        }
        if (!(typeof value === 'string')) return 'param_invalid'
        switch (type) {
            case 'name':
                // /(TAG)校验用户名/
                if (reg.special.test(value)) return 'name_have_special_char'
                if (value.length < 4) return 'name_too_short'
                if (value.length > 12) return 'name_too_long'
                if (reg.all_number.test(value)) return 'all_number'

                let is_rep = false
                this.forEachUser((user_data) => {
                    if (user_data.profile.name === value) is_rep = true
                })
                if (is_rep) return 'is_repeat'
                break
            case 'password':
                // /(TAG)校验密码/
                if (value.length < 6) return 'password_too_short'
                if (value.length > 16) return 'password_too_long'
                if (!reg.password.test(value)) return 'password_have_special_char'
                break
            default:
                return 'type_not_found'
        }
        return ''
    }

    /**
     * 获取用户的Token用于验证或初始化用户身份验证信息;
     * 
     * 初次获取用户Token成功后会在实例的_token属性中给出_salt值, 后续登入需要给出salt
     * @param {string} uid 用户UID
     * @param {string} password 密码
     * @param {string} salt 随机值; 指定为'__init'为初次获取
     */
    getToken(uid, password, salt) {
        if (!(uid && password && salt)) return ''
        if (salt === '__init') { // 如果指定为__init则将salt值将初始化
            salt = app.getRandomHex(8)
            this._salt = salt
        }
        const plain_token = `${uid}-${password}/${salt}/${__salt}` // 这里的token经过hash计算后得到一个唯一token, token的特征值需要独一无二
        // app.debug('plain_token: ', plain_token)
        return app.getStrHash(plain_token)
    }

    /**
     * 获取一个用户的(临时)登入凭证
     * @param {string} client_token 用户凭证信息
     * @param {string} salt 随机值
     * @returns 
     */
    getLoginToken(client_token, salt) {
        return app.getStrHash(`${client_token}-${salt}`, 'sha256')
    }

    /**
     * 将用户添加到(临时)登入列表内
     * @returns {string} 返回客户端用户凭证
     * 
     * @example
     * const user = new User({'password': 'xxxxxxxx', 'id': 114514})
     * user.add() // 或使用`user.login()`来尝试登入
     * user.addLogin() // 返回UID-Token
     * 
     * user.tokenLogin() // 返回当前token是否有效
     */
    addLogin() {
        if (!this.is_login) return ''
        const uid = this.user_profile.id
        const slat = app.getRandomHex(8)
        const time = app.getTime()

        // /(TAG)登入token生成/
        const client_token = app.getStrHash(`${uid}-${time}`, 'sha256') // client_token是返回到客户端的值 这个值表示用户的凭证 可以用临时登入; 可以理解为随机值

        const token = this.getLoginToken(client_token, slat) // token是保存在服务端的值 这个值用于校验用户的凭证

        this.all_login_data[uid] = {
            'id': uid,
            'slat': slat,
            'token': token,
            'time': time
        }
        this.update()

        return `${uid}-${client_token}`
    }

    /**
     * 使用凭证(临时)登入
     * @param {string} client_token 用户凭证
     */
    tokenLogin(client_token) {
        if (!client_token) return 'value_invalid'
        const _data = client_token.split('-')
        const uid = _data[0]
        client_token = _data[1]
        /**@type {UserLogin} */
        const login_data = this.all_login_data[uid]

        if (!login_data) return 'id_not_exist' // 不存在于登入列表

        const token = this.getLoginToken(client_token, login_data.slat)
        if (!(login_data.token === token)) return 'invalid_token' // token不匹配

        const isExpired = app.getTime() < (login_data.time + (this.login_valid_time * 1000))
        if (!isExpired) return 'expired_token' // token已过期

        return ''
    }

    /**
     * 尝试登入一个用户实例
     * @param {string} [client_token] 登入凭证
     */
    login(client_token) {
        let password = this.profile.password
        let name = this.profile.name
        let id = this.profile.id
        let salt = ''
        

        if (this.is_login) return 'is_login'
        const finish = (method = 'login') => { // 校验成功
            app.debug(app.text('user_login', method))
            app.debug(app.objToStr(user_data, { title: 'user_data' }))
            this.is_login = true
            this.profile = user_data.profile
            const user_avatar = this.profile.avatar
            // (!)判断缺陷
            if (!app.isValidValue(user_avatar)) { // 若没有头像指定为默认头像
                this.profile.avatar = this.normal_avatar
            }
            return ''
        }

        /**@type {UserData} */
        let user_data

        if (client_token) { // 使用凭证登入
            const err = this.tokenLogin(client_token)
            if (err) return err

            // 登入完成
            user_data = this.all_user[client_token.split('-')[0]]
            return user_data ? finish('token') : 'user_not_found'
        }



        // 使用其他登入方式
        if (!((name || id) || password)) return 'lost_param'

        id = +id
        let is_name_login = true
        if (!isNaN(id)) is_name_login = false

        let uid = -1
        let token = ''

        if (is_name_login) { // name登入
            let valid_name = false
            this.forEachUser((item) => {
                // app.log(item.profile.name, name)
                if (item.profile.name === name) {
                    valid_name = true
                    uid = item.profile.id
                    token = item.verify.token
                    salt = item.verify.salt
                    user_data = item
                }
            })
            if (!valid_name) return 'name_not_found'
        } else { // id登入
            user_data = this.all_data.users[id]

            if (!user_data) return 'id_not_found'
            name = user_data.profile.name
            token = user_data.verify.token
            salt = user_data.verify.salt
            uid = id
        }

        // 校验token
        const get_token = this.getToken(uid, password, salt)
        // app.log('pwd:', password, 'id:', uid, 'salt:', salt)

        if (!(get_token === token)) return 'password_error'

        // 校验成功
        this.user_data.info.login_time = app.getTime() // 更新用户上次登入时间
        this.update()
        return finish(is_name_login ? 'user_name' : 'uid')
    }

    /**
     * 尝试注册一个用户实例
     * @param {{name: string, avatar: string, email: string, password: string}} profile 传入用户信息
     */
    add({ name, avatar, email, password } = this.profile, _init = false) {
        // 检测参数是否有效
        /**@type {boolean} 参数是否有效 */
        let param_valid = true

        const params = [name, password]
        params.forEach((value) => {
            if (!((typeof value === 'string') && value)) param_valid = false
        })
        if (!param_valid) return 'lost_param'

        this.data_info.last_uid += 1
        const uid = this.data_info.last_uid
        // 验证 名称|密码 是否有效
        const name_valid = this.isValid('name', name)
        if (name_valid) return name_valid
        const pwd_valid = this.isValid('password', password)
        if (pwd_valid) return pwd_valid
        // 验证 名称|UID 是否有重复
        const is_exist = this.isExits({ name: name, id: uid })
        if (is_exist) return is_exist

        const token = this.getToken(uid, password, '__init')
        if (!token) return 'get_token_error'
        const time = app.getTime()

        // 更新 用户列表 内信息
        const user_role = {// 指定为init的账户给予管理员权限
            'playing': _init ? true : false,
            'order': true,
            'admin': _init ? true : false
        }
        let user_avatar = avatar ? avatar : null
        const user_data = {
            'profile': {
                'name': name,
                'email': email ? email : null,
                'avatar': user_avatar,
                'id': uid
            },
            'verify': {
                'token': token,
                'salt': this._salt
            },
            'role': user_role,
            'info': {
                ctime: time,
                mtime: time,
                login_time: -1
            }
        }
        this.all_user[uid] = user_data
        this.data_info.mtime = time
        this.update()

        app.info('user_register', user_data.profile.name)

        // 更新实例信息
        if (_init) return ''
        
        // app.log(this.login())
        if (this.login()) return 'unexpected'
        return ''
    }

    /**
     * (Player)点一首歌到播放列表
     * @param {SongData} song_data 
     * @param {function(string)=} callback 
     * @returns {string}
     */
    order(song_data, callback) {
        const is_exist = typeof callback === 'function'
        const returns = (value) => {
            if (value === '_func') {
                return is_exist ? callback : undefined
            } else {
                return is_exist ? callback(value) : value
            }
        }


        if (!(this.is_login || this.is_guest)) return returns('not_login')
        if (!this.user_data.role.order) return returns('not_role')
        return this.push(song_data, this.profile.name, returns('_func'))
    }

    /**
     * 更改(新)用户的信息
     * @param {'name' | 'password' | 'avatar' | 'email'} type 更改项目
     * @param {string} value 更改后的值
     */
    changeData(type, value) {
        if (!this.is_login) return 'not_login'
        if (typeof value !== 'string') return 'invalid_type'
        const uid = this.user_profile.id
        const salt = this.user_verify.salt
        let _err = ''

        switch (type) {
            case 'password':
                // 密码
                _err = this.isValid('password', value)
                if (_err) return _err

                this.user_verify.token = this.getToken(uid, value, salt)
                this.all_login_data[this.user_profile.id] = undefined // 清除用户(临时)登入信息
                break

            case 'name':
                // 名称
                _err = this.isValid('name', value)
                if (_err) return _err

                this.user_data.profile.name = value
                break

            case 'avatar':
                // 头像
                // 字符串头
                // (ADD) 后续添加统一转换的图片
                const base64_regex = /^data:image\/([a-zA-Z]+);base64,/
                const match = value.match(base64_regex)


                if (match) { // 传入的数据是base64格式, 保存为用户头像文件
                    const image_type = match[1]
                    const filename = `${this.profile.id}.${image_type}`
                    const data = value.split(',')[1]
                    const buffer = Buffer.from(data, 'base64')
                    if (buffer.length > 524288) return 'size_too_big'
                    const valid = app.writeFile(app.getUserAvatarPath(filename), buffer)
                    if (!valid) return 'save_file_error'
                    value = app.getStaticURL(`avatar/${filename}`) // 最终的头像内容是静态文件头像的URL
                }

                if (value.length > 92) return 'length_too_long'
                
                this.user_data.profile.avatar = value
                break

            default:
                // 其他情况
                if (this.user_data.profile[type] === undefined) return 'type_not_exist'
                this.user_data.profile[type] = value
        }
        this.user_data.info.mtime = app.getTime()
        this.update()

        return ''
    }

    /**
     * (admin user)更改指定用户的角色
     * @param {number} target_id 目标用户的ID
     * @param {UserRole} role_name 角色名
     * @param {boolean} role_value 角色名对应的值
     */
    changeRole(target_id, role_name, role_value) {
        if (!this.user_role.admin) return 'no_permissions' // 检查

        const target_user = this.all_data.users[target_id] // 确定
        if (!target_user) return 'user_not_exist'

        try { // 更改
            target_user.role[role_name] = role_value
        } catch (err) {
            return 'set_fail'
        }
        if (this.update()) {
            return ''
        } else {
            return 'set_fail'
        }
        
    }
}


// 初始化config信息
Object.keys(config)
const _init_config = () => {
    /**
     * 格式化URL字符串
     * @param {string} url 
     * @returns 
     */
    const formatURL = (url) => {
        return url.replace(/^\/+|\/+$/g, '')
    }
    config.local_music_url = formatURL(config.local_music_url)
    config.static_url = formatURL(config.static_url)
}
_init_config()

// 初始化对象
export const app = new App()
export const player = new Player()
// 初始化版本信息
app.version = 'dev-202408_22/new'

