// /(TAG)登入API方法/
const param_obj = app.getSearchParam()

// page
const param = {
    'from': valid(param_obj.get('from'), '/'),
    'type': valid(param_obj.get('type'), 'need_login')
}

// ref
const disabled = app.disabledElement

// get
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

/**@param {File} file @param {function(ArrayBuffer | string) callback} @param {function} err_callback */
const readFile = (file, callback, is_buffer = false, have_box = true, err_callback) => {
    const box = (str) => {
        if (have_box) app.errorBox(msgBoxText(str))
        if (typeof err_callback === 'function') err_callback()
    }
    const type_reg = /^image\//

    if (!file) { return box('please_select_file') }
    if (!type_reg.test(file.type)) { return box('not_support_file') }

    const reader = new FileReader()
    reader.onload = (event) => {
        callback(event.target.result)
    }
    is_buffer ? reader.readAsArrayBuffer(file) : reader.readAsDataURL(file)
}

app.listenerInit((err) => {
    // ref
    const es_change = es_main.change
    const es_c_avatar = es_change.avatar
    const es_c_name = es_change.name
    const es_c_password = es_change.password
    if (err) console.error(err)
    if (app.user.name) {
        disabled(es_main.login.check, true)
        disabled(es_main.register.check, true)
        es_main.logout.check.checked = true

        es_c_avatar.preview.src = app.user.avatar
    } else {
        disabled(es_main.logout.check, true)
        disabled(es_c_name.check, true)
        disabled(es_c_avatar.check, true)
    }


    // listen event...

    
    // login
    es_main.login.submit.addEventListener('click', () => {
        const es = es_main.login
        const name = es.name.value
        const password = es.password.value
        
        app.waitBox(true, msgBoxText('logging'))
        app.useAPI({
            'type': 'login',
            'name': name,
            'password': password
        }, (res_data) => {
            app.waitBox(false)
            if (!res_data) {
                app.msgBox(msgBoxText('login_fail'), msgBoxText('bad_request'), 'error')
                return
            }
            if (!res_data.valid) {
                app.msgBox(msgBoxText('login_fail'), msgBoxText(res_data.message), 'error')
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
    
    // register
    es_main.register.submit.addEventListener('click', () => {
    
    })

    // change password
    es_c_password.submit.addEventListener('click', () => {
    
    })
    
    // logout
    es_main.logout.submit.addEventListener('click', () => {
        app.msgBox(msgBoxText('confirm'), msgBoxText('confirm_logout'), 'question', false, (confirm) => {
            if (!confirm) return
            app.logoutUser()
            app.reloadPage()
        })
    })

    // change avatar - preview
    es_c_avatar.input.addEventListener('change', () => {
        const e_preview = es_c_avatar.preview
        const e_input = es_c_avatar.input
        const file = e_input.files[0]
        readFile(file, (src) => {
            e_preview.src = src
        }, false, true, () => {
            e_preview.src = app.user.avatar
        })
    })

    // change avatar - submit
    es_c_avatar.submit.addEventListener('click', () => {
        const e_input = es_c_avatar.input
        /**@type {File} */
        const file = e_input.files[0]
        readFile(file, (data) => {
            log(data)
        }, true)
        // app.makeChange('avatar', file, (res_data) => {

        // })
    })

    // change name
    es_c_name.submit.addEventListener('click', () => {

    })
})