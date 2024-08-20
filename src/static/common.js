// init function
const valid = (value, normal) => { return value ? value : normal }
/**
 * [简](document.getElementById)获取页面的元素
 * @param {string} id_name 传入ID name
 */
const getEBI = (id_name) => {return document.getElementById(id_name)}


// definition class
class App {
    static_url = '/src'
    debug_mode = true
    api_url = '/api'
    /**是否初始化完成 */
    is_init = false
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

            },
            module: {
                'menu': '菜单',
            },
            page_name: {
                'home': '主页',
                'order': '点歌',
                player: '播放',
                profile: '我的',
            },
            msg_box: {
                password_error: '密码错误。',
                name_not_found: '用户名不存在。',
                id_not_found: 'ID不存在。',
                bad_request: '错误的请求。',
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
            msg_box: {
                yes: () => {},
                no: () => {}
            }
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
            }
            appendErr(this.initMsgBox())
            appendErr(this.initHeader())
            this.is_init = true
            if (this._initCallback) this._initCallback()
        })
    }

    /**
     * 监听`App`初始化完成
     * @param {function(Array.<string> | undefined)} callback 回调函数, 传入初始化时错误信息
     */
    listenerInit(callback) {
        this._initCallback = () => {
            const err = this.init_err_list
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
     * 
     * @returns {undefined | object | null} 未传入回调函数将会返回对象(请求成功)或空值(请求失败)
     */
    makeFetch(method = 'GET', url = '', data, callback) {
        if (!method | !url | !data | !callback) { // 未传入任意参数将报错
            console.error()
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
                    return response.json().catch(() => ({}))
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
                return callback(null)
            })
    }

    /**
     * 使用服务端API与其通讯
     * @param {object} data 传入对象
     * @param {function(object)=} callback 传入回调函数
     */
    useAPI(data, callback) {
        this.makeFetch('POST', this.api_url, data, callback)
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




    // 工具函数-dom相关
    /**
     * 获取从HTML模板渲染引擎获得的值
     * @param {string} meta_name meta的name属性
     */
    getMetaData(meta_name) {
        // /(TAG)传递数据的meat元素/ 在这里取值
        const e_meta = document.querySelector(`meta[name=data-${meta_name}]`)
        const data = e_meta ? e_meta.getAttribute('content') : ''
        return data
    }

    /**
     * (document.createElement)创建一个元素
     * @param {string} tag_name 传入标签名
     * @param {Object.<string, string>} tag_attrib 标签的属性
     * @param {string} tag_content 标签内容
     */
    createElement(tag_name, tag_attrib = {}, tag_content = '') {
        const element = document.createElement(tag_name)
        Object.keys(tag_attrib).forEach((name) => {
            const value = tag_attrib[name]
            element.setAttribute(name, value)
        })
        element.innerHTML = tag_content
        return element
    }

    /**
     * 禁用一个DOM元素(强制设置disabled值)
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
     * (Element.appendChild)组合元素
     * @param {Element} root_element 根(父)元素
     * @param {Array.<Element> | Object.<string, Element>} child_elements 子元素
     */
    joinElement(root_element, child_elements) {
        if (!(child_elements instanceof Array)) child_elements = Object.values(child_elements)
        child_elements.forEach((element) => {
            if (!(element instanceof Element)) return
            root_element.appendChild(element)
        })
    }



    // 网页相关
    /**
     * 切换到指定URL
     * @param {string} url 指定URL
     */
    switchURL(url) {
        if (!this.debug_mode) window.location.href = url
    }

    /**刷新网页 */
    reloadPage() {
        location.reload()
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
        const _callback = this.eventCallbacks.msg_box
        _footer.cancel.addEventListener('click', () => {
            this.lockMsgBox(false)
            this.lockMsgBoxButton(true)
            _callback.no(false)
        })
        _footer.success.addEventListener('click', () => {
            this.lockMsgBox(false)
            this.lockMsgBoxButton(true)
            _callback.yes(true)
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

        if (is_msg) { // message样式
            es.root.setAttribute('data-style', 'message')
        } else { // confirm样式
            es.root.setAttribute('data-style', 'confirm')

            this.lockMsgBox(true)
            const _callback = this.eventCallbacks.msg_box
            _callback.no = callback
            _callback.yes = callback
        }

        es.title.innerText = title
        es.content.innerText = content

    }

    /**
     * 显示一个等待框
     * @param {boolean} is_wait 是否显示等待框
     * @param {string} [title] 等待时显示的标题
     * 
     * @returns {Element | undefined} 返回等待框内容的Element
     */
    waitBox(is_wait, title) {
        if (!this.elems_msg_box) return console.error('message box not init.')
        const es = this.elems_msg_box
        es.title.className = 'icon-spinner'
        if (is_wait) {
            es.title.innerText = '请稍等'
            es.root.setAttribute('data-style', 'wait')
        }

        es.checkbox.checked = is_wait
        this.lockMsgBox(is_wait)
        if (title) es.content.innerText = title
        return es.content
    }


    // head
    /**
     * 初始化一个页面导航栏
     * @param {Element} [element] DOM元素; 若不指定则自动在页面获取`page-nav`ID的DOM元素
     */
    initHeader(element, title = 'OnlineSong') {
        if (!element) element = document.getElementById('page-nav')
        if (this.elems_header) return 'is_init'
        if (!element) return 'element_not_exist'
        element.innerHTML = ''

        const create = this.createElement
        const join = this.joinElement
        const text = (type, key) => this.getText(type, key)
        const src = this.src_url

        const user_avatar = this.user.avatar
        const user_name = this.user.name

        const e_logo = create('img', {
            class: user_avatar ? 'avatar' : 'logo',
            alt: user_avatar ? 'user avatar' : 'logo',
            src: valid(user_avatar, src.png_logo),
        })
        const e_title = create('span', {
            class: user_name ? 'username' : 'title',
        }, valid(user_name, title))

        const menu = [
            create('div', {href: '/', class: 'button logo'}, title),
            create('a', {href: '/', class: 'pseudo button icon-home'}, text('page_name', 'home')),
            create('a', {href: '/profile', class: 'pseudo button icon-user'}, text('page_name', 'profile')),
            create('a', {href: '/order', class: 'pseudo button icon-order'}, text('page_name', 'order')),
            create('a', {href: '/player', class: 'pseudo button icon-player'}, text('page_name', 'player')),
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
}


// init object

const app = new App()


// init page...
const _initPage = () => {
    // 初始化网页图标
    const eHeadFavicon = document.createElement('link')
    eHeadFavicon.rel = 'shortcut icon'
    eHeadFavicon.href = app.getStaticUrl('favicon.ico')

    document.head.appendChild(eHeadFavicon)
}
_initPage()

