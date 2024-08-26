/**
 * 程序的入口文件, 构建了一个HTTP服务; 本文件主用于HTTP服务逻辑
 */

import {app, Player, player, User, config} from './app.mjs' // 引入主类

import express from 'express' // express框架
import cookieParser from 'cookie-parser'



// 初始化访客用户
const GuestUser = new User({ 'is_guest': true })



// 接受来自命令行的传参
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
app.debug(app.objToStr(config, { title: app.colorFont('SETTING', 'gray') })) // 配置信息






// 初始化http服务器

const httpApp = express()



// 中间件部分

httpApp.use(express.json({limit: config.req_max_size})) // 配置json解析中间件
httpApp.use(express.urlencoded({ limit: config.req_max_size, extended: true })) // 配置表单数据允许的最大值
httpApp.use(cookieParser()) // 配置Cookie解析中间件

// 打印访问日志并验证身份
httpApp.use((req, res, next) => {
    // (i)这里是身份验证的逻辑

    const invalid = (type = 'need_login') => {
        const toURL = app.toUrlStr
        const url = `/profile?from=${toURL(req.path)}&type=${toURL(type)}`
        // /(TAG)用户验证失败/
        // res.status(403)
        app.badReq(res, 403, type, url)
        app.printAccess(req, app.renderColorText('[[red]]403'))
    }

    /**是否有当前路由的访问权限 */
    let role = false

    const checkUser = (token) => { // 用户验证逻辑
        const user = new User({}) // 尝试实例化user
        _err = user.login(token)
        if (_err) {
            role = false
            return
        }
        const user_profile = user.profile
        res.locals.user = user // 验证成功赋值到对象
        res.locals.pre_data = { // 向网页元素预传入用户信息
            avatar: user_profile.avatar,
            name: user_profile.name,
        }
        if (user.user_role.admin) { // 用户是否有管理员权限: 创建导航栏快捷方式
            res.locals.pre_data.have_admin = 'have'

        }
        role = true
        return
    }




    let _err = ''
    let token = ''

    try {
        token = req.cookies['login_token']
    } catch (err) {}

    if (token) { // 用户token有效
        checkUser(token)
    } 
    
    if (!role) { // 用户token无效, 访客账户
        res.locals.user = GuestUser
        const path = req.path
        config.guest_routes.forEach((allow_dir) => { // 验证白名单
            if (app.matchPath(allow_dir, path)) role = true
        })
    }

    if (!role) { // 未在访客账户允许访问的路由内, 返回无权限
        invalid()
        return
    }

    // 打印访问日志
    app.printAccess(req, `${res.locals.user.profile.name}`)

    next()
})

httpApp.get('/', (req, res) => {
    app.returnHTML('index.html', res, { ver: app.version, project_name: app.name })
    res.end()
})

httpApp.get('/profile', (req, res) => {
    app.returnHTML('profile.html', res)
    res.end()
})


// 播放页面
httpApp.get('/player', (req, res) => {
    // 检查权限
    const user = app.getLoginUser(res)
    if (!app.checkRole(user, res, 'playing')) return


    const params = req.params

    app.returnHTML('player.html', res)
    res.end()
})

// 点歌页面
httpApp.get('/order', (req, res) => {
    // 检查权限
    const user = app.getLoginUser(res)
    if (!app.checkRole(user, res, 'order')) return

    app.returnHTML('order.html', res)
    res.end()
})

// 管理面板
httpApp.get('/admin', (req, res) => {
    const user = app.getLoginUser(res)
    if (!user.user_role.admin) return app.badReq(res, 403, 'no_permissions')
    
    app.returnHTML('admin.html', res)
    res.end()
})

// 调试页面
httpApp.get('/dev', (req, res) => {
    app.returnHTML('dev.html', res, {
        'user_data': app.objToStr(
            res.locals.user, {
                no_color: true,
                title: res.locals.user.profile.name
            }
        )
    })
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

    /**从上一个处理中获得的用户信息 @type {User | undefined} */
    const user = res.locals.user
    /**
     * 需要登入时执行此函数以校验用户是否登入
     * @returns {boolean} 用户是否登入
     */
    const isLogin = () => {
        const badReq = () => {
            endReq('not_login')
            return false
        }
        if (!user) return badReq()
        if (!user.is_login) return badReq()
        return true
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
            const item_type = typeof item
            if (!item && is_valid && item_type !== 'boolean') { // 无效参数且没有返回错误信息的情况
                // app.warn('invalid_request_param', app.objToStr(req_data))
                res_data.valid = false
                res_data.message = 'missing_param'
                endReq()

                is_valid = false
            }
        })
        return is_valid
    }
    /**
     * 结束这个响应, 向客户端发送res_data
     * @param {string} [err_message] 返回的错误信息
     * @example
     * res_data.data = {'value': 'ok'} // 你可以这样用, 这是请求成功
     * return endReq()
     * 
     * return endReq('error_message') // 也可以这样用, 不需要多余的赋值操作
     */
    const endReq = (err_message) => {
        if (err_message) {
            res_data.message = err_message
            res_data.valid = false
        }
        res.send(res_data).end()
    }

    /**
     * 检查是否有错误信息, 若有将结束响应返回错误信息, 函数返回true; 反之false
     * @param {string} err 错误信息
     * @param {object} [data] 如果遇到错误时返回`res_data`的data值
     */
    const checkErr = (err, data) => {
        if (!err) return false
        if (data) {
            res_data.data = data
        }
        endReq(err)
        return true
    }

    /**来自客户端的请求参数 @type {object} */
    const req_data = req.body // 获取请求体
    // /(TAG)API/  API在这里实现
    const param_command = { // 指定对应请求的操作
        // 用户添加歌曲到播放列表
        'add_song': () => {
            if (!isLogin()) return
            if (!isValid(req_data.src, req_data.title)) return // 检查参数
            if (!app.checkRole(user, res, 'order')) return
            user.order({
                'cover': valid(req_data.cover, config.normal_cover_url),
                'singer': req_data.singer,
                'src': req_data.src,
                'time': req_data.time,
                'title': req_data.title,
                'lyric': req_data.lyric
            }, (_err) => { // 获取错误信息
                if (!_err) { // 添加成功
                    // res_data.valid = true // 特意留在这里了一行注释掉了, 别再手贱多谢这一行! 函数底部有!
                    return endReq()
                } else { // 添加失败返回错误信息
                    return endReq(_err)
                }
            })

        },
        // 用户登入
        'login': () => {
            // /(TAG)登入API方法/
            let _err = ''
            /**传入的用户名或ID */
            let user_name = req_data.name
            let user_id
            /**传入的密码 */
            const user_password = req_data.password

            if (!isValid(user_name, user_password)) return // 检查传参有效性

            if (!isNaN(+user_name)) user_id = +user_name

            // app.log(user_name, user_id, user_password)
            
            const user = new User({ // 尝试实例化User
                'user_name': user_name,
                'id': user_id,
                'password': user_password
            })
            _err = user.login()
            if (checkErr(_err)) return // 登入失败

            // 登入成功
            const client_token = user.addLogin()
            res_data.data.token = client_token
            endReq()
            return
        },
        // 获取歌曲列表
        'get_song_list': () => {
            if (!isLogin()) return
            if (!app.checkRole(user, res, 'playing')) return

            const play_list = Player.list
            res_data.data.list = play_list ? play_list : []
            endReq()
            return
        },
        // 用户注册
        'register': () => {
            // (FIX)在传输过程中容易造成密码被窃
            const {password, name} = req_data
            if (!isValid(password, name)) return
            const user = new User({ // 尝试注册用户实例
                'password': password,
                'user_name': name
            })
            if (checkErr(user.add())) return // 返回错误信息

            // 注册成功
            res_data.data.token = user.addLogin()
            endReq()
            return
        },
        // 更改用户信息
        'change': () => {
            if (!isLogin()) return
            let _err = ''
            const type = req_data.target // 更改类型

            const value = req_data.value // 更改后的内容

            if (!isValid(type, value)) return // 检查参数

            

            _err = user.changeData(type, value) // 更改
            if (checkErr(_err)) return // 检查更改有效性
            if (type === 'avatar') { // 如果更改类型是头像 返回头像URL
                res_data.data.src = user.user_profile.avatar
            }
            
            // 更改完毕
            endReq()
            return
        },
        // 管理员用API
        'admin': () => {
            if (!user.user_role.admin) return endReq('no_permissions')

            /**这是标准的请求参数 */
            const _example_req_data = {
                type: 'admin',
                method: 'xxx',
                id: 114514
            }

            const is_valid = true

            const {method, uid, target, value} = req_data

            switch (method) {
                case 'get_all_user': // 获取所有用户数据
                    res_data.data = user.all_user

                    break
                case 'change_user_role': // 更改用户角色
                    if (!isValid(uid, target, value)) return
                    if (checkErr(user.changeRole(uid, target, value))) return

                    break
                case 'example': // 获取请求内容示范
                    res_data.data = _example_req_data

                    break
                default: // 无效请求
                    is_valid = false
                    break
            }

            is_valid ? endReq() : endReq('unknown_param')
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
    app.badReq(res, 404, 'not_found', '/')
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


    // config.local_music_mode = true
    // const user = new User({'id': '10002', 'password': '1919810'})
    const user = new User({'user_name': 'Quper', 'password': '114514'})

    // app.log('add:', user.add())
    app.log('login:', user.login())


    app.log('addLogin:', user.addLogin())
    setTimeout(() => {
        app.log('addLogin:', user.addLogin())
    }, 1485)
    // app.log('changeData:', user.changeData('password', '1919810'))

    // app.log('order:', user.order({
    //     'src': 'https://music.163.com/song/media/outer/url?id=1501952920',
    //     'title': 'test_error'
    // }, (valid) => {app.log('valid:', valid)}
    // ))

    // app.logObj(user.all_login_data)

}

