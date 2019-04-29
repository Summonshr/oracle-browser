const express = require('express')
const json2xls = require('json2xls')
const app = express()
const port = 3030
var oracledb = require('oracledb');
var mypw = 'square999'
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
var cors = require('cors')

app.use(cors())
oracledb.outFormat = oracledb.OBJECT;

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.post('/select', async (req, response) => {

	let connection = await oracledb.getConnection({
		user: "custom",
		password: mypw,
		connectString: "10.2.3.31/danphe"
	});

	try {
		let query = req.body.query;
		if(query.toLowerCase().indexOf('fetch first') == -1){
			query = query + ' fetch first 100 rows only'
		}
		let result = await connection.execute(
			query,
			[],
		);
		return response.json(result);
	} catch (err) {
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

app.post('/excel',function(req, res) {
    return res.xls('data.xlsx', req.body.data);
});

app.post('/excel-query',async (req, res) => {
	let connection = await oracledb.getConnection({
		user: "custom",
		password: mypw,
		connectString: "10.2.3.31/danphe"
	});

	try {
		let query = req.body.query;
		if(query.toLowerCase().indexOf('fetch first') == -1){
			query = query + ' fetch first 10000 rows only'
		}
		let result = await connection.execute(
			query,
			[],
		);
		return res.xls('data.xlsx', result.rows);
	} catch (err) {
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
