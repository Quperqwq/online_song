/**
 * @typedef {import('../../types').SongList} SongList
 */

// init function
const valid = (value, normal) => { return value ? value : normal }
/**
 * [简]\(document.getElementById)获取页面的元素
 * @param {string} id_name 传入ID name
 * @returns {Element}
 */
const getEBI = (id_name) => {
    const element = document.getElementById(id_name)
    if (!element) {
        if (!app.is_init) return console.error(`get element by id '${id_name}' error`)
        app.errorBox(msgBoxText('get_element_fail') + `\n${id_name}`)
    }
    return element
}


// definition class
class App {
    /**静态文件所在这个网站的位置 */
    static_url = '/src'
    /**是否启用调试模式 */
    debug_mode = false
    /**API的URL */
    api_url = '/api'
    /**当前页面的路径 */
    page_path = location.pathname
    /**是否初始化完成 */
    is_init = false
    /**循环请求(如更新歌单列表)的间隔时间(毫秒) */
    loop_res_time = 5000
    lang_text = {
        'zh-CN': {
            status: {
                400: '请求参数出现问题',
                401: '未经授权 访问被拒绝',
                403: '禁止访问 您没有权限',
                404: '请求的资源未找到',
                500: '服务器内部错误 请稍后重试',
                502: '错误的网关 服务器无法处理请求',
                503: '服务不可用 服务器当前无法处理请求',
                504: '网关超时 未能及时响应',
            },
            error: {
                'need_login': '需要登入',
            },
            module: {
                'menu': '菜单',
            },
            page_name: {
                home: '主页',
                order: '点歌',
                player: '播放',
                profile: '我的',
                admin: '管理',
                debug: '调试',
            },
            msg_box: {
                name_too_short: '名称过短。',
                name_too_long: '名称过长。',
                all_number: '不允许全部使用数字。',
                name_have_special_char: '不允许包含特殊字符。',
                is_repeat: '信息重复。',
                password_error: '密码错误。',
                input_is_null: '输入内容为空。',
                check_file_too_big: '选择的文件过大。',
                name_not_found: '用户名不存在。',
                id_not_found: 'ID不存在。',
                cant_self: '不可以操作自己。',
                bad_request: '错误的请求。',
                please_select_file: '请选择文件。',
                please_input: '请输入内容。',
                please_input_keyword: '请输入关键词。',
                not_support_file: '不支持的文件类型。',
                logging: '登入中...',
                no_permissions: '没有权限。',
                not_login: '登入过期。',
                confirm_logout: '确定登出吗？',
                confirm_del_user: '确定要删除该用户吗？',
                change_avatar_finish: '更改头像成功。',
                change_name_finish: '更改名称成功。',
                register_user_finish: '注册用户成功。',
                order_song_finish: '点歌成功。',
                password_mismatch: '两次密码不一致。',
                initializing: '正在初始化中...',
                operate_requesting: '操作请求中...',
                get_element_fail: '获取元素失败。',
                get_preview_fail: '获取预览信息失败。',
                order_song_fail: '点歌失败。',
                server_error: '服务器或网络出现错误。',
                server_processing: '服务器处理中。',

                // title
                login_fail: '登入失败',
                confirm: '确定',
                finish: '完成',
                error: '错误',
                wait: '请稍等',
            },
            server: {
            },
            item: {
                'admin': '管理员',
                'order': '点歌者',
                'playing': '播放者',
                'go_top': '返回顶部'
            }
        }
    }
    src_url = {
        'ico_logo': '/src/favicon.ico',
        'png_logo': '/src/logo.png',
    }
    
    constructor(lang = 'zh-CN') {
        // elem_... 表示Element, 在本类中通常表示一个全局Element;
        // elems_... 表示Elements, 在本类中通常表示一个全局Object内是Element
        const _text = this.lang_text[lang]
        this.text = _text ? _text : Object.keys(this.lang_text)[0]


        this.mod = {
            xhr: new XMLHttpRequest()
        }
        /**点击事件的回调函数 */
        this.eventCallbacks = {
            /**@type {undefined | function} */
            msgBox: undefined
        }
        this.init_err_list = []

        // init...
        document.addEventListener('DOMContentLoaded', () => {
            const appendErr = (err_value) => {
                if (err_value) this.init_err_list.push(err_value)
                return
            }
            /**服务器指定当前的账户信息 */
            this.user = {
                /**用户头像 */
                avatar: this.getMetaData('avatar'),
                /**用户名 */
                name: this.getMetaData('name'),
                /**是否有管理员权限 */
                have_admin: this.getMetaData('have_admin') ? 'have' : undefined,
                /**网页头部显示用户信息的元素 */
                element: {
                    /**@type {null | Element} */
                    avatar: null,
                    /**@type {null | Element} */
                    name: null,
                }
            }
            appendErr(this.initMsgBox())
            appendErr(this.initHeader())
            
            const err_list = this.init_err_list
            if (err_list.length !== 0) return console.error('init common script fail, error message: ', err_list) // 若有错误信息不执行初始化内容

            this.user.element.avatar = this.elems_header.logo
            this.user.element.name = this.elems_header.title
            this.is_init = true
            if (this._initCallback) this._initCallback()
        })
    }

    /**
     * 监听`App`初始化完成
     * @param {function(Array.<string> | undefined)} callback 回调函数, 传入初始化时错误信息
     * @param {boolean} [need_click = false] 是否需要用户确认(通常需要让用户先互动的页面启用)
     */
    listenInit(callback, need_click = false) {
        this._initCallback = () => {
            const err = this.init_err_list
            if (need_click) {
                this.msgBox('info', 'please click', 'info', true, callback)
                // this.msgBox('info', 'please click', 'info', true)
                return
            }
            callback(err.length ? err : undefined)
        }
        return
    }


    // 工具函数-网络相关
    /**
     * 创建一个fetch请求以便使用API
     * @param {string} method 请求方法
     * @param {string} url 请求的URL
     * @param {object} data 请求体(对象)
     * @param {function(object | null)} callback 回调函数,传入响应体; 如果未传入该参数将会返回响应JSON结果
     * @param {function(any)} [errCallback] 出现错误时调用此函数
     * 
     */
    makeFetch(method = 'GET', url = '', data, callback, errCallback) {
        if (!method | !url | !data | !callback) { // 未传入任意参数将报错
            console.error('missing param')
            return
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then((response) => { // 处理响应内容
                // 检查响应是否成功
                if (response.ok) {
                    // 尝试将响应体解析为 JSON
                    const res_data = response.json().catch(() => ({}))
                    return res_data
                } else {
                    // 如果响应不成功,返回一个空对象
                    return {}
                }
            })
            .then((data) => { // 处理完成返回结果
                return callback(data)
            })
            .catch((error) => { // 处理错误
                console.error(error)
                if (typeof errCallback === 'function') {
                    errCallback(error)
                    return
                }
                return callback(null)
            })
    }

    /**
     * 使用服务端API与其通讯
     * @param {object} data 传入对象
     * @param {function({valid: true, message: string, data: object})} callback 传入回调函数
     * @param {function({valid: false, message: string, data: object | null})=} errCallback 出现错误的回调函数
     * @param {boolean} [auto_error_box] 自动弹出错误框 
     * 
     * @example
     * app.useAPI({'type': 'test'}, (res_data) => {
     *  // 当请求成功时的回调函数...
     * }, (res_data) => {
     *  // 当请求失败的回调函数...
     *  // 请求失败时会自动弹出错误框提示信息
     * })
     */
    useAPI(data, callback, errCallback, auto_error_box = true) {
        if (this.debug_mode) log('(API)useAPI req data:', data)
        const onErr = (res_data) => {
            if (typeof errCallback !== 'function') return
            errCallback(res_data)
        }
        this.makeFetch('POST', this.api_url, data, (res_data) => {
            if (this.debug_mode) log('(API)useAPI res data:', res_data)
            if (!res_data) {
                app.errorBox(msgBoxText('bad_request'))
                onErr(res_data)
                return
            }
            if (!res_data.valid) {
                if (auto_error_box) app.errorBox(msgBoxText(res_data.message))
                onErr(res_data)
                return
            }
            callback(res_data)
        }, (error) => {
            if (auto_error_box) app.errorBox(error)
            onErr(error)
        })
    }

    /**
     * (useAPI)调用API更改用户信息
     * @param {string} target 更改目标
     * @param {any} value 更改值
     * @param {function(object)} callback 回调函数
     */
    makeChange(target, value, callback) {
        this.useAPI({
            'type': 'change',
            'target': target,
            value: value
        }, (res_data) => {
            callback(res_data)
        })
    }

    /**
     * 使浏览器下载指定URL的远程文件
     * @param {string} url 
     * @param {string} file_name 
     */
    downloadFile(url, file_name) {
        const e_download = document.createElement('a')
        e_download.href = url
        e_download.download = file_name
        e_download.target = '_blank'

        e_download.click()
    }


    // 工具函数-时间相关

    /**
     * 设置一个倒计时
     * @param {number} time 倒计时时长
     * @param {function(number)} callback 每过去一秒触发一次回调函数, 并传入当前计时时间
     */
    setCountdown(time, callback) {
        const timeout = () => {
            setTimeout(() => {
                callback(time)
                time -= 1
                if (time >= 0) {
                    timeout()
                    return
                }
            }, 1000)
        }
        callback(time)
        time -= 1
        timeout()
    }
    
    /**
     * 将时间戳转换为可读样式
     * @param {number} time 
     */
    static toStrTime(time) {
        const date = new Date(time)
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}.${String(date.getSeconds()).padStart(2, '0')}`
    }


    // 工具函数-路径相关

    /**
     * 拼接路径到完整路径
     * @param  {...string} path 路径
     */
    joinPath(...path) {
        let full_path = []
        path.forEach((path_name) => {
            const dir_list = path_name.split(/\/|\\|\\\\/)
            dir_list.forEach((dir_name) => {
                full_path.push(dir_name)
            })
        })
        return full_path.join('/')
    }

    /**
     * 获取静态文件在服务器的路径
     * @param {string} file_name 传入文件名
     */
    getStaticUrl(file_name) {
        return this.joinPath(this.static_url, file_name)
    }

    // 工具函数-text
    /**
     * (this.text)获取对应的文本内容
     * @param {string} type 获取的类型
     * @param {string} key 内容键
     * @returns {string} 返回文本内容, 若无此项则返回key
     */
    getText(type, key) {
        const obj_type = this.text[type]
        const value = obj_type ? obj_type[key] : '' // 确认非undefined再取值
        return value ? value : key
    }

    // 工具函数-对象

    /**
     * 遍历一个对象
     * @param {object} obj 传入对象
     * @param {function(string, any)} callback 
     */
    forEachObject(obj, callback) {
        Object.keys(obj).forEach((key) => {
            const value = obj[key]
            callback(key, value)
        })
    }




    // 工具函数-dom相关
    /**
     * (DOM)获取从HTML模板渲染引擎获得的值
     * @param {string} meta_name meta的name属性
     */
    getMetaData(meta_name) {
        // /(TAG)传递数据的meat元素/ 在这里取值
        const e_meta = document.querySelector(`meta[name=data-${meta_name}]`)
        const data = e_meta ? e_meta.getAttribute('content') : ''
        return data
    }

    /**
     * (DOM)(document.createElement)创建一个元素
     * @param {string} tag_name 传入标签名
     * @param {Object.<string, string>} tag_attrib 标签的属性
     * @param {string | number | function(MouseEvent)} cont_or_func 标签内容, 或点击事件的回调函数
     * @param {number | string} [bool_or_str] 指定为true将tag_content(时间戳)的值转换为可读的字符串样式; `cont_or_func`如果是function, 此值指定为字符串会将标签内容指定为此值
     */
    createElement(tag_name, tag_attrib = {}, cont_or_func = '', bool_or_str = false) {
        const element = document.createElement(tag_name)
        Object.keys(tag_attrib).forEach((name) => {
            const value = tag_attrib[name]
            element.setAttribute(name, value)
        })

        const setInnerHtml = value => element.innerHTML = value

        switch (typeof cont_or_func) {
            case 'string':
                setInnerHtml(cont_or_func)
                break
            case 'number':
                if (!bool_or_str) {
                    setInnerHtml(cont_or_func)
                    break
                }
                setInnerHtml(App.toStrTime(cont_or_func))
                break
            case 'function':
                element.addEventListener('click', (event) => {
                    cont_or_func(event)
                })
                if (typeof bool_or_str === 'string') {
                    element.innerHTML = bool_or_str
                }
            default:
                break
        }
        return element
    }

    /**
     * (DOM)禁用一个DOM元素(强制设置disabled值)
     * @param {Element} element 传入元素
     * @param {boolean} is_disabled 是否禁用
     */
    disabledElement(element, is_disabled) {
        if (is_disabled) {
            element.classList.add('disabled')
            element.setAttribute('disabled', 'true')
        } else {
            element.classList.remove('disabled')
            element.removeAttribute('disabled')
        }
        return
    }

    /**
     * (DOM)(Element.appendChild)组合元素
     * @param {Element} root_element 根(父)元素
     * @param {any} child_elements 子元素
     * 
     */
    joinElement(root_element, child_elements) {
        if (child_elements instanceof Element) {
            return root_element.appendChild(child_elements)
        }
        
        // /**(!)这里可能会由于疏忽出现错误或漏洞
        //  * 获取对象中的`Element`
        //  * @param {any} obj 可遍历对象
        //  * @param {number} num 当前迭代次数
        //  * @param {number} max_num 最大迭代次数
        //  * @returns {undefined | Element[]}
        //  */
        // const getElements = (obj, num, max_num = 4) => {
        //     num += 1
        //     if (num <= max_num) return
        //     const elems = []
        //     Object.values(obj).forEach((item_obj) => {
        //         log(obj, 'obj:', item_obj)
        //         if (item_obj instanceof Element) {
        //             elems.push(item_obj)
        //             return
        //         }
        //         if (!Array.isArray(item_obj)) return
                
        //         const cont_obj = getElements(item_obj, num)
        //         if (!cont_obj) return
        //         elems.push(...cont_obj)
        //     })
        //     return elems.length > 0 ? elems : void 0
        // }


        // if (!(Array.isArray(child_elements))) child_elements = Object.values(child_elements)
        child_elements = Object.values(child_elements)
        child_elements.forEach((element) => {
            if (!(element instanceof Element)) return
            // getElements()
            root_element.appendChild(element)
        })
        // const elems = getElements(child_elements)
        // if (!elems) return
        // elems.forEach((element) => {
        //     root_element.appendChild(element)
        // })
    }

    /**(!)尚未测试
     * (DOM)获取对象内所有ID对应在DOM内的元素
     * @param {Object.<string, Object | string>} obj 需要获取元素的对象
     * @returns {Object.<string, Object | Element>}
     */
    getElements(obj) {
        let new_obj = {}
        this.forEachObject(obj, (key, value) => {
            if (!(typeof value === 'string')) {
                new_obj[key] = this.getElements(value)
            } else {
                new_obj[key] = getEBI(value)
            }
        })
        return new_obj
    }

    /**
     * (DOM)判断一个元素是否包含某个类名
     * @param {Element} element 
     * @param {string} class_name 
     */
    haveClassName(element, class_name) {
        let is_have = false
        element.classList.forEach((item) => {
            if (item === class_name) {
                is_have = true
            }
        })
        return is_have
    }

    /**
     * (DOM)获取一个属性内容的列表
     * @param {Element} element 
     * @param {string} attrib_name 属性名
     */
    getAttributeList(element, attrib_name) {
        const attrib_value = element.getAttribute(attrib_name)
        return attrib_value.split(' ')
    }

    /**
     * (DOM)向属性值后添加一个新的属性
     * @param {Element} element 
     * @param {string} attrib_name 属性名
     * @param {string} attrib_value 属性值
     */
    addAttributeValue(element, attrib_name, attrib_value) {
        const attrib_list = this.getAttributeList(element, attrib_name)
        attrib_list.push(attrib_value)
        const value = attrib_list.join(' ')

        element.setAttribute(attrib_name, value)
        return 
    }

    /**
     * (DOM)向属性值后删除一个属性
     * @param {Element} element 
     * @param {string} attrib_name 属性名
     * @param {string} attrib_value 属性值
     */
    removeAttributeValue(element, attrib_name, attrib_value) {
        const attrib_list = this.getAttributeList(element, attrib_name)
        const value = attrib_list.filter(value => value !== attrib_value).join(' ')

        element.setAttribute(attrib_name, value)
        return 
    }
    



    // 网页相关
    /**
     * 切换到指定URL
     * @param {string} url 指定URL
     */
    switchURL(url) {
        // if (!this.debug_mode) window.location.href = url
        if (!this.debug_mode) window.location.href = url
    }

    /**刷新网页 */
    reloadPage() {
        if (!this.debug_mode) location.reload()
        return
    }

    /**
     * 设置页面cookie
     * @param {string} key cookie字段
     * @param {string} value cookie值
     * @param {number} [max_age] cookie的有效时长(默认为半个月)
     * @param {string} [path='/'] cookie的路径
     */
    setCookie(key, value, max_age = 129600, path = '/') {
        const toURL = encodeURIComponent
        const cookie_value = `${toURL(key)}=${toURL(value)};max-age=${max_age};path=${path}`
        document.cookie = cookie_value
        console.debug('set cookie:', cookie_value)
        return
    }

    /**
     * 获取字符串查询的对象
     * @param {string} url 字符串查询内容
     */
    getSearchParam(url = window.location.search) {
        const params = new URLSearchParams(url)
        return params
    }

    // 账户相关
    /**登出用户 */
    logoutUser() {
        this.setCookie('login_token', '')
    }



    // /**
    //  * 初始化一个元素用于构建标签内内容
    //  * @param {Element | string} element 传入元素或
    //  * @param {string} id_name 默认ID名, 在没有传入Element的情况下会尝试获取该ID名的元素
    //  * @returns {element | null}
    //  */
    // _initElement(element, id_name) {
        
    //     if (!element) element = document.getElementById(id_name)
    //     if (!element) return null
    
    //     element.innerHTML = '' // 初始化根内容
    //     return element
    // }

    // msgBox
    /**
     * 初始化(创建)一个消息框
     * @param {Element} [element] 传入Element或留空
     */
    initMsgBox(element) {
        if (!element) { // 确保element有效
            element = document.getElementById('msg-box')
        }
        if (this.elems_msg_box) return 'is_init'
        if (!element) return 'element_not_exist'
        element.innerHTML = ''

        const create = this.createElement
        const join = this.joinElement

        const _box = { // 创建元素
            checkbox: create('input', {type: 'checkbox', id: 'msg-enter'}),
            overlay: create('label', {for: 'msg-enter', class: 'overlay'}),
            main: create('article'),
            root_main: {
                head: create('header'),
                root_head: {
                    title: create('h3'),
                    close: create('label', {for: 'msg-enter',class: 'close', disabled: true}, '&times;')
                },
                cont: create('section', {class: 'content'}),
                root_footer: create('footer'),
                footer: {
                    cancel: create('label', {for: 'msg-enter', class: 'cancel button error'}, '否'),
                    success: create('label', {for: 'msg-enter', class: 'button success'}, '是')
                }
            }
        }
        join(_box.root_main.root_footer, _box.root_main.footer)
        join(_box.root_main.head, _box.root_main.root_head)
        join(_box.main, _box.root_main)
        join(element, _box)
        element.className = 'modal'

        const _footer = _box.root_main.footer



        // listen click event...
        const _clickBox = (value) => {
            const callback = this.eventCallbacks.msgBox
            this.lockMsgBox(false)
            this.lockMsgBoxButton(true)

            if (typeof callback === 'function') {
                callback(value)
                this.eventCallbacks.msgBox = undefined
            }
        }

        // event - no
        _footer.cancel.addEventListener('click', () => {
            _clickBox(false)
        })
        // event - yes
        _footer.success.addEventListener('click', () => {
            _clickBox(true)
        })
        // event - close => no
        _box.root_main.root_head.close.addEventListener('click', () => {
            _clickBox(false)
        })




        this.elems_msg_box_all = _box
        this.elems_msg_box = {
            root: element,
            title: _box.root_main.root_head.title,
            content: _box.root_main.cont,
            button_no: _box.root_main.footer.cancel,
            button_yes: _box.root_main.footer.success,
            checkbox: _box.checkbox
        }
        
        console.debug('msg box init ok.')
        return ''
    }

    /**
     * 检查msgBox是否有效
     */
    validMsgBox() {
        if (!this.elems_msg_box) {
            console.error('message box not init.')
            return false
        }
        return true
    }

    /**
     * 锁定msgBox使其不允许关闭
     * @param {boolean} is_lock 是否锁定
     */
    lockMsgBox(is_lock) {
        if (!this.validMsgBox()) return
        this.elems_msg_box.checkbox.disabled = is_lock ? true : false
        return
    }

    /**
     * 锁定msgBox的按钮
     * @param {boolean} is_lock 是否锁定
     */
    lockMsgBoxButton(is_lock) {
        if (!this.validMsgBox()) return
        
        this.disabledElement(this.elems_msg_box.button_no, is_lock)
        this.disabledElement(this.elems_msg_box.button_yes, is_lock)
        return
    }

    /**
     * 打开一个 消息框 | 确认框
     * @param {string} title 标题
     * @param {string} content 内容
     * @param {'info' | 'warn' | 'error'} [type='info'] 提示类型,显示在标题的字体图标上
     * @param {string} [is_msg] 是否是消息框,若否则认定为确认框
     * @param {function(boolean)=} [callback] 回调函数, 返回用户确认信息
     */
    msgBox(title, content, type = 'info', is_msg = true, callback) {
        if (!this.validMsgBox()) return
        const es = this.elems_msg_box

        this.lockMsgBoxButton(false)
        es.checkbox.checked = true
        es.title.className = `icon-${type}`


        
        const addCallback = () => {
            if (typeof callback === 'function') {
                this.eventCallbacks.msgBox = callback
            }
        }

        if (is_msg) { // style - message
            es.root.setAttribute('data-style', 'message')

            addCallback()
        } else { // style - confirm
            es.root.setAttribute('data-style', 'confirm')

            this.lockMsgBox(true)
            addCallback()
        }

        es.title.innerText = title
        es.content.innerText = content

    }

    /**
     * (msgBox)[引用]打开一个错误框
     * @param {string} content 传入内容
     */
    errorBox(content) { this.msgBox(msgBoxText('error'), content, 'error') }
    /**
     * (msgBox)[引用]打开一个消息框, 以示完成了某个操作
     * @param {string} content 传入内容
     */
    finishBox(content) { this.msgBox(msgBoxText('finish'), content, 'info') }
    /**
     * (msgBox)[引用]打开一个确认框
     * @param {string} content 传入内容
     * @param {function(boolean)} callback 回调函数
     */
    confirmBox(content, callback) { this.msgBox(msgBoxText('confirm'), content, 'question', false, callback) }

    /**
     * 显示一个等待框
     * @param {boolean} is_wait 是否显示等待框
     * @param {string} [title] 等待时显示的标题
     * 
     * @returns {Element | undefined} 返回等待框内容的Element
     */
    waitBox(is_wait, title = ' ') {
        if (!this.elems_msg_box) return console.error('message box not init.')
        const es = this.elems_msg_box
        es.title.className = 'icon-spinner'
        if (is_wait) {
            es.title.innerText = msgBoxText('wait')
            es.content.innerText = ''
            es.root.setAttribute('data-style', 'wait')
        }

        es.checkbox.checked = is_wait
        this.lockMsgBox(is_wait)
        es.content.innerText = title
        return es.content
    }


    // head
    /**
     * 初始化一个页面导航栏
     * @param {Element} [element] DOM元素; 若不指定则自动在页面获取`page-nav`ID的DOM元素
     */
    initHeader(element, title = 'OnlineSong') {
        // 检查有效性
        if (!element) element = document.getElementById('page-nav')
        if (this.elems_header) return 'is_init'
        if (!element) return 'element_not_exist'

        element.innerHTML = '' // 初始化根内容

        // 创建引用
        const create = this.createElement
        const join = this.joinElement
        const text = (type, key) => this.getText(type, key)
        const src = this.src_url

        /**
         * 创建头部区域菜单条目
         * @param {string} title 标题
         * @param {string} path 链接的URL
         * @param {string} icon_class_name 字体图标的类名 /(TAG)字体图标/(common.css)
         * @param {boolean} [not_create] 不创建该元素
         */
        const createMenuItem = (title, path, icon_class_name, not_create = false) => {
            if (not_create) return void 0
            let attrib = {
                href: path,
                class: `pseudo button ${icon_class_name}`
            }

            if (path === this.page_path) { // 如果是这个页面的路径
                attrib.class += ' this' 
                // attrib.disabled = true
            }
            return create('a', attrib, title)
        }


        // 获取用户信息
        const user_avatar = this.user.avatar
        const user_name = this.user.name
        const have_admin = this.user.have_admin

        // 预创建内容
        const e_logo = create('img', { // logo在用户未登入的情况是, 但登入之后会被替换为用户头像
            class: user_avatar ? 'avatar' : 'logo',
            alt: user_avatar ? 'user avatar' : 'logo',
            src: valid(user_avatar, src.png_logo),
        })
        const e_title = create('span', { // 类似于上, 登入之后替换为用户名称
            class: user_name ? 'username' : 'title',
        }, valid(user_name, title))



        // (TSK) 将menu的search栏完善: 做好窄屏与宽屏的适配
        // menu_search 后需要添加到menu内 在添加近之前需要对元素进行整合
        // const e_menu_search = create('div', {class: 'lien'}) // 这个是menu_search的根
        // const menu_search = [
        //     create()
        // ]


        const menu = [ // /(TAG)导航栏菜单/
            create('div', { class: 'button logo' }, title), // 移动端菜单头部内容
            // e_menu_search, // 搜索框

            createMenuItem(pageNameText('home'), '/', 'icon-home'),
            createMenuItem(pageNameText('admin'), '/admin', 'icon-admin', !have_admin),
            createMenuItem(pageNameText('profile'), '/profile', 'icon-user'),
            createMenuItem(pageNameText('order'), '/order', 'icon-order'),
            createMenuItem(pageNameText('player'), '/player', 'icon-player'),
            // 调试页面只有在debug模式的时候显示
            createMenuItem(pageNameText('debug'), '/dev', 'icon-debug', !this.debug_mode),
        ]
        const header = {
            'brand': create('section', {'class': 'brand'}),
            'root_brand': {
                'logo': e_logo,
                'content': e_title
            },
            'checkbox': create('input', {'id': 'menu', 'type': 'checkbox', 'class': 'show'}),
            'expend_button': create('label', {for: 'menu', class: 'burger pseudo button'}, text('module', 'menu')),
            'menu': create('div', {class: 'menu'}),
            'root_menu': menu
        }

        join(header.menu, menu)
        join(header.brand, header.root_brand)
        join(element, header)
        
        this.elems_header_all = header
        this.elems_header = {
            logo: header.root_brand.logo,
            title: header.root_brand.content,
            menu: menu
        }

        console.debug('nav init ok.')
        return ''
    }


    // (可选项)back top
    /**
     * 初始化一个页面返回顶部的按钮(链接); 当滚动到下面时该元素会以置顶的形式出现在页面, 点击后会跳转到id为top的标签处
     * @param {string} id_name 按钮(链接)的ID名
     */
    initBackTop(id_name = 'go-top') {
        let e_main = document.getElementById(id_name)
        if (e_main) return 'is_exist'
        e_main = this.createElement('a', {id: id_name, href: '#top', 'data-style': 'hidden', class: 'back-top icon-top button no-margin'})

        document.body.appendChild(e_main)

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                e_main.setAttribute('data-style', 'show')
            } else {
                e_main.setAttribute('data-style', 'hidden')
            }
        })
    }


    // (可选项)audio control
    /**
     * 初始化一个音频控制显示的条, 并给音频添加一个键盘的快捷方式
     * @param {HTMLAudioElement} audio_elem audio元素
     */
    initAudioControl(audio_elem, id_name = 'audio-bar') {
        if (!(audio_elem instanceof HTMLAudioElement)) return 'invalid_param'
        if (!(typeof id_name === 'string')) return 'missing_param'

        // DOM...
        const e_main = getEBI(id_name)
        const e_content = createElement('h2', {class: 'content no-margin icon-volume-medium min-icon'})
        join(e_main, e_content)
        
        let an_timeout
        // listen key event
        document.body.addEventListener('keydown', (event) => {
            const key_code = event.key
            const volume = audio_elem.volume
            audio_elem.volume = ((volume * 10) | 0) / 10
            if (key_code.slice(0, 5) === 'Arrow') {
                switch (key_code) {
                    case 'ArrowUp':
                        event.preventDefault()
                        if (volume < 1) {
                            audio_elem.volume += .1
                        }
                        
                        break
                    case 'ArrowDown':
                        event.preventDefault()
                        if (volume > .1) {
                            audio_elem.volume -= .1
                        }

                        break
                    default:
                        return
                }
                e_content.innerText = (audio_elem.volume * 100) | 0
                clearTimeout(an_timeout)
                e_main.classList.add('show')
                an_timeout = setTimeout(() => {
                    e_main.classList.remove('show')
                }, 1000)
            }
        })
    }
}

class Lyric {
    /**
     * 构建一个歌词类
     * @param {string} lyric_str 传入歌词
     * @param {string} [sub_lyric_str] 传入副歌词
     */
    constructor(lyric_str, sub_lyric_str) {
        /**
         * 歌词内容
         * @typedef {Object.<number, string>} lyricItem 歌词内容
         * @type {[lyricItem, lyricItem | undefined]}
         */
        this.lyrics = [this.getList(lyric_str)]
        if (sub_lyric_str) this.lyrics[1] = this.getList(sub_lyric_str)
        log('lyric:', this.lyrics)

        
    }

    /**
     * 格式化歌词, 获取歌词列表
     * @param {string} lyric_str 传入歌词
     */
    getList(lyric_str) {
        /**原始内容 */
        const org_list = lyric_str.split('\n')
        /**处理后的内容 @type {Object.<number, string>} */
        const list = {}


        org_list.forEach((lyric_item) => {
            // `[tag_data]string...` => `[tag_data]`
            const _tag = lyric_item.match(/\[([^\]]+)\]/g)
            // `[tag_data]string...` => [`string...`] | null
            const str_items = lyric_item.match(/(?<=\][^\[]*)[^\[]*$/)
            // [`string...`] => `string...` | null => ``
            const str = str_items ? str_items[0] : ''
            // tag:null => return
            if (!_tag) return
            // `[tag_data]` => `tag_data`
            const tag = _tag.map((item => item.slice(1, -1)))
            // ...tag
            tag.forEach((tag_item) => {
                // `key:value` => ['key', 'value']
                const tag_data = tag_item.split(':')
                const tag_key = tag_data[0] // lyric 标准格式的 id tag,
                const tag_value = tag_data[1]
                // `123` => 123 | `by` => NaN
                // 在是ID-tags时为NaN, 在Time-tag时为number
                const time_min = +tag_key
                if (!isNaN(time_min)) {
                    // 是Time-tag
                    const time_sec = +tag_value
                    const time = (time_min * 60) + time_sec
                    // push
                    list[time] = str
                }
                // 处理ID-tags

            })
        })

        return list
    }

    /**
     * 获取当前时间对应的歌词
     * @param {number} now_time 当前播放时间
     * @param {number} [lyric_track] 需要获取的歌词轨道(`this.lyrics`的索引)
     * @returns {number}
     */
    get(now_time, lyric_track = 0) {
        let output = 0
        // 处理歌词
        const lyric = this.lyrics[lyric_track]
        let lyric_time = 0
        // {123.45: `content...`, ...} => [123.45, ...]
        const axis = Object.keys(lyric)
        // forEach不支持中途退出, 改用传统for循环
        // axis.forEach((time) => {
        //     if (now_time >= time) {
        //     }
        // })

        // 此表达式下歌词为空
        if (axis[0] > now_time) return 0

        let _last_time = 0
        // (FIX)无法按预期实现
        // [123.45, ...] => for(123.45); ...
        for (const time of axis) {
            // log('now:', now_time, '>', 'time:', time, 'cont:', lyric[time])
            if (now_time > time) {
                _last_time = time
                continue
            }
            lyric_time = _last_time
            break
        }

        return lyric_time
    }
}



// init object
const app = new App()

// init ref
const text = (type, key) => app.getText(type, key)
const msgBoxText = key => text('msg_box', key)
const itemText = key => text('item', key)
const serverText = key => text('server', key)
const pageNameText = key => text('page_name', key)
const errorText = key => text('error', key)
const log = console.log

const createElement = app.createElement
const join = app.joinElement


// init page...
const _initPage = () => {
    // 初始化网页图标
    const eHeadFavicon = document.createElement('link')
    eHeadFavicon.rel = 'shortcut icon'
    eHeadFavicon.href = app.getStaticUrl('favicon.ico')

    document.head.appendChild(eHeadFavicon)
}
_initPage()

