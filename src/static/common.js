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
    // makeXhr(method = 'GET', url = '', data, callback) {
    //     const xhr = this.mod.xhr
    //     xhr.abort() // 关闭上一个连接
    //     xhr.open(method, url)
    //     xhr.setRequestHeader('Content-Type', 'application/json')
    //     xhr.onerror = () => {
    //         callback(xhr.status, xhr.response)
    //     }
    //     xhr.onload = () => {
    //         callback(xhr.status, xhr.response)
    //     }

    //     xhr.send(JSON.stringify(data))
    // }

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



// app.makeFetch('POST', '/api', {'stat': 'ok'}, (value) => {
//     console.log(value)
// })
