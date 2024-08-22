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


/**@param {File} file @param {function(string) callback} @param {function} err_callback */

const readFile = (file, callback, have_box = true, err_callback) => {
    const box = (str) => {
        if (have_box) app.errorBox(msgBoxText(str))
        if (typeof err_callback === 'function') err_callback()
    }
    const type_reg = /^image\//

    if (!file) { return box('please_select_file') }
    if (!type_reg.test(file.type)) { return box('not_support_file') }

    const reader = new FileReader()
    reader.onload = (event) => {
        const data = event.target.result
        // log(data.length, 1000000)
        if (data.length >= 1000000) {
            es_main.change.avatar.input.value = ''
            return box('check_file_too_big')
        }
        
        callback(data)
    }
    
    reader.readAsDataURL(file)
}

app.listenInit((err) => {
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
            const target_url = param.from
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
                'href': target_url,
                'title': 'target'
            }, target_url).outerHTML
            app.setCountdown(3, (time) => {
                e_wait_cont.innerHTML = `登入成功，${time}秒后自动跳转到${e_link}。`
                if (time === 0) {
                    app.switchURL(target_url)
                }
            })
        })
    })
    
    // register
    es_main.register.submit.addEventListener('click', () => {
        const es = es_main.register
        const name = es.name.value
        const password = es.password.value
        const rpassword = es.rpassword.value
        if (!password || !rpassword || !name) return app.errorBox(msgBoxText('please_input'))
        if (password !== rpassword) return app.errorBox(msgBoxText('password_mismatch'))
        app.waitBox(true)
        

        app.useAPI({type: 'register', name: name, password: password}, (res_data) => {
            app.waitBox(false)
            if (!res_data) return app.errorBox(msgBoxText('bad_request'))
            const {valid, message} = res_data
            if (!valid) return app.errorBox(serverText(message))
            
            const es_login = es_main.login
            es_login.name.value = name
            es_login.password.value = password
            es_login.check.checked = true
            
            app.finishBox(msgBoxText('register_user_finish'))

        })
    })

    // change password
    es_c_password.submit.addEventListener('click', () => {
    
    })
    
    // logout
    es_main.logout.submit.addEventListener('click', () => {
        app.confirmBox(msgBoxText('confirm_logout'), (confirm) => {
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
        }, true, () => {
            e_preview.src = app.user.avatar
        })
    })

    // change avatar - submit
    es_c_avatar.submit.addEventListener('click', () => {
        const e_input = es_c_avatar.input
        /**@type {File} */
        const file = e_input.files[0]
        readFile(file, (data) => {
            app.makeChange('avatar', data, (res_data) => {
                if (!res_data) return app.errorBox(msgBoxText('bad_request'))
                const valid = res_data.valid
                const err = res_data.message
                const src = res_data.data.src

                if (!valid) return app.errorBox(serverText(err))
                app.finishBox(msgBoxText('change_avatar_finish'))
                app.user.element.avatar.src = src
            })
        }, true)
    })

    // change name
    es_c_name.submit.addEventListener('click', () => {
        const new_name = es_c_name.input.value
        if (!new_name) return app.errorBox(msgBoxText('input_is_null'))
        app.makeChange('name', new_name, (res_data) => {
            const valid = res_data.valid
            const err = res_data.message
            
            if (!valid) return app.errorBox(serverText(err))
            app.finishBox(msgBoxText('change_name_finish'))
            app.user.element.name.innerText = new_name
        })
    })
})