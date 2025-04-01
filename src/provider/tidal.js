const insure = require('./insure');
const select = require('./select');
const request = require('../request');
const { getManagedCacheStorage } = require('../cache');

const search = (info) => {
	// const keyword = encodeURIComponent(info.keyword.replace(' - ', ' '));
	const keyword = encodeURIComponent(info.name);
	const url = `https://music-api.gdstudio.xyz/api.php?types=search&source=tidal&name=${keyword}&count=20&pages=1`;

	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			if (!jsonBody || jsonBody.length < 1) return Promise.reject();
			const list = jsonBody.map((item) => ({
				id: item.id,
				name: item.name,
				duration: item.duration || 0,
				album: { id: item.album_id || '', name: item.album || '' },
				artist: item.artist.map((artist) => ({
					id: artist.id || '',
					name: artist.name || '',
				})),
			}));
			const matched = select(list, info);
			return matched ? matched.id : Promise.reject();
		});
};

// const track = (id) => {
// 	const url = `https://music-api.gdstudio.xyz/api.php?types=url&source=tidal&id=${id}&br=999`;

// 	return request('GET', url)
// 		.then((response) => response.json())
// 		.then((jsonBody) => {
// 			if (!jsonBody || !jsonBody.url) return Promise.reject();
// 			// 去除反斜杠，根据API文档说明
// 			const songUrl = jsonBody.url.replace(/\\/g, '');
// 			return songUrl || Promise.reject();
// 		})
// 		.catch(() => insure().tidal.track(id));
// };

// 尝试获取不同音质的音乐
const track = (id) => {
	return Promise.all(
		['999', '740', '320', '192', '128']
			.slice(select.ENABLE_FLAC ? 0 : 2)
			.map((quality) => {
				const url = `https://music-api.gdstudio.xyz/api.php?types=url&source=tidal&id=${id}&br=${quality}`;
				return request('GET', url)
					.then((response) => response.json())
					.then((jsonBody) => {
						if (!jsonBody || !jsonBody.url) return Promise.reject();
						// 去除反斜杠，根据API文档说明
						const songUrl = jsonBody.url.replace(/\\/g, '');
						return songUrl || Promise.reject();
					})
					.catch(() => null);
			})
	)
		.then((result) => result.find((url) => url) || Promise.reject())
		.catch(() => insure().tidal.track(id));
};

const cs = getManagedCacheStorage('provider/tidal');
const check = (info) => cs.cache(info, () => search(info)).then(track);

module.exports = { check, track };