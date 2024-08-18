class App {
    static_url = '/src'
    debug_mode = true
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

            }
        }
    }
    
    constructor(lang = 'zh-CN') {
        // elem_... 表示Element, 在本类中通常表示一个全局Element;
        // elems_... 表示Elements, 在本类中通常表示一个全局Object内是Element
        const _text = this.lang_text[lang]
        this.text = _text ? _text : Object.keys(this.lang_text)[0]
        this.mod = {
            xhr: new XMLHttpRequest()
        }

        // init...
        document.addEventListener('DOMContentLoaded', () => {
            this.initMsgBox()
        })
    }

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
        element.innerText = tag_content
        return element
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

    /**
     * 初始化(创建)一个消息框
     * @param {Element} [element] 传入Element或留空
     */
    initMsgBox(element) {
        if (!element) { // 确保element有效
            element = document.getElementById('msg-box')
        }
        if (this.elems_msg_box) return false
        if (!element) return false
        element.innerHTML = ''

        const create = this.createElement
        const join = this.joinElement

        const _box = { // 创建元素
            checkbox: create('input', {type: 'checkbox', id: 'msg-enter'}),
            overlay: create('label', {for: 'msg-enter', class: 'overlay'}),
            root_main: create('article'),
            main: {
                root_head: create('header'),
                head: {
                    title: create('h3'),
                    close: create('label', {for: 'msg-enter',class: 'close', disabled: true}, '×')
                },
                cont: create('section', {class: 'content'}),
                root_footer: create('footer'),
                footer: {
                    cancel: create('label', {for: 'msg-enter', class: 'cancel button error'}, '否'),
                    success: create('label', {for: 'msg-enter', class: 'button success'}, '是')
                }
            }
        }
        join(_box.main.root_footer, _box.main.footer)
        join(_box.main.root_head, _box.main.head)
        join(_box.root_main, _box.main)
        join(element, _box)
        element.className = 'modal'

        this.elems_msg_box_all = _box
        this.elems_msg_box = {
            root: element,
            title: _box.main.head.title,
            content: _box.main.cont,
            button_no: _box.main.footer.cancel,
            button_yes: _box.main.footer.success,
            checkbox: _box.checkbox
        }
        console.log('msg box init ok.')
        return true
    }

    /**
     * 打开一个 消息框 | 确认框
     * @param {string} title 标题
     * @param {string} content 内容
     * @param {string} [is_msg] 是否是消息框,若否则认定为确认框
     * @param {function(boolean)=} [callback] 回调函数, 返回用户确认信息
     */
    msgBox(title, content, is_msg = true, callback) {
        if (!this.elems_msg_box) return console.error('message box not init.')
        const es = this.elems_msg_box

        es.checkbox.checked = true

        if (is_msg) { // message样式
            es.root.setAttribute('data-style', 'message')
        } else { // confirm样式
            es.root.setAttribute('data-style', 'confirm')
            es.button_no.addEventListener('click', () => {
                callback(false)
            })
            es.button_yes.addEventListener('click', () => {
                callback(true)
            })
        }

        es.title.innerText = title
        es.content.innerText = content

    }
}

// init object

const app = new App()

// init function
const valid = (value, normal) => { return value ? value : normal }

// init page...
const _initPage = () => {
    // 初始化网页图标
    const eHeadFavicon = document.createElement('link')
    eHeadFavicon.rel = 'shortcut icon'
    eHeadFavicon.href = app.getStaticUrl('favicon.ico')

    document.head.appendChild(eHeadFavicon)
}
_initPage()

