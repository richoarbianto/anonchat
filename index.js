const configDB = require('./config/db.js');
const wa = require('./config/create.js');
const fs = require('fs')
var searchMode = [];
var chatMode = [];
var db = configDB();
const rules = `Peraturan :
- Dilarang membicarakan konten pornografi

- Dilarang membicarakan hal yang sensitif

- Dilarang membicarakan hal yang mengandung unsur SARA

- Dilarang membicarakan hal yang mengandung pelecehan

- Dilarang melakukan pencemaran nama baik

Apabila kamu melanggar aturan diatas, maka kami selaku pengembang AnonChat berhak memblokir akun kamu.
`

db.serialize(() => {
	var stmt = db.prepare("DELETE FROM search");
	stmt.run();
	stmt.finalize();
	var stmt = db.prepare("DELETE FROM room");
	stmt.run();
	stmt.finalize();
})

function arrayFilter(array, element) {
	return array.filter((i) => i != element);
}

function main(client) {
	client.onMessage(async message => {
		if (chatMode.includes(message.from)) {
			let user2;
			let db2 = configDB();
			db2.each("SELECT * FROM room WHERE user1 = (?) LIMIT 1", message.from, (error, rows) => {
				if (error) {
					throw error;
				}
				user2 = rows['user2'];
			})
			if (message.body == '/end') {
				db2.serialize(async () => {
					let stmt;
					stmt = db2.prepare("DELETE FROM room WHERE user1 = (?)", message.from);
					stmt.run();
					stmt.finalize();
					stmt = db2.prepare("DELETE FROM room WHERE user1 = (?)", user2);
					stmt.run();
					stmt.finalize();
				})
				db2.close(async () => {
					chatMode = arrayFilter(chatMode, message.from);
					chatMode = arrayFilter(chatMode, user2);
					searchMode = arrayFilter(searchMode, message.from);
					searchMode = arrayFilter(searchMode, user2);
					client.sendText(message.from, 'Kamu mengakhiri percakapan!\n\nUntuk memulai obrolan dengan teman random, ketikkan /search');
					client.sendText(user2, 'Temanmu mengakhiri percakapan!\n\nUntuk memulai obrolan dengan teman random, ketikkan /search');
				})
			} else if (message.body == '/rules') {
				client.sendText(message.from, rules)
			} else {
				if (message.type == 'chat') {
					db2.close(async () => {
						client.sendText(user2, message.body);
					})
				} else if (message.type == 'sticker') {
					let name = `./files/${Math.random().toString(36).substring(7)}.jpg`;
					buffer = await client.decryptFile(message);
					fs.writeFileSync(name, buffer)
					client.sendImageAsSticker(user2, name)
					setTimeout(() => {
						fs.unlinkSync(name)
					}, 5000)

				} else if (message.type == 'image') {
					db2.close(async () => {
						let caption;
						let name = `./files/${Math.random().toString(36).substring(7)}.jpg`;
						if (message.caption != undefined) {
							caption = message.caption;
						}
						buffer = await client.decryptFile(message);
						fs.writeFileSync(name, buffer)
						client.sendImage(user2, name, 'result.jpg', caption);
						setTimeout(() => {
							fs.unlinkSync(name)
						}, 5000)
					})
				}
			}
		}
		else if (message.body == '/search') {
			searchMode.push(message.from);
			let a = 0;
			var interval = [];
			function clear() {
				for (i of interval) {
					clearInterval(i);
				}
			}
			client.sendText(message.from, 'Tunggu sebentar...');
			setTimeout(() => {
					db.serialize(async () => {
					let stmt = db.prepare("INSERT INTO search VALUES(?, ?)", null, message.from);
					stmt.run();
					stmt.finalize();
				});
				int = interval.push(setInterval(async () => {
					if (chatMode.includes(message.from)) {
						clear();
					}
					else if (a >= 120) {
						db.serialize(async () => {
							let stmt = db.prepare("DELETE FROM search WHERE user = (?)", message.from);
							stmt.run();
							stmt.finalize();
						})
						searchMode = arrayFilter(searchMode, message.from);
						client.sendText(message.from, 'Teman tidak ditemukan..')
						clear();
					} else {
						num_fil = arrayFilter(searchMode, message.from);
						if (num_fil.length >= 1) {
							num_ran = num_fil[Math.floor(Math.random() * num_fil.length)];
							if (searchMode.includes(num_ran)) {
								if (!chatMode.includes(num_ran)) {
									db.serialize(async () => {
										let stmt = db.prepare("INSERT INTO room VALUES (?, ?, ?), (?, ?, ?)", null, num_ran, message.from, null, message.from, num_ran);
										stmt.run();
										stmt.finalize();
									})
									db.serialize(async () => {
										let stmt = db.prepare("DELETE FROM search WHERE user = (?)", message.from);
										stmt.run();
										stmt.finalize();
									})
									let sensorNumran = `+${num_ran.slice(0,4) + '*****' + num_ran.slice(9).replace('@c.us', '')}`;
									let sensorMsgfrom = `+${message.from.slice(0,4) + '*****' + message.from.slice(9).replace('@c.us', '')}`;

									client.sendText(message.from, `Teman ngobrol ditemukan!\nNomor Temanmu : ${sensorNumran}\n\nHarap patuhi aturan saat mengobrol, kamu bisa baca aturan tersebut dengan cara mengetikkan /rules.\nUntuk menghentika obrolan, ketik \n/end.`);
									client.sendText(num_ran, `Teman ngobrol ditemukan!\nNomor Temanmu : ${sensorMsgfrom}\n\nHarap patuhi aturan saat mengobrol, kamu bisa baca aturan tersebut dengan cara mengetikkan /rules.\nUntuk menghentika obrolan, ketik \n/end.`);
									chatMode.push(message.from);
									chatMode.push(num_ran);
									searchMode = arrayFilter(searchMode, message.from);
									searchMode = arrayFilter(searchMode, num_ran);
									clear();
								}
							}
						}
					}
					a++;
				}, 1000));
			}, 2000)
			
		} else if (message.body == '/rules') {
				client.sendText(message.from, rules)
		} else {
			client.sendText(message.from, 'Kamu ngetik apasih? bot gapaham.\n\nUntuk memulai obrolan dengan teman random, ketikkan /search');
		}
	})
}

wa.then(client => main(client));