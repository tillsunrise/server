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
                    // 使用正则表达式提取version属性
                    const versionMatch = data.match(/version[\s]*:[\s]*['"]([^'"]+)['"]/);
                    if (!versionMatch) {
                        throw new Error('Could not find version in player.js');
                    }

                    // 创建mkPlayer对象
                    global.mkPlayer = {
                        version: versionMatch[1]
                    };
                    console.log(global.mkPlayer)
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