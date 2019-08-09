import _ from 'lodash';
import React from 'react';
import Axios from 'axios';
import Graph from './Graph';
import Display from './Display';
import 'codemirror/mode/sql/sql';
import { initial } from './config.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import ReactLoading from 'react-loading';
import sqlFormatter from "sql-formatter";
import { Controlled as CodeMirror } from 'react-codemirror2';

const funcs = [
	'load',
	'fetch',
	'getBody',
	'downloadQuery',
	'pushColumn',
	'getColumns',
	'getCount',
	'format',
	'showLoading',
	'hideLoading',
	'componentDidUpdate',
	'componentDidMount',
	'commit',
	'rollback',
	'refresh',
];

let attempt = false;

const pathname = window.location.pathname.replace('/', '') || 'default'

const store = {
	save(key, value) {
		value.rows = [];
		localStorage.setItem(key, JSON.stringify(value))
	},
	retrieve(key) {
		return JSON.parse(localStorage.getItem(key))
	}
}

const local = store.retrieve(pathname)

class App extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			...initial,
			initial: true,
			query: 'select * from tbaadm.gam',
			cache: false,
			offset: false,
			live: false,
			onLoop: false
		};

		funcs.filter(f => {
			this[f] = this[f].bind(this);
			return '';
		})
	}

	componentDidUpdate() {
		store.save(pathname, { ...this.state })
	}

	componentDidMount() {
		if (window) {
			window.onkeydown = (e) => {
				if (e.ctrlKey && e.shiftKey && e.code === 'KeyZ') {
					this.getCount();
				}
				if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
					alert('Switched to ' + (!this.state.live ? 'LIVE' : 'CUS'))
					this.setState({live: !this.state.live});
				}
				if (e.ctrlKey && e.altKey && e.code === 'KeyF') {
					this.format();
				}
			}
		}

		local && this.setState({
			...local,
			loading: false,
		});

		let temper = () => {
			this.state.onLoop && this.fetch();
		}

		setInterval(temper, 30000)

		local && local.onLoop && setTimeout(this.fetch, 5)
	}

	load(event) {
		this.setState({
			query: event.target.value
		});
	}

	showLoading() {
		this.setState({ loading: true })
	}

	hideLoading() {
		this.setState({ loading: false })
	}

	queryForDownload = window.queryForDownload.bind(this)

	downloadQuery() {
		this.queryForDownload('http://localhost:' + (this.state.live ? '3031' : '3030') + '/excel-query', { query: this.state.query, columns: this.state.metaColumns })
	}

	fetch() {

		this.showLoading()

		attempt && attempt.cancel();

		attempt = Axios.CancelToken.source();

		let query = this.state.query;

		if (this.state.cache) {
			query = query.replace('select ', 'select /*+RESULT_CACHE*/ ').replace('SELECT ', 'SELECT /*+RESULT_CACHE*/ ')
		}


		Axios.post('http://localhost:' + (this.state.live ? '3031' : '3030') + '/select', {
			query
		}, { cancelToken: attempt.token }).then(res => {
			if (res.data.rowsAffected == 0 || res.data.rowsAffected) {
				this.hideLoading()
				alert('Total Rows effected:' + res.data.rowsAffected)
				attempt = false;
				return;
			}
			this.setState({
				...initial,
				initial: false,
				rows: res.data.rows,
				show: this.state.show,
				metaColumns: [],
				metaData: _.uniqBy(res.data.metaData, 'name'),
				offset: false
			});
			attempt = false;
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				err.response && this.setState({ loading: false, initial: false, rows: [], error: err.response.data.error })
			}
		})
	}

	getCount() {
		this.showLoading()

		attempt && attempt.cancel();

		attempt = Axios.CancelToken.source();

		Axios.post('http://localhost:' + (this.state.live ? '3031' : '3030') + '/select', {
			query: `select count(1) count from ( ${this.state.query} )`
		}, { cancelToken: attempt.token }).then(res => {
			alert('Total rows: ' + res.data.rows[0].COUNT)
			this.hideLoading();
			attempt = false;
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				err.response && this.setState({ loading: false, initial: false, rows: [], ...err.response.data })
			}
			this.hideLoading()
		})
	}

	getHeaders() {
		let headers = Object.keys(this.state.rows[0]);

		if (this.state.metaColumns.length > 0) {
			headers = headers.filter(e => this.state.metaColumns.includes(e))
		}

		return headers;

	}

	getBody() {

		if (!this.state.rows) {
			return [];
		}

		let results = [...this.state.rows];

		if (this.state.metaColumns.length > 0) {
			results = results.map(o => {
				let r = {}
				this.state.metaColumns.filter(e => {
					r[e] = o[e]

					return '';
				});
				return r;
			})
		}

		return results || [];
	}

	pushColumn(column) {
		let columns = this.state.metaColumns;
		if (columns.includes(column)) {
			_.remove(columns, (e) => (e === column))
		} else {
			columns.push(column)
		}
		this.setState({ metaColumns: columns })
	}

	getColumns() {
		let meta = _.map(this.state.metaData, 'name');

		if (this.state.metaSearch) {
			meta = meta.filter(m => (m.toLowerCase().indexOf(this.state.metaSearch.toLowerCase()) > -1))
		}

		return meta;
	}

	format() {
		this.setState({ query: sqlFormatter.format(this.state.query) })
	}

	commit(){
		Axios.post('http://localhost:' + (this.state.live ? '3031' : '3030') + '/commit', {
		}).then(res => {
			alert('Commit Successful')
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				err.response && this.setState({ loading: false, initial: false, rows: [], error: err.response.data.error })
			}
		})
	}

	rollback(){
		Axios.post('http://localhost:' + (this.state.live ? '3031' : '3030') + '/rollback', {
		}).then(res => {
			alert('Rollback Successful')
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				err.response && this.setState({ loading: false, initial: false, rows: [], error: err.response.data.error })
			}
		})
	}


	refresh(){
		Axios.post('http://localhost:' + (this.state.live ? '3031' : '3030') + '/refresh', {
		}).then(res => {
			alert('Refresh completed')
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				err.response && this.setState({ loading: false, initial: false, rows: [], error: err.response.data.error })
			}
		})
	}

	render() {
		const { live } = this.state;
		return <div className="w-full mx-auto flex flex-wrap relative">
			<div className="w-1/6 p-2 border-r border-grey-light h-screen overflow-y-auto">
				<ul className="list-reset ">
					<li className="w-full mb-1 flex justify-between">
						<input className="p-2 border-b-2 w-full outline-none" placeholder="Filter columns" value={this.state.metaSearch} onChange={e => this.setState({ metaSearch: e.target.value })} />
					</li>
					{this.state.metaData.length > 0 && this.getColumns().map(e => <li key={e} className={"w-full cursor-pointer flex flex-wrap justify-between " + (this.state.metaColumns.includes(e) ? 'bg-green-lighter text-green-darkest' : '')}><button className="p-2 block no-underline text-grey-darker flex-grow text-left" onClick={() => this.pushColumn(e)}>{e}</button></li>)}
				</ul>
			</div>
			<div className="w-5/6 p-2 h-64 h-screen overflow-y-auto">
				<div className="w-full flex flex-wrap justify-between">
					<CodeMirror
						className="w-5/6"
						options={{
							mode: 'sql',
							theme: 'material',
							lineNumbers: true,
						}}
						value={this.state.query}
						onKeyUp={(editor, e, value) => {
							if (e.ctrlKey && e.keyCode === 13) {
								this.fetch();
							}
						}}
						onBeforeChange={(editor, data, query) => {
							this.setState({ query, total_lines: editor.getDoc.size });
						}}
					/>
					<div className="w-1/6 flex flex-wrap px-2">
						<button title="Download by query" className="block cursor-pointer bg-blue-light text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2" onClick={this.downloadQuery}>⇓</button>
						<button title="Display count" className="block cursor-pointer bg-green-light text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2" onClick={this.getCount}>||̸||</button>
						<button title={'Cache Status: ' + (this.state.cache ? 'ON' : 'OFF')} className={"block cursor-pointer bg-red-light text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2 " + (this.state.cache ? 'bg-teal-light' : 'bg-red-light')} onClick={() => { this.setState({ cache: !this.state.cache }) }}>🗲</button>
						<button title={'Graph: ' + (this.state.show === 'graph' ? 'ON' : 'OFF')} className={"block cursor-pointer text-white w-8 h-8 flex flex-wrap justify-center items-center no-underline mr-2 " + (this.state.show === 'graph' ? 'bg-grey-darker' : 'bg-grey-lightest')} onClick={() => { this.setState({ show: this.state.show === 'graph' ? 'table' : 'graph' }) }}><span role="img" aria-label="WORKING">📊</span></button>
						<button title='Format' className={"block cursor-pointer text-white w-8 h-8 flex flex-wrap justify-center items-center no-underline mr-2 bg-teal-darker"} onClick={() => { this.setState({ query: sqlFormatter.format(this.state.query) }) }}>Ḟ</button>
						<button title='Loop' className={"block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center no-underline mr-2 " + (this.state.onLoop ? 'bg-blue-dark text-white' : 'bg-blue-lighter text-grey-darker')} onClick={() => { this.setState({ onLoop: !this.state.onLoop }) }}><span className={this.state.onLoop ? "spin" : ""}>✴</span></button>
						<button title={live ? 'Live Database' : 'CUS Database'} className={"block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center no-underline mr-2 " + (live ? 'bg-orange-dark text-white' : 'bg-purple-lighter text-purple-darker')} onClick={() => { this.setState({ live: !live }) }}>{live? 'L' : 'C'}</button>
						<button onClick={this.commit} className="block cursor-pointer bg-green text-green-lightest text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2" title="Commit">✓</button>
						<button onClick={this.rollback} className="block cursor-pointer bg-red-light text-red-darkest w-8 h-8 flex flex-wrap justify-center items-center mr-2" title="Rollback">⎌</button>
						<button onClick={this.refresh} className="block cursor-pointer bg-indigo-light text-indigo-darkest w-8 h-8 flex flex-wrap justify-center items-center mr-2" title="Refresh">↺</button>
					</div>
				</div>
				<div className="border-2 border-grey-darkest my-4"></div>
				{this.state.loading && <div className="w-full">
					<div className="w-64 text-center mx-auto flex justify-center">
						<ReactLoading type='bubbles' color='red' />
					</div>
				</div>}
				{!this.state.loading && this.state.error && <div className="h-auto w-full bg-red-lightest flex items-center overflow-hidden">
					<span className="p-4 text-red-darker">
						{this.state.error}
						<br />
						{this.state.query}
					</span>
				</div>}
				{!this.state.loading && !this.state.error && this.state.rows.length === 0 && <div className="h-8 w-full bg-red-lightest flex items-center overflow-hidden">
					<span className="p-4 text-red-darker">
						No rows matched
					</span>
				</div>}
				{!this.state.loading && !this.state.error && this.state.rows.length > 0 && (this.state.show === 'table' ? <Display live={live} data={this.getBody()} /> : <Graph data={this.getBody()} />)}
			</div>
		</div>
	}
}

export default App;
