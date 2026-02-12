const select = require('./select');
const request = require('../request');
const { getManagedCacheStorage } = require('../cache');

const track = (info) => {
	// Credit: This API is provided by GD studio (music.gdstudio.xyz).
	// ===== 核心修改1：规范参数拼接（避免手动拼接的编码问题）=====
	const br = select.ENABLE_FLAC ? '999' : '320'; // 简化原有slice逻辑，结果一致且更易读
	const params = new URLSearchParams({
		types: 'url',
		source: 'netease',
		id: info.id,
		br: br
	});
	const url = `https://music-api.gdstudio.xyz/api.php?${params.toString()}`;

	// ===== 核心修改2：给request添加浏览器请求头（解决443关键）=====
	const requestOptions = {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Accept': 'application/json, text/plain, */*'
		},
		// 可选：禁用代理（如果有代理导致443，和Python的trust_env=false对应）
		proxy: false
	};

	// ===== 调用request并修复逻辑BUG =====
	return request('GET', url, requestOptions) // 传入请求头配置
		.then((response) => response.json())
		.then((jsonBody) => {
			// ===== 核心修改3：修复(!'url') in jsonBody的致命逻辑BUG =====
			if (
				jsonBody &&
				typeof jsonBody === 'object' &&
				!('url' in jsonBody) // 正确判断：jsonBody中没有url字段
			)
				return Promise.reject(new Error('返回结果无有效url字段'));

			return jsonBody.br > 0 ? jsonBody.url : Promise.reject(new Error('音质参数无效'));
		});
};

const cs = getManagedCacheStorage('provider/pyncmd');
const check = (info) => cs.cache(info, () => track(info));

module.exports = { check };