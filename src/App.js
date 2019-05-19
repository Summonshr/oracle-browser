import React from 'react';
import Axios from 'axios';
import ReactLoading from 'react-loading';
import _ from 'lodash';
import Display from './Display';
import Graph from './Graph';
import { initial } from './config.js';
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/sql/sql';
const funcs = [
	'load',
	'fetch',
	'getBody',
	'setPageChange',
	'downloadQuery',
	'pushColumn',
	'getColumns',
	'getCount',
	'showLoading',
	'hideLoading',
	'componentDidUpdate',
	'componentDidMount',
]

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
		local && this.setState({
			...local,
			loading: false,
		});
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
		this.queryForDownload('http://localhost:3030/excel-query', { query: this.state.query, columns: this.state.metaColumns })
	}

	fetch() {

		this.showLoading()

		attempt && attempt.cancel();

		attempt = Axios.CancelToken.source();

		let query = this.state.query;

		if(this.state.cache){
			query = query.replace('select ', 'select /*+RESULT_CACHE*/ ').replace('SELECT ','SELECT /*+RESULT_CACHE*/ ')
		}

		Axios.post('http://localhost:3030/select', {
			query
		}, { cancelToken: attempt.token }).then(res => {
			this.setState({
				...initial,
				initial: false,
				rows: res.data.rows,
				show: this.state.show,
				metaColumns: [],
				metaData: _.uniqBy(res.data.metaData, 'name'),
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

		Axios.post('http://localhost:3030/select', {
			query: `select count(1) count from ( ${this.state.query} )`
		}, { cancelToken: attempt.token }).then(res => {
			alert('Total rows: ' + res.data.rows[0].COUNT)
			this.hideLoading();
			attempt = false;
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				err.response && this.setState({ loading: false, initial: false, rows: [], error: err.response.data.error })
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

	setPageChange(page) {
		this.setState({
			page: page.selected
		})
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



	render() {
		return <div className="w-full mx-auto flex flex-wrap relative">
			<div className="w-1/6 p-2 border-r border-grey-light h-screen overflow-y-auto">
				<ul className="list-reset ">
					<li className="w-full mb-1 flex justify-between">
						<input className="p-2 border-b-2 w-full outline-none" placeholder="Filter columns" value={this.state.metaSearch} onChange={e => this.setState({ metaSearch: e.target.value })} />
					</li>
					{this.state.metaData.length > 0 && this.getColumns().map(e => <li key={e} className={"w-full cursor-pointer flex flex-wrap justify-between " + (this.state.metaColumns.includes(e) ? 'bg-green-lighter text-green-darkest' : '')}><a className="p-2 block no-underline text-grey-darker flex-grow" href="#" onClick={() => this.pushColumn(e)}>{e}</a></li>)}
				</ul>
			</div>
			<div className="w-5/6 p-2 h-32 h-screen overflow-y-auto">
				<div className="w-full flex flex-wrap justify-between">
					<CodeMirror
						className="w-5/6"
						options={{
							mode: 'sql',
							theme: 'material',
							lineNumbers: true
						}}
						value={this.state.query}
						onKeyUp={(editor, e, value) => {
							if (e.ctrlKey && e.keyCode === 13) {
								this.fetch();
							}
						}}
						onBeforeChange={(editor, data, query) => {
							this.setState({ query });
						}}
						onChange={(editor, data, value) => {
						}}
					/>
					<div className="w-1/6 flex px-2">
						<a title="Download by query" className="block cursor-pointer bg-blue-light text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2" href="/#" onClick={this.downloadQuery}>⇓</a>
						<a title="Display count" className="block cursor-pointer bg-green-light text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2" href="/#" onClick={this.getCount}>||̸||</a>
						<a title={'Cache Status: ' + (this.state.cache ? 'ON' : 'OFF')} className={"block cursor-pointer bg-red-light text-white w-8 h-8 flex flex-wrap justify-center items-center mr-2 " + (this.state.cache ? 'bg-teal-light' : 'bg-red-light')} href="/#" onClick={()=>{this.setState({cache: !this.state.cache})}}>🗲</a>
						<a title={'Graph: ' + (this.state.show == 'graph' ? 'ON' : 'OFF')} className={"block cursor-pointer text-white w-8 h-8 flex flex-wrap justify-center items-center text-grey-light no-underline " + (this.state.show == 'graph' ? 'bg-grey-darker' : 'bg-grey-lightest')} href="/#" onClick={()=>{this.setState({show: this.state.show == 'graph' ? 'table' : 'graph'})}}>📊</a>
					</div>
				</div>
				<div className="border-2 border-grey-darkest my-4"></div>
				{this.state.loading && <div className="w-full">
					<div className="w-64 text-center mx-auto flex justify-center">
						<ReactLoading type='bubbles' color='red' />
					</div>
				</div>}
				{!this.state.loading && (this.state.show == 'table' ? <Display error={this.state.error} data={this.getBody()} /> : <Graph error={this.state.error} data={this.getBody()} />)}
			</div>
		</div>
	}
}

export default App;