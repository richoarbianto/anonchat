const sqlite3 = require('sqlite3');

function openDB() {
	let db = new sqlite3.Database('./database/anonchat.db', sqlite3.OPEN_READWRITE, (error) => {
		if (error) throw error;	
	})
	return db;
}
module.exports = openDB;