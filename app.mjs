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

// 初始化配置
const config = {
    /**版本号 */
    version: '',

    /**静态文件路径 */
    static_path: './src/static',
    /**HTML路径 */
    html_path: './src/html',
    /**语言模板文件路径 */
    lang_file: './lang.json',

    /**静态文件路由路径 */
    static_url: '/src',
    /**默认封面地址 */
    normal_cover_url: '/src/image/normal_cover.webp'
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
        'undefined': 'gray'
    }

    constructor() {
        // 初始化设置项
        /**指定语言(默认) */
        this.lang = 'zh-CN'
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
        if (type === 'object' && !this.isObj()) type = 'array' // 确定是不是真的obj, 否则就是Array

        let color_code = this.color_type[type]
        color_code = color_code ? color_code : ''
        
        let text = ''
        if (value === null) { // null特殊处理
            text = 'null'
            color_code = this.color_type['null']
        } else {
            text = value.toString()
        }

        return this.colorFont(text, color_code)
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
     * @param {boolean} is_time 是否获取时间戳,如果否则将获得字符串格式的时间
     * @returns {string}
     */
    date(is_time = false) {
        return is_time ? this.modDate.getTime().toString() : this.modDate.toLocaleString()
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
        this.readFile(file_name, (cont) => {
            const obj = JSON.parse(cont)

            returns = callback ? callback(obj) : obj
        })

        return returns
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
            if (err) app.error('try_download_file_error', url, err)

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
            this.isInit ? app.error('try_read_file_error', err) : console.error(err) // 打印错误信息
        }
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
    objToStr(obj, title = undefined, rep_indent = 1, indent = '    |-') {
        if (!(typeof obj === 'object')) {
            app.error('consol_invalid_param', obj)
        }
        title = title ? '\n' + title : ''
        let line = [''] // 初始化line数组用于存储每一行内容 (PS:留下一个空字符串是必要的)
        Object.keys(obj).forEach((key) => { // 遍历整个对象
            let value = obj[key]

            let cont = `${key}: ` // 初始化该行内容
            if (this.isObj(value)) { // 判断是否对象, 形似分支的操作
                // app.debug('is obj:', value)
                cont += this.objToStr(value, '', rep_indent + 1, indent) // 将对象再转换
            } else { // not对象
                if (!(value === null)) {
                    value = value.replace ? value.replace('\n', '\\n') : value // 转义转义换行, 如果不是字符串返回原值
                }
                // app.debug(value, typeof value)
                cont += this.colorFontType(value) // 调用方法来染色类型对应的字体颜色
            }
            line.push(cont)
        })  // ~ 漂亮滴很呐!(赞赏)
        return colors.reset + title + line.join(`\n${indent.repeat(rep_indent)}`) + '\n'
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
     * @param {string} [static_path='./local_music'] 缓存音乐存放路径
     * @param {string} [static_url='/music'] 指定访问音乐文件在服务器的路由根路径
     */
    constructor(local_mode = true, static_path = './local_music', static_url = '/music') {
        /**播放列表 */
        this.list = [
            {
                data: {
                    'title': 'song name',
                    'singer': 'singer name',
                    'src': 'http://example.com/song.mp3',
                    'cover': 'http://example.com/song.webp',
                    'time': 0
                },
                info: {
                    'id': '1',
                    'name': ''
                }
            }
        ]


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
     * @param {object} song_data 传入歌曲信息
     * @param {string} song_data.title - 歌曲标题
     * @param {string} song_data.src - 歌曲源
     * @param {string} song_data.singer - 歌曲歌手
     * @param {string} song_data.cover - 歌曲封面源
     * @param {number} song_data.time - 歌曲总时长(秒)
     * 
     * @param {function(boolean)=} callback 当为local_mode的时候会调用callback返回是否成功
     * @param {string} order_name 传入点歌者信息
     */
    push(song_data, order_name, callback) {
        const push = () => { // 临时定义函数用于兼容异步函数
            const song_id = this.list.length
            const push_data = {
                data: {
                    'cover': song_data.cover,
                    'singer': song_data.singer,
                    'src': song_src,
                    'time': song_data.time,
                    'title': song_data.title
                },
                info: {
                    'id': song_id,
                    'name': order_name
                }
            }
            this.list.push(push_data) // 将播放歌曲的信息push到this.list对象中
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
        this.list.forEach((item) => { // 遍历播放列表,如果存在该源直接返回true
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
        if (!app.getFileStat(music_path).isFile()) return ''
        return music_path
    }
}



// 初始化对象
const app = new App()
const player = new Player()
// 初始化版本信息
app.version = '202408'





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

// 打印访问日志
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
httpApp.get('/music/*', (req, res) => {
    const file_name = req.params[0]

    const music_path = player.getMusicPath(file_name)
    if (!music_path) {
        res.status(404).send('file_not_found')
        res.end()
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
    const valid = (value, normal = null) => { return value ? value : normal }
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
            if (!isValid(req_data.src, req_data.title)) return // 检查必要参数
            player.push({
                'cover': valid(req_data.cover, config.normal_cover_url),
                'singer': valid(req_data.singer),
                'src': req_data.src,
                'time': valid(req_data.time),
                'title': req_data.title
            }, valid(req_data.order), (valid) => { // (ADD)这里后续需要添加身份认证获得的req_data.order, 即点歌人名称
                if (valid) { // 是否有效
                    endReq()
                } else {
                    res_data.valid = false
                    res_data.message = 'push_list_error'
                    endReq()
                }
            })

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

httpApp.use(config.static_url, express.static(config.static_path)) // 设置静态目录


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
    // app.downloadFile({ 'url': 'https://music.163.com/song/media/outer/url?id=1311345944', 'download_path': '__.mp3' }, (hash) => {
    //     app.log(hash)
    // })

}

