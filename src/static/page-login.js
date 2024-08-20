// /(TAG)登入API方法/
const param_obj = app.getSearchParam()

const param = {
    'from': valid(param_obj.get('from'), '/'),
    'type': valid(param_obj.get('type'), 'need_login')
}
const disabled = app.disabledElement


const es_main = {
    'login': {
        check: getEBI('tab-login'),

        name: getEBI('login-username'),
        password: getEBI('login-password'),
        submit: getEBI('submit-login'),
    },
    'register': {
        check: getEBI('tab-register'),

        name: getEBI('register-username'),
        password: getEBI('register-password'),
        rpassword: getEBI('register-rpassword'),
        submit: getEBI('submit-register'),
    },
    change: {
        'password': {
            check: getEBI('tab-change-password'),

            user_name: getEBI('change-username'),
            password: getEBI('change-password'),
            submit: getEBI('submit-password'),
        },
        'name': {
            check: getEBI('tab-change-name'),

            input: getEBI('new-name'),
            submit: getEBI('submit-name'),
        },
        'avatar': {
            check: getEBI('tab-change-avatar'),

            input: getEBI('new-avatar'),
            preview: getEBI('new-avatar-preview'),
            submit: getEBI('submit-avatar'),
        },
    },
    'logout': {
        check: getEBI('tab-logout'),

        submit: getEBI('submit-logout'),
    },
}


app.listenerInit((err) => {
    const es_change = es_main.change
    if (err) console.error(err)
    if (app.user.name) {
        disabled(es_main.login.check, true)
        disabled(es_main.register.check, true)
        es_main.logout.check.checked = true

        es_change.avatar.preview.src = app.user.avatar
    } else {
        disabled(es_main.logout.check, true)
        disabled(es_change.name.check, true)
        disabled(es_change.avatar.check, true)
    }



    es_main.login.submit.addEventListener('click', () => {
        const es = es_main.login
        const name = es.name.value
        const password = es.password.value
        
        app.waitBox(true, '正在登入...')
        app.useAPI({
            'type': 'login',
            'name': name,
            'password': password
        }, (res_data) => {
            app.waitBox(false)
            if (!res_data) {
                app.msgBox('登入失败', 'bad_request', 'error')
                return
            }
            if (!res_data.valid) {
                app.msgBox('登入失败', app.getText('msg_box', res_data.message), 'error')
                return
            }
            const login_token = res_data.data.token
            app.setCookie('login_token', login_token)
            const e_wait_cont = app.waitBox(true, '')
            const e_link = app.createElement('a', {
                'href': param.from,
                'title': 'target'
            }, param.from).outerHTML
            app.setCountdown(3, (time) => {
                e_wait_cont.innerHTML = `登入成功，${time}秒后自动跳转到${e_link}。`
                if (time === 0) {
                    app.switchURL(param)
                }
            })
        })
    })
    
    es_main.register.submit.addEventListener('click', () => {
    
    })

    es_change.password.submit.addEventListener('click', () => {
    
    })
    
    es_main.logout.submit.addEventListener('click', () => {
        app.msgBox('确认', '确定要登出吗？', 'question', false, (confirm) => {
            if (!confirm) return
            app.logoutUser()
            app.reloadPage()
        })
    })

    es_change.avatar.input.addEventListener('change', () => {
        const e_preview = es_change.avatar.preview
        const e_input = es_change.avatar.input
        const file = e_input.files[0]
        console.debug('create preview')
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                e_preview.src = event.target.result
            }
            reader.readAsDataURL(file)
        }
    })

    es_change.avatar.submit.addEventListener('click', () => {
        const e_input = es_change.avatar.input
        /**@type {File} */
        const file = e_input.files[0]
        const type_reg = /^image\//
        if (!type_reg.test(file.type)) {
            app.msgBox('错误', '不支持的文件类型', 'warn')
        }
        app.useAPI({'type': 'change', 'target': 'avatar', 'value': file}, (value) => {
            console.log(value)
        })
    })
})