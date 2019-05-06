const port = 3030;
const app = express();
const express = require('express');
const json2xls = require('json2xls');

var oracledb = require('oracledb');
var bodyParser = require('body-parser');
var compression = require('compression');
var credentials = require('./credentials.js');

const fs = require('fs');
const cors = require('cors');
const flatCache = require('flat-cache');
const cache = flatCache.load('productsCache');
const fileUpload = require('express-fileupload');

const flatCacheMiddleware = (req, res, next) => {
	let key = '__express__' + Math.ceil((new Date).getTime() / (60 * 100)) + req.body.query
	let cacheContent = cache.getKey(key);
	if (!req.body.live && cacheContent) {
		res.send(cacheContent);
	} else {
		res.sendResponse = res.send
		res.send = (body) => {
			cache.setKey(key, body);
			cache.save();
			res.sendResponse(body)
		}
		next()
	}
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(fileUpload({
	createParentPath: true,
	limits: {
		fileSize: 50 * 1024 * 1024,
		useTempFiles: true,
		tempFileDir: '/tmp/'
	}
}));

app.use(express.urlencoded({ limit: '50mb' }));

oracledb.outFormat = oracledb.OBJECT;

app.post('/upload', async (req, res) => {
	if (Object.keys(req.files).length == 0) {
		return res.status(400).send('No files were uploaded.');
	}
	let all = Object.values(req.files);
	let completed = 0;
	
	let dir = ['./files',	req.body.foracid, req.body.type].join('/');
	
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir, {recursive: true});
	}

	all.map(f => f.mv([dir, f.name].join('/'), function (a, b) {
		completed = completed + 1;
		all.length == completed && res.json({ message: "WORKING" })
	}));
});

app.post('/file-list', (req, res) => {
	fs.readdir(['files',req.body.foracid, req.body.type].join('/'), (err, files) => {
		if(err){
			return res.json(['No file yet.'])
		}
		return res.json(files)
	});
});

app.post('/account-details', flatCacheMiddleware), async(req,response) => {
	let connection = await oracledb.getConnection(credentials);

	try {
		let query =	"Select foracid, schm_code, acct_name from tbaadm.gam where del_flg = 'N' and acct_cls_flg='N' and schm_type = 'LAA' and acct_ownership ='C' and foracid like '%" + req.body.search + "%'"

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

app.post('/select', flatCacheMiddleware, async (req, response) => {

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
	return res.xls('data.xls', req.body.data);
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
		return res.xls('data.xls', result.rows);
	} catch (err) {
		return res.xls('data.xls', [{ message: "Error in query" }]);
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
			}
		}
	}

});
app.get('/files/*', (req, res)=>{
	let filename = decodeURI(req.url.replace('/files/','files/'));
	var stream = fs.createReadStream(filename);
	res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
	res.setHeader('Content-type', 'application/pdf');
	stream.pipe(res);
})

app.listen(port, (err) => {
	if (err) {
		console.log(err)
	}
})