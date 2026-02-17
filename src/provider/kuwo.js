const insure = require('./insure');
const select = require('./select');
const crypto = require('../crypto');
const request = require('../request'); // 保留 request，给 search 用
const cloudscraper = require('cloudscraper'); // 新增引入 cloudscraper
const { getManagedCacheStorage } = require('../cache');

const format = (song) => ({
	id: song.MUSICRID.split('_').pop(),
	name: song.SONGNAME,
	// duration: song.songTimeMinutes.split(':').reduce((minute, second) => minute * 60 + parseFloat(second), 0) * 1000,
	duration: song.DURATION * 1000,
	album: { id: song.ALBUMID, name: song.ALBUM },
	artists: song.ARTIST.split('&').map((name, index) => ({
		id: index ? null : song.ARTISTID,
		name,
	})),
});

const search = (info) => {
	const keyword = encodeURIComponent(info.keyword.replace(' - ', ' '));
	const url =
		'http://search.kuwo.cn/r.s?&correct=1&vipver=1&stype=comprehensive&encoding=utf8' +
		'&rformat=json&mobi=1&show_copyright_off=1&searchapi=6&all=' +
		keyword;

	// search 函数继续使用原本的 request
	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			if (
				!jsonBody ||
				jsonBody.content.length < 2 ||
				!jsonBody.content[1].musicpage ||
				jsonBody.content[1].musicpage.abslist.length < 1
			)
				return Promise.reject();
			const list = jsonBody.content[1].musicpage.abslist.map(format);
			const matched = select(list, info);
			return matched ? matched.id : Promise.reject();
		});
};

const track = (id) => {
	// Credit: This API is provided by GD studio (music.gdstudio.xyz).
	const url =
		'https://music-api.gdstudio.xyz/api.php?types=url&source=kuwo&id=' +
		id +
		'&br=' +
		['999', '320'].slice(
			select.ENABLE_FLAC ? 0 : 1,
			select.ENABLE_FLAC ? 1 : 2
		);

	// 配置 cloudscraper
	const options = {
		uri: url,
		json: true,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Accept': 'application/json, text/plain, */*',
			'Referer': 'https://music-api.gdstudio.xyz/'
		}
	};

	return cloudscraper(options)
		.then((jsonBody) => {
			if (
				jsonBody &&
				typeof jsonBody === 'object' &&
				(!'url') in jsonBody
			)
				return Promise.reject();

			return jsonBody.br > 0 ? jsonBody.url : Promise.reject();
		})
		.catch((err) => {
			console.error(`[GDStudio Kuwo Error] ID: ${id}`, err.message || err);
			return Promise.reject(err);
		});
};

const cs = getManagedCacheStorage('provider/kuwo');
const check = (info) => cs.cache(info, () => search(info)).then(track);

module.exports = { check, track };