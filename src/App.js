import React from 'react';
import Axios from 'axios';
import ReactLoading from 'react-loading';
import _ from 'lodash';
import Table from './Table';
import { initial } from './config.js';

const funcs = [
	'load',
	'fetch',
	'getBody',
	'setPageChange',
	'dispatch',
	'downloadQuery',
	'pushColumn',
	'getColumns',
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

const past = Object.keys(localStorage)

class App extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			...initial,
			initial: true,
			query: 'select * from tbaadm.gam',
		};

		funcs.filter(f => {
			this[f] = this[f].bind(this)
		})
	}

	componentDidUpdate() {
		store.save(pathname, {...this.state})
	}

	componentDidMount() {
		local && this.setState({
			...local,
			loading: false
		})
	}

	load(event) {
		this.setState({
			query: event.target.value
		});
	}

	showLoading() {
		this.setState({ ...initial, loading: true })
	}

	hideLoading() {
		this.setState({ loading: false })
	}

	queryForDownload = window.queryForDownload.bind(this)

	downloadQuery() {
		this.queryForDownload('http://10.10.154.215:3030/excel-query', { query: this.state.query, columns: this.state.metaColumns })
	}

	fetch() {

		this.showLoading()

		attempt && attempt.cancel();

		attempt = Axios.CancelToken.source();

		Axios.post('http://10.10.154.215:3030/select', {
			query: this.state.query
		}, { cancelToken: attempt.token }).then(res => {
			this.setState({
				...initial,
				initial: false,
				rows: res.data.rows,
				metaColumns:[],
				metaData: _.uniqBy(res.data.metaData, 'name'),
			});
			attempt = false;
		}).catch((err) => {
			if (!Axios.isCancel(err)) {
				this.setState({ loading: false, initial: false, rows: [], error: err.response.data.error })
			}
		})
	}

	dispatch(e) {
		if (e.ctrlKey && e.keyCode === 13) {
			this.fetch();
		}
	}

	getHeaders() {
		let headers = Object.keys(this.state.rows[0]);

		if (this.state.metaColumns.length > 0) {
			headers = headers.filter(e => this.state.metaColumns.includes(e))
		}

		return headers;

	}

	getBody() {

		let results = [...this.state.rows];

		if (this.state.metaColumns.length > 0) {
			results = results.map(o => {
				let r = {}
				this.state.metaColumns.filter(e => {
					r[e] = o[e]
				});
				return r;
			})
		}
		
		return results
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
		let total = this.getBody();

		let rows = total.splice(this.state.page * 10, 10);

		return <div className="w-full mx-auto flex flex-wrap relative">
			<details className="absolute pin-r mr-4 mt-2  pr-2 bg-green-lighter">
				<summary className="cursor-pointer outline-none bg-green-dark p-2 w-full">
				☰
				</summary>
				<ol className="list-reset">
					{past.map(e=><li key={e} className="w-full p-2 hover:bg-green-lightest hover:text-green-darker"><a className="no-underline text-green-darker w-full block" href={"/"+e}>{e}</a></li>)}
				</ol>
			</details>
			<div className="w-1/6 p-2 border-r border-grey-light h-screen overflow-y-scroll">
				<ul className="list-reset ">
					<li className="w-full mb-1"><input className="p-2 border-b-2 w-full outline-none" placeholder="Filter columns" value={this.state.metaSearch} onChange={e => this.setState({ metaSearch: e.target.value })} /></li>
					{this.state.metaData.length > 0 && this.getColumns().map(e => <li key={e} className={"p-2 w-full cursor-pointer " + (this.state.metaColumns.includes(e) ? 'bg-green-lighter text-green-darkest' : '')} onClick={() => this.pushColumn(e)}>{e}</li>)}
				</ul>
			</div>
			<div className="w-5/6 p-2">
				<div className="w-full flex flex-wrap justify-between">
					<textarea rows="5" onKeyUp={this.dispatch} className="wickEnabled border-2 w-5/6" onChange={this.load} value={this.state.query}></textarea>
					<div className="w-1/6 flex px-2">
						<a title="Download by query" className="block cursor-pointer bg-blue-light text-white w-8 h-8 flex flex-wrap justify-center items-center" href="/#" onClick={this.downloadQuery}>⇓</a>
					</div>
				</div>
				<div className="border-2 border-grey-darkest my-4"></div>
				{this.state.loading && <div className="w-full">
					<div className="w-64 text-center mx-auto flex justify-center">
						<ReactLoading type='bubbles' color='red' />
					</div>
				</div>}
				{!this.state.loading && <Table data={this.getBody()} />}
			</div>
		</div>
	}
}

export default App;