// 导入模块
import express from 'express' // express框架
import fs from 'fs' // 文件系统
import path from 'path' // 路径

import fetch from 'node-fetch' // fetch网络API
import mime from 'mime' // 文件mime类型
import crypto from 'crypto'

const httpApp = express()

// 初始化常量
const __dirname = process.cwd() // 转到ES6语法后的屑
const __salt = '3d93bbd10a66ea6ad85bc39434c5f677' // 定义特征值用于对token生成的唯一性

// 初始化配置
const config = {
    /**设置显示语言 */
    lang: 'zh-CN',
    /**静态文件路径 */
    static_path: './src/static',
    /**HTML路径 */
    html_path: './src/html',
    /**语言模板文件路径 */
    lang_file: './lang.json',
    /**(User)用户信息存储路径 */
    user_file: './user.json',

    /**静态文件路由路径 */
    static_url: '/src',
    /**(Player)默认封面地址 */
    normal_cover_url: '/src/image/normal_cover.webp',
    /**(User)默认头像 */
    normal_avatar: '/src/image/normal.webp',

    /**(Player)是否为本地模式 */
    local_music_mode: true,
    /**(Player)本地模式下音乐存放到文件系统的路径 */
    local_music_path: './local_music',
    /**(Player)音乐文件对应的HTTP服务路由位置 */
    local_music_url: '/music',

    /**(User)初始化后的admin账户 */
    admin_user: {
        name: 'admin',
        password: '12345678',
        avatar: null
    }
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
    html_head_cont = `<link rel="stylesheet" href="src/picnic.css" data-tip="picnic css库">`
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
    logObj(obj) {this.log(this.objToStr(obj))}

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
        return this.modDate.toLocaleString()
    }

    /**
     * 获取时间戳
     */
    getTime() {
        return this.modDate.getTime()
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
     * @param {string} data 需要写入的内容
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
                app.debug('url:', url, ',download_path:', download_path, ',ext_name:', ext_name)
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
            file_stat.isDirectory = () => {return false}
            file_stat.isFile = () => {return false}
        }
        return callback ? callback(file_stat) : file_stat
    }

    /**
     * 获取静态文件的路径
     * @param {string} rel_path 
     * @returns {string|undefined} 如果是合法的文件则返回文件绝对路径,否则返回undefined
     */
    getFilePath(rel_path) {
        const abs_path = path.join(config.static_path, rel_path) // 获取绝对路径
        return (!(this.getFileStat(abs_path).isFile())) ? abs_path : void 0
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
     * 基础渲染模板引擎
     * @param {string} template 模板内容
     * @param {object} data 模板数据
     * 
     * @example
     * app.renderTemplate('hello, my name is {{ name }}.', {name: 'Quper'}) // hello, my name is Quper.
     */
    renderTemplate(template, data) {
        const regex = /\{\{\s*(\w+)\s*\}\}/g // 定义正则
        return template.replace(regex, (match, key) => {
            // 从 data 对象中获取对应的值并返回
            return data[key] !== 'undefined' ? data[key] : ''
        })
    }

    /**
     * 将对象转换为可读性强字符串样式
     * @param {Object} obj 传入对象
     * @param {string} title 显示样式上根的标题
     * @param {string} [indent='    |-'] 缩进内容
     * @param {number} [rep_indent=1] 缩进内容重复次数
     */
    objToStr(obj, title = undefined, rep_indent = 1, indent = ' |-') {
        // (!) 对象中对象出现意外换行现象
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
                cont += this.objToStr(value, '', rep_indent + 1, indent) // 将对象再转换
            } else { // not对象
                if (!(value === null || value === undefined)) {
                    value = value.replace ? value.replace('\n', '\\n') : value // 转义转义换行, 如果不是字符串返回原值
                }
                // app.debug(value, typeof value)
                cont += this.colorFontType(value) // 调用方法来染色类型对应的字体颜色
            }
            line.push(cont)
        })  // ~ 漂亮滴很呐!(赞赏)
        return colors.reset + title + line.join(`\n${indent.repeat(rep_indent)}`)
    }


    // 路由中间函数相关...
    /**
     * 用于路由函数,返回获取到的HTML文件值到客户端
     * @param {string} file_name HTML文件名(定义在config路径的相对路径)
     * @param {Request} req Request值
     * @param {Response} res Response值
     * @param {object | undefined} data 传入到网页的键值对用于模板替换
     */
    returnHTML(file_name, req, res, data = {}) {
        // 读取HTML文件内容
        res.set('Content-Type', 'charset=utf-8')
        this.readFile(path.join(__dirname, config.html_path, file_name), (html_cont) => {
            if (!html_cont) { // HTML文件不存在
                res.status(500)
                res.type('text')
                res.send(`file '${file_name}' not found the server.`)
                return
            }

            // HTML文件存在

            res.type('HTML')
            data.__html_head = this.html_head_cont
            res.send(this.renderTemplate(html_cont, data)) // 进行模板渲染

        })
        // this.printAccess(req, res) // 打印访问日志
        return
    }

    /**
     * 打印访问日志
     * @param {Request} req Request值
     * @param {Response} res Response值
     */
    printAccess(req, res) {
        const color = this.colorFont
        let more_info = ''
        if (req.method === 'POST') {
            more_info = '| ' + (this.isObj(req.body) ? JSON.stringify(req.body) : req.body)
        }
        app.log( // 打印访问日志
            color(req.ip, 'blue'),
            color(req.method, 'green'),
            color(req.url, 'gray'),
            color(`HTTP/${req.httpVersion}`, 'yellow'),
            more_info
        )
    }
    /**
     * 抛出错误
     * @param {string} message 
     */
    onError(message) { throw new Error(`${message}`) }

}


class Player {
    /**
     * 构建一个播放器
     * @param {boolean} local_mode 是否启用本地模式(本地模式将缓存歌曲URL)
     * @param {string} static_path 缓存音乐存放路径
     * @param {string} static_url 指定访问音乐文件在服务器的路由根路径
     * 
     * 
     * @typedef {Object} SongData
     * @property {string} title - 歌曲标题
     * @property {string} src - 歌曲源
     * @property {string} singer - 歌曲歌手
     * @property {string} cover - 歌曲封面源
     * @property {number} time - 歌曲总时长(秒)
     * @property {number} lyric - 歌曲歌词内容
     */
    constructor(
        local_mode = config.local_music_mode,
        static_path = config.local_music_path,
        static_url = config.local_music_url
    ) {
        /**播放列表 */
        Player.list = []


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
     * @param {function(boolean)=} callback 当为local_mode的时候会调用callback返回是否成功
     * @param {string} order_name 传入点歌者信息
     * @returns {boolean | undefined}
     */
    push(song_data, order_name, callback) {
        const push = () => { // 临时定义函数用于兼容异步函数
            const valid = (value, normal = null) => {return value ? value : normal}
            const song_id = Player.list.length
            const push_data = {
                data: {
                    'cover': valid(song_data.cover),
                    'singer': valid(song_data.singer),
                    'src': song_src,
                    'time': song_data.time,
                    'title': song_data.title,
                    'lyric': song_data.lyric
                },
                info: {
                    'id': song_id,
                    'name': order_name,
                    'time': app.getTime()
                }
            }
            Player.list.push(push_data) // 将播放歌曲的信息push到Player.list对象中
            // 打印新歌信息
            app.info('push_song', app.objToStr(push_data.data, `song_data[${song_id}]`), song_id, push_data.info.name)
        }


        let song_src = song_data.src
        if (this.local_mode) { // 如果是本地模式先将远程文件保存到文件系统
            if (!callback) throw app.throwError('error_value_is_invalid', callback)
            app.debug('Player: local mode, download music.')
            app.downloadFile({
                'download_path': this.static_path,
                'ext_name': 'mp3',
                'url': song_src
            },(hash) => {
                if (!hash) { // 如果无效
                    return callback(false)
                }
                song_src = this.static_url + '/' + hash + '.mp3'
                app.log(song_src)
                push()
                return callback(true)
            })
        } else { // 如果非本地模式直接添加
            push()
            return this.local_mode ? callback(true) : true
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
    getMusic(file_name) {
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
}


class User extends Player {
    /**
     * @typedef {Object} UserData User类内存储用户信息的标准格式
     * @property {UserProfile} profile
     * @property {UserVerify} verify
     * @property {UserRole} role
     * @property {UserInfo} UserInfo
     * 
     * @typedef {Object} UserProfile 用户信息
     * @property {string} name 昵称
     * @property {string | undefined} password 密码
     * @property {string | null} email 邮箱
     * @property {string | null} avatar 头像地址
     * @property {number} id UID
     * 
     * @typedef {Object} UserVerify 用户验证信息相关
     * @property {string} token 用户身份验证信息
     * 
     * @typedef {Object} UserRole 用户权限
     * @property {boolean} playing 
     * @property {boolean} order 
     * @property {boolean} admin 
     * 
     * @typedef {Object} UserInfo 关于用户
     * @property {number} ctime 创建时间
     * @property {number} mtime 修改时间时间
     */
    /**
     * 创建一个User类
     * @param {string} user_name 用户名
     * 
     * @param {object} param2 用户信息
     * @param {boolean} param2.is_temp 是否是临时用户 (临时用户不需要密码或cookie登入)
     * @param {number | undefined} param2.id 用户ID
     * @param {string | undefined} param2.password 用户密码
     * @param {string | undefined} param2.avatar 用户头像
     * @param {string | undefined} param2.email 用户邮箱
     * @param {string | undefined} param2.cookie_login cookie登入值
     * 
     */
    constructor(user_name, {is_temp = false, id, password, avatar, email, cookie_login}) {
        super() // 构造继承的Player
        
        /**存储用户数据内容文件 */
        this.user_file = config.user_file
        /**默认头像 */
        this.normal_avatar = config.normal_avatar

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

        /**cookie登入内容 */
        this.cookie_login = cookie_login

        /**是否是临时用户 */
        this.is_temp = is_temp
        /**是否已登入; 判断是否有效登入: 确保`config.user_file`的用户信息比对一致且算是有效登入*/
        this.is_login = false

        if (!app.getFileStat(this.user_file).isFile()) { // 如果用户信息文件不存在 初始化文件
            this._initData()
            app.info('create_file', this.user_file)
        }
    }

    /**(文件或缓存)获取所有用户数据*/
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

    /**
     * (all_user)获取用户数据
     * @returns {UserData} 
     */
    get user_data() {
        if (!this.is_login) return {}
        return this.all_user[this.profile.id]
    }

    /**初始化内容 */
    _initData() {
        const time = app.getTime()
        const data = {
            'users': {},
            'info': {
                'ver': app.version,
                'ctime': time,
                'mtime': time,
                'last_uid': 10000
            }
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
    isExits({name, id} = this.profile) {
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
        }
        if (!(typeof value === 'string')) return 'param_invalid'
        switch (type) {
            case 'name':
                if (value.length < 4) return 'name_too_short'
                if (value.length > 12) return 'name_too_long'
                if (reg.special.test(value)) return 'name_have_special_char'
                break
            case 'password':
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
     * 获取用户的Token用于验证或初始化用户身份验证信息
     * @param {string} name 用户名
     * @param {string} uid 用户UID
     * @param {string} password 密码
     */
    getToken(name = this.profile.name, uid = this.profile.id, password = this.profile.password) {
        const plain_token = `${uid}-${name}-${password}/${__salt}` // 这里的token经过hash计算后得到一个唯一token, token的特征值需要独一无二
        // app.log(plain_token)
        return app.getStrHash(plain_token)
    }

    /**
     * 尝试登入一个用户实例
     * @param {{name: string, password: string}} [param0=this.profile] 传入用户信息
     */
    login({name, password} = this.profile) {
        if (this.is_login) return 'is_login'
        if (!(name || password)) return 'lost_param'

        // 检查名称是否存在
        let valid_name = false
        let uid = -1
        let token = ''
        /**@type {UserData} */
        let user_data
        this.forEachUser((item) => {
            // app.log(item.profile.name, name)
            if (item.profile.name === name) {
                valid_name = true
                uid = item.profile.id
                token = item.verify.token
                user_data = item
            }
        })
        // app.log(user_data)
        if (!valid_name) return 'name_not_found'

        // 校验token
        const get_token = this.getToken(name, uid, password)
        if (!(get_token === token)) return 'name_or_password_error'

        // 校验成功
        app.info('user_login', 'login')
        app.debug(app.objToStr(user_data, 'user_data'))
        this.is_login = true
        this.profile = user_data.profile
        return ''
    }

    /**
     * 尝试注册一个用户实例
     * @param {{name: string, avatar: string, email: string, password: string}} profile 传入用户信息
     */
    add({name, avatar, email, password} = this.profile, _init = false) {
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
        const is_exist = this.isExits({name: name, id: uid})
        if (is_exist) return is_exist

        const token = this.getToken(name, uid, password)
        const time = app.getTime()

        // 更新用户列表信息
        const user_role = {// 指定为init的账户给予管理员权限
            'playing': _init ? true : false,
            'order': true,
            'admin': _init ? true : false
        }
        let user_avatar = avatar ? avatar : this.normal_avatar
        const user_data = {
            'profile': {
                'name': name,
                'email': email ? email : null,
                'avatar': user_avatar,
                'id': uid
            },
            'verify': {
                'token': token
            },
            'role': user_role,
            'info': {
                ctime: time,
                mtime: time
            }
        }
        this.all_user[uid] = user_data
        this.data_info.mtime = time
        this.update()

        app.info('user_register', user_data.profile.name)

        // 更新实例信息
        if (_init) return ''
        if (this.login({ name: name, password: password })) return 'unexpected'
        return ''
    }

    /**
     * (Player)点一首歌到播放列表
     * @param {SongData} song_data 
     * @param {function(boolean)=} callback 
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

        
        if (!(this.is_login || this.is_temp)) return returns('not_login')
        if (!this.user_data.role.order) return returns('not_role')
        if (!this.push(song_data, this.profile.name, returns('_func'))) return returns('')
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
const app = new App()
const player = new Player()
// 初始化版本信息
app.version = 'dev-202408_16'




// 接受来自命令函的传参
const args = process.argv

// const args = ['--test']

// 处理传入参数
args.forEach((key, index) => {
    if (!(key.slice(0, 2) === '--')) return // 不是有效参数名时进入下一个循环
    // 获取到参数与参数值
    const param = key.slice(2)
    const value = args[index + 1]

    // 执行对应指令
    const command = app.param_command[param]
    if (!command) app.onError(app.text('consol_invalid_param', key)) // 如果没有对应的处理方式则抛出错误
    command(value) // 执行
    app.debug(app.text('consol_args_command_finish', command))
})

// 输出基本信息
app.log(app.colorFont(' QUPR ', 'white', 'green'), app.colorFont(' ONLINE-SONG ', 'white', 'cyan'), app.colorFont(app.version, 'yellow')) // 版本号与项目名称
app.debug(app.objToStr(config, app.colorFont('SETTING', 'gray'))) // 配置信息






// 初始化http服务器




// 中间件部分

httpApp.use(express.json()) // 配置json解析中间件

// 打印访问日志并验证身份
httpApp.use((req, res, next) => {
    app.printAccess(req, res)


    next()
})


// 路由部分

// 主页面
httpApp.get('/', (req, res) => {
    app.returnHTML('index.html', req, res, { ver: app.version, project_name: app.name })
    res.end()
})

// 播放页面
httpApp.get('/player', (req, res) => {
    const params = req.params

    app.returnHTML('player.html', req, res)
    res.end()
})

// 点歌页面
httpApp.get('/order', (req, res) => {

    app.returnHTML('order.html', req, res)
    res.end()
})

// 不存在页面
httpApp.get('/not_found', (req, res) => {
    app.returnHTML('not_found.html', req, res)
    res.end()
})

// 调试页面
httpApp.get('/dev', (req, res) => {
    app.returnHTML('dev.html', req, res)
    res.end()
})

// 本地音乐
httpApp.get(`/${config.local_music_url}/*`, (req, res) => {
    const file_name = req.params[0]

    const music_path = player.getMusicPath(file_name)
    if (!music_path) {
        res.status(404).send('file_not_found').end()
        return
    }
    res.set('Content-Type', 'audio/mpeg')
    res.set('Content-Disposition', 'inline')
    // (!) 特别注意: 这里容易意外出现"ERR_HTTP_HEADERS_SENT"报错, 原因不明
    res.sendFile(music_path, (err) => {
        if (err) {
            app.error('send_file_error', err)
            res.status(404).send('bad')
        }
    })
    return
})


// api...
httpApp.post('/api', (req, res) => {
    // 初始化

    let res_data = { // 初始化响应值
        valid: true,
        message: '',
        data: {}
    }

    /**
     * 传入值,若值非有效输出为默认值
     * @param {any} value 待检测值
     * @param {any} value 默认值
     */
    const valid = (value, normal = '') => { return value ? value : normal }
    /**
     * 传入多个值,若值非有效返回错误并结束本次响应并响应错误
     * @param {...any} value 
     * 
     * @returns {boolean} true: 所有参数均有效; false: 有任意一个参数无效且已经响应错误信息,需要return出函数
     */
    const isValid = (...value) => {
        let is_valid = true
        value.forEach((item) => { // 遍历所有参数
            if (!item && is_valid) { // 无效参数且没有返回错误信息的情况
                // app.warn('invalid_request_param', app.objToStr(req_data))
                res_data.valid = false
                res_data.message = 'param_is_invalid'
                endReq()

                is_valid = false
            }
        })
        return is_valid
    }
    /**
     * 结束这个响应, 向客户端发送res_data
     */
    const endReq = () => {
        res.send(res_data).end()
    }

    const req_data = req.body // 获取请求体
    const param_command = { // 指定对应请求的操作
        'add_song': () => {
            // (IMP) 注意,这里的player.push方法后期要兼容用户系统改为user.order, 其valid方法需要移至player.push内以便在其他地方也能得到有效参数
            if (!isValid(req_data.src, req_data.title)) return // 检查必要参数
            player.push({
                'cover': valid(req_data.cover, config.normal_cover_url),
                'singer': valid(req_data.singer),
                'src': req_data.src,
                'time': valid(req_data.time),
                'title': req_data.title,
                'lyric': valid(req_data.lyric)
            }, valid(req_data.order), (valid) => {
                if (valid) { // 是否有效
                    endReq()
                } else {
                    res_data.valid = false
                    res_data.message = 'push_list_error'
                    endReq()
                }
            })

        },
        'login': () => {
            
        }
    }

    // app.log(req_data, typeof req_data)



    // 处理
    let execute // 初始化要执行的函数

    if (typeof req_data === 'object') { // 确定是否是预期内值
        execute = param_command[req_data.type]
        if (!((typeof execute) === 'function')) { // 如果不存在此函数则判定为指定type无效
            // app.debug('没有对应函数')
            res_data.message = 'unknown_type'
            res_data.valid = false
            endReq()
            return
        }
    } else { // 不是预期的值
        // app.debug('不是预期值')
        res_data.message = 'unknown_req_type'
        res_data.valid = false
        endReq()
        return
    }

    execute() // 执行type对应参数的函数
    return
})

// test
httpApp.post('/test', (req, res) => {
    res.end(JSON.stringify({ test: 'ok' }))
    app.log(JSON.stringify(req.body))
    res.end()
})

httpApp.use(`/${config.static_url}`, express.static(config.static_path)) // 设置静态目录


/**路由不存在 */
httpApp.use((req, res, next) => {
    res.status(404)
    app.returnHTML('not_found.html', req, res)
    next()
})



httpApp.locals.charset = 'utf-8' // 设置项目编码

// 运行HTTP服务器
app.info('init_finish')
if (!app.test_mode) { // 是否是测试模式
    const server = httpApp.listen(app.prot, app.host, () => {
        // 初始化服务器
        const server_host = server.address()

        app.info('server_running', server_host.address, server_host.port)
    })
} else {
    app.info('test_mode_bypass_server')
    // player.push({
    //     'src': 'https://music.163.com/song/media/outer/url?id=1311345944',
    //     'cover': 'https://p3.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
    //     'title': 'ずんだもんの朝食　〜目覚ましずんラップ〜',
    //     'time': 126.119184, 'singer': 'ひらうみ'
    // }, 'Quper', (valid) => {
    //     app.log(valid)
    // })


    // app.downloadFile({'url': 'https://music.163.com/song/media/outer/url?id=1311345944', 'ext_name': 'mp3', 'download_path': './'}, (hash) => {
    //     app.log(hash)
    // })

    const user = new User('Quper', {'password': 'Quper233'})
    // app.log(user.add())
    app.log('login' + user.login())
    app.log(user.order({
        'src': 'https://music.163.com/song/media/outer/url?id=1501952920',
        'title': 'Swift'
    }, (valid) => {app.log(valid)}
    ))

}

