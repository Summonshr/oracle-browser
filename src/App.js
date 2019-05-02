import React from 'react';
import './tailwind.css';
import './App.css';
import './pagination.css'
import Axios from 'axios';
import ReactPaginate from 'react-paginate';
import ReactLoading from 'react-loading';
import _ from 'lodash';
import { initial } from './config.js';

Object.prototype.toString = function () {
	return JSON.stringify(this)
}

const excel = (data, name) => {
	const downloadUrl = window.URL.createObjectURL(new Blob([data]));
	const link = document.createElement('a');
	link.href = downloadUrl;
	link.setAttribute('download', name + '.xlsx'); //any other extension
	document.body.appendChild(link);
	link.click();
	link.remove();
}

const funcs = [
	'load',
	'fetch',
	'getBody',
	'setPageChange',
	'dispatch',
	'download',
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
	retrieve(key){
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

	download() {
		this.queryForDownload('http://localhost:3030/excel', { data: this.getBody() })
	}

	showLoading() {
		this.setState({ ...initial, loading: true })
	}

	hideLoading() {
		this.setState({ loading: false })
	}

	queryForDownload(url, data) {
		this.showLoading()

		var name = prompt('Enter file name:')

		if (!name) {
			this.hideLoading()
			return;
		}

		Axios
			.request({
				url: url,
				method: 'post',
				responseType: 'blob',
				data: data
			})
			.then(({ data }) => {
				this.hideLoading()
				excel(data, name)
			});
	}

	downloadQuery() {
		this.queryForDownload('http://localhost:3030/excel-query', { query: this.state.query, columns: this.state.metaColumns })
	}

	fetch() {

		this.showLoading()

		attempt && attempt.cancel();

		attempt = Axios.CancelToken.source();

		Axios.post('http://localhost:3030/select', {
			query: this.state.query
		}, { cancelToken: attempt.token }).then(res => {
			this.setState({
				...initial,
				initial: false,
				rows: res.data.rows,
				metaColumns:[],
				metaData: res.data.metaData,
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

	setFilter(event) {
		this.setState({
			filter: event.target.value
		})
	}

	getBody() {

		let results = [...this.state.rows];

		if (this.state.orderBy) {
			results = _.orderBy(results, (e) => {
				return (e[this.state.orderBy] || '').toString().padStart(100, '0')
			}, this.state.order)
		}

		if (this.state.metaColumns.length > 0) {
			results = results.map(o => {
				let r = {}
				this.state.metaColumns.filter(e => {
					r[e] = o[e]
				});
				return r;
			})
		}

		if (this.state.filter) {
			if (this.state.filter.indexOf(':') > -1) {
				let arr = this.state.filter.split(':')
				let key = arr[0]
				let value = arr[1]
				results = results.filter(r => {
					return Object.keys(r).filter(k => {
						return r[k] && k.toLowerCase() === key.toLowerCase() && r[k].toString().toLowerCase().indexOf(value.toLowerCase()) > -1
					}).length > 0;
				})
			} else {
				results = results.filter(r => {
					return Object.keys(r).filter(k => {
						return r[k] && r[k].toString().toLowerCase().indexOf(this.state.filter.toLowerCase()) > -1
					}).length > 0;
				})
			}
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

		let length = total.length;

		let rows = total.splice(this.state.page * 10, 10);

		return (<div className="w-full mx-auto flex flex-wrap relative">
			<details className="absolute pin-r mr-4 mt-4  pr-4 bg-green-lighter">
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
					<textarea rows="5" onKeyUp={this.dispatch} className="wickEnabled w-full border-2 mt-2 max-w-xl" onChange={this.load} value={this.state.query}></textarea>
					<div className="w-32 flex justify-around inline items-center">
						<a title="Download by query" className="block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center" href="/#" onClick={this.downloadQuery}>⇓</a>
					</div>
				</div>
				<div className="border-2 border-grey-darkest my-4"></div>
				{this.state.loading && <div className="w-full">
					<div className="w-64 text-center mx-auto flex justify-center">
						<ReactLoading type='bubbles' color='red' />
					</div>
				</div>}
				{!this.state.initial && !this.state.loading && <div className="w-full overflow-x-scroll">
					<div className="w-full flex flex-wrap justify-between items-center h-12">
						<div className="flex">{rows.length > 0 && <><span className="text-grey-darker">Total rows: </span><span className="font-semibold text-green-darker pl-2">{length}</span></>}</div>
						<div className="flex">
							<span>
								<input className="w-64 p-2 bg-grey-lighter mr-2" placeholder="filter the contents" onChange={this.setFilter.bind(this)} value={this.state.filter} />
							</span>
							<a title="Download this table" className="block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center" href="/#" onClick={this.download}>⇓</a>
						</div>
					</div>
					{rows.length > 0 && <div>
						<table className="result mt-1">
							<thead>
								<tr>
									{this.getHeaders().map(e => <th key={e} className="cursor-pointer do-not-select" onClick={() => this.setState({ orderBy: e, order: this.state.order === 'desc' ? 'asc' : 'desc' })}><span>{e}</span><span className="pl-2">{this.state.orderBy === e && (this.state.order === 'asc' ? '↑' : '↓')}</span></th>)}
								</tr>
							</thead>
							<tbody>
								{rows.map((e, i) => {
									return <tr key={i}>{Object.keys(e).map(k => <td key={k}>{e[k] && e[k].toString()}</td>)}</tr>
								})}
							</tbody>
						</table>
						{total.length > 0 && <div className="paginate-div">
							<ReactPaginate
								initialPage={0}
								onPageChange={this.setPageChange}
								marginPagesDisplayed={2}
								pageRangeDisplayed={5}
								containerClassName={'pagination'}
								subContainerClassName={'pages pagination'}
								activeClassName={'active'}
								pageCount={Math.ceil(total.length / 10) + 1}
							/>
						</div>}
					</div>}
					{rows.length === 0 && <div className="h-8 w-full bg-red-lightest flex items-center overflow-hidden"><span className="p-4 text-red-darker">
						{this.state.error || 'No rows fetched.'}</span></div>}
				</div>}
			</div>
		</div>);
	}
}

export default App;

