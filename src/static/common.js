class App {
    static_url = '/src'
    constructor() {
        this.mod = {
            xhr: new XMLHttpRequest()
        }
    }


    // 请求相关
    /**
     * 创建一个xhr请求
     * @param {string} method 请求方法
     * @param {string} url 请求的URL
     * @param {object} data 请求体
     * @param {function(number, any)} callback 回调函数,传入状态码与响应体
     */
    makeXhr(method = 'GET', url = '', data, callback) {
        const xhr = this.mod.xhr
        xhr.abort() // 关闭上一个连接
        xhr.open(method, url)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.onerror = () => {
            callback(xhr.status, xhr.response)
        }
        xhr.onload = () => {
            callback(xhr.status, xhr.response)
        }

        xhr.send(JSON.stringify(data))
    }

    /**
     * 创建一个fetch请求
     * @param {string} method 请求方法
     * @param {string} url 请求的URL
     * @param {object} data 请求体
     * @param {function(any | null)} callback 回调函数,传入响应体
     */
    fetch (method = 'GET', url = '', data, callback) {
        if (!callback | !data) {
            console.error()
            
        }
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then((data) => {
            callback(data)
        })
        .catch((error) => {
            console.error(error)
            callback(null)
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
