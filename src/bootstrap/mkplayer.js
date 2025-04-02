const https = require('https');

async function initializeMkPlayer() {
    return new Promise((resolve, reject) => {
        https.get('https://music.gdstudio.xyz/js/player.js', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    // 执行获取到的JavaScript代码来初始化mkPlayer
                    eval(data);
                    // 检查mkPlayer是否成功初始化
                    if (typeof global.mkPlayer === 'undefined') {
                        global.mkPlayer = mkPlayer;
                    }
                    resolve();
                } catch (error) {
                    reject(new Error('Failed to initialize mkPlayer: ' + error.message));
                }
            });
        }).on('error', (error) => {
            reject(new Error('Failed to fetch player.js: ' + error.message));
        });
    });
}

module.exports = initializeMkPlayer;