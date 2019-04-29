import React from 'react';
import './tailwind.css';
import './App.css';
import './pagination.css'
import Axios from 'axios';
import ReactPaginate from 'react-paginate';
import ReactLoading from 'react-loading';
import _ from 'lodash';

Object.prototype.toString = function () {
	return JSON.stringify(this)
}

class App extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			query: 'select * from tbaadm.gam',
			rows: [],
			metaData:[],
			filter: '',
			page: 0,
			loading: false,
			initial: true,
			orderBy: '',
			order: '',
			metaSearch: '',
			metaColumns:[]
		}
		this.load = this.load.bind(this)
		this.fetch = this.fetch.bind(this)
		this.getBody = this.getBody.bind(this)
		this.setPageChange = this.setPageChange.bind(this)
		this.dispatch = this.dispatch.bind(this)
		this.download = this.download.bind(this)
		this.downloadQuery = this.downloadQuery.bind(this)
		this.pushColumn = this.pushColumn.bind(this)
		this.getColumns = this.getColumns.bind(this)
	}

	load(event) {
		this.setState({
			query: event.target.value
		});
	}

	download() {
		this.setState({ loading: true })
		var name = prompt('Enter file name:')
		if (!name) {
			this.setState({ loading: false })
			return;
		}
		Axios
			.request({
				url: 'http://localhost:3030/excel',
				method: 'post',
				responseType: 'blob',
				data: { data: this.getBody() }
			})
			.then(({ data }) => {
				this.setState({ loading: false })
				const downloadUrl = window.URL.createObjectURL(new Blob([data]));
				const link = document.createElement('a');
				link.href = downloadUrl;
				link.setAttribute('download', name + '.xlsx'); //any other extension
				document.body.appendChild(link);
				link.click();
				link.remove();
			});
	}

	downloadQuery() {
		this.setState({ loading: true })
		var name = prompt('Enter file name:')
		if (!name) {
			this.setState({ loading: false })
			return;
		}
		Axios
			.request({
				url: 'http://localhost:3030/excel-query',
				method: 'post',
				responseType: 'blob',
				data: { query: this.state.query }
			})
			.then(({ data }) => {
				this.setState({ loading: false })
				const downloadUrl = window.URL.createObjectURL(new Blob([data]));
				const link = document.createElement('a');
				link.href = downloadUrl;
				link.setAttribute('download', name + '.xlsx'); //any other extension
				document.body.appendChild(link);
				link.click();
				link.remove();
			});
	}

	fetch() {
		this.setState({ loading: true })
		Axios.post('http://localhost:3030/select', {
			query: this.state.query
		}).then(res => {
			this.setState({
				rows:res.data.rows,
				metaData: res.data.metaData,
				page: 0,
				loading: false,
				initial: false,
				order: '',
				orderBy: '',
				page: 0,
				filter: '',
				metaSearch: '',
				metaColumns: []
			})
		}).catch(() => {
			this.setState({ loading: false, initial: false })
		})
	}

	dispatch(e) {
		if (e.ctrlKey && e.keyCode === 13) {
			this.fetch();
		}
	}

	getHeaders() {
		let headers = Object.keys(this.state.rows[0]);
		
		if(this.state.metaColumns.length > 0) {
			headers = headers.filter(e=>this.state.metaColumns.includes(e))
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

		if(this.state.metaColumns.length > 0){
			results = results.map(o=>{
				let r = {}
				this.state.metaColumns.map(e=>{
					r[e] = o[e]
				});
				return r;
			})
		}

		if (this.state.filter) {
			results = results.filter(r => {
				return Object.keys(r).filter(k => {
					return r[k] && r[k].toString().toLowerCase().indexOf(this.state.filter.toLowerCase()) > -1
				}).length > 0;
			})
		}
		return results
	}

	setPageChange(page) {
		this.setState({
			page: page.selected
		})
	}

	pushColumn(column){
		let columns = this.state.metaColumns;
		if(columns.includes(column)){
			console.log(columns, column)
			_.remove(columns,(e)=>(e == column))
		} else {
			columns.push(column)
		}
		this.setState({metaColumns: columns})
	}

	getColumns(){
		let meta = _.map(this.state.metaData, 'name');

		if(this.state.metaSearch) {
			meta = meta.filter(m=>(m.toLowerCase().indexOf(this.state.metaSearch.toLowerCase()) > -1))
		}

		return meta;
	}

	render() {
		let total = this.getBody();
		let rows = total.splice(this.state.page * 10, 10);

		return (<div className="w-full mx-auto flex flex-wrap">
			<div className="w-1/6 p-2 border-r border-grey-light min-h-screen">
				<ul className="list-reset">
					<li><input className="p-2 border-b-2 w-full outline-none" value={this.state.metaSearch} onChange={e=>this.setState({metaSearch: e.target.value})}/></li>
					{this.state.metaData && this.getColumns().map(e=><li key={e} className={"p-2 w-full cursor-pointer " + (this.state.metaColumns.includes(e) ? 'bg-green-lightest text-green-darkest' : '')} onClick={()=>this.pushColumn(e)}>{e}</li>)}
				</ul>
			</div>
			<div className="w-5/6 p-2">
				<div className="w-full flex flex-wrap justify-between">
					<textarea rows="5" onKeyUp={this.dispatch} className="wickEnabled w-full border-2 mt-2 max-w-xl" onChange={this.load} value={this.state.query}></textarea>
					<div className="w-32 flex justify-around inline items-center">
						<a title="Download by query" className="block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center" onClick={this.downloadQuery}>⇓</a>
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
						<div></div>
						<div className="flex">
							<span>
								<input className="w-64 p-2 bg-grey-lighter mr-2" placeholder="filter the contents" onChange={this.setFilter.bind(this)} value={this.state.filter} />
							</span>
							<a title="Download this table" className="block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center" onClick={this.download}>⇓</a>
						</div>
					</div>
					{rows.length > 0 && <div>
						<table width="100%" className="result mt-1">
							<thead>
								<tr>
									{this.getHeaders().map(e => <th key={e} className="cursor-pointer do-not-select" onClick={() => this.setState({ orderBy: e, order: this.state.order == 'desc' ? 'asc' : 'desc' })}><span>{e}</span><span className="pl-2">{this.state.orderBy == e && (this.state.order === 'asc' ? '↑' : '↓')}</span></th>)}
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
						No rows matched.</span></div>}
				</div>}

			</div>
		</div>);
	}
}

export default App;