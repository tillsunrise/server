const select = require('./select');
// 移除原来的 request，引入 cloudscraper
const cloudscraper = require('cloudscraper');
const { getManagedCacheStorage } = require('../cache');

const track = (info) => {
	// Credit: This API is provided by GD studio (music.gdstudio.xyz).
	const url =
		'https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=' +
		info.id +
		'&br=' +
		['999', '320'].slice(
			select.ENABLE_FLAC ? 0 : 1,
			select.ENABLE_FLAC ? 1 : 2
		);

	// 配置 cloudscraper 选项
	const options = {
		uri: url,
		json: true, // 自动解析 JSON
		headers: {
			// 模拟浏览器 Header，增加通过率
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			Accept: 'application/json, text/plain, */*',
			Referer: 'https://music-api.gdstudio.xyz/',
		},
	};

	// 使用 cloudscraper 替代 request
	return cloudscraper(options)
		.then((jsonBody) => {
			// 保留你原有的校验逻辑
			if (
				jsonBody &&
				typeof jsonBody === 'object' &&
				(!'url') in jsonBody
			)
				return Promise.reject(new Error('Response missing url field'));

			return jsonBody.br > 0
				? jsonBody.url
				: Promise.reject(new Error('Invalid bitrate'));
		})
		.catch((err) => {
			// 打印一下错误信息方便调试，生产环境可移除
			console.error(
				`[GDStudio API Error] ID: ${info.id}`,
				err.message || err
			);
			return Promise.reject(err);
		});
};

const cs = getManagedCacheStorage('provider/pyncmd');
const check = (info) => cs.cache(info, () => track(info));

module.exports = { check };
