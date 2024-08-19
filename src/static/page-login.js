// /(TAG)登入API方法/

const es_main = {
    'login': {
        name: getEBI('login-username'),
        password: getEBI('login-password'),
        submit: getEBI('submit-login'),
    },
    'register': {
        name: getEBI('register-username'),
        password: getEBI('register-password'),
        rpassword: getEBI('register-rpassword'),
        submit: getEBI('submit-register'),
    },
    'change': {
        user_name: getEBI('change-username'),
        password: getEBI('change-password'),
        submit: getEBI('submit-change'),
    },
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
        if (!res_data.valid) {
            app.msgBox('登入失败', app.getText('msg_box', res_data.message))
        }
        const login_token = res_data.data.token
        console.log(res_data, login_token)
        document.cookie = `login_token=${login_token}`
    })
})
