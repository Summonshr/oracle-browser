const express = require('express')
const json2xls = require('json2xls')
const app = express()
const port = 3030
var oracledb = require('oracledb');
var credentials = require('./credentials.js')
var bodyParser = require('body-parser');
var compression = require('compression')
app.use(compression())

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

var cors = require('cors')

app.use(cors());

oracledb.outFormat = oracledb.OBJECT;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.post('/select', async (req, response) => {

	let connection = await oracledb.getConnection(credentials);

	try {
		let query = req.body.query;

		if (query.toLowerCase().indexOf('fetch first') == -1) {
			query = query + ' fetch first 500 rows only'
		}

		let result = await connection.execute(
			query,
			[],
		);

		return response.json(result);
	} catch (err) {
		return response.status(500).json({ error: 'Error in query' })
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {

			}
		}
	}
})

app.use(json2xls.middleware);

app.post('/excel', function (req, res) {
	return res.xls('data.xlsx', req.body.data);
});

app.post('/excel-query', async (req, res) => {
	let connection = await oracledb.getConnection(credentials);

	try {
		let query = req.body.query;

		if (req.body.columns.length > 0) {
			if (query.toLowerCase().indexOf('select * from') > -1) {
				query = query.replace('select * from', 'select ' + req.body.columns.join(', ') + ' from')
			}
		}
		let result = await connection.execute(
			query,
			[],
		);
		return res.xls('data.xlsx', result.rows);
	} catch (err) {
		return res.xls('data.xlsx', [{ message: "Error in query" }]);
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
			}
		}
	}

});

app.listen(port, (err) => {
	if (err) {
	}
})
