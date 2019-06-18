import _ from 'lodash';
import React from 'react';
import copy from 'copy-to-clipboard';
import ReactPaginate from 'react-paginate';

export default class Display extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            page: 0,
            order: 'asc',
            orderBy: '',
            filter: '',
            hideNull: false,
            no_of_rows: 10
        };
        this.getData = this.getData.bind(this);
        this.download = this.download.bind(this);
    }

    getData() {
        let results = [...this.props.data];

        
        if(results.length === 1) {
            results = _.map(results[0], (VALUE,COLUMN)=>({COLUMN,VALUE}));
        }

        if (this.state.orderBy.length > 0) {
            results = _.orderBy(results, (e) => {
                let checker = e[this.state.orderBy] || 0;
                return checker.toString().padStart(50, '0')
            }, this.state.order);
        }

        if (this.state.filter) {
            if (this.state.filter.indexOf('=') > -1 || this.state.filter.indexOf('<') > -1 || this.state.filter.indexOf('>') > -1) {
                if (this.state.filter.indexOf('=') > -1) {
                    let arr = this.state.filter.split('=')
                    let key = arr[0]
                    let value = arr[1]
                    results = results.filter(r => {
                        return Object.keys(r).filter(k => {
                            return r[k] && k.toLowerCase() === key.toLowerCase() && r[k].toString().toLowerCase().indexOf(value.toLowerCase()) > -1
                        }).length > 0;
                    });
                } else if (this.state.filter.indexOf('>') > -1) {
                    let arr = this.state.filter.split('>')
                    let key = arr[0]
                    let value = arr[1]
                    results = results.filter(r => {
                        return Object.keys(r).filter(k => {
                            return r[k] && k.toLowerCase() === key.toLowerCase() && r[k] * 1 > value * 1
                        }).length > 0;
                    });
                } else if (this.state.filter.indexOf('<') > -1) {
                    let arr = this.state.filter.split('<')
                    let key = arr[0]
                    let value = arr[1]
                    results = results.filter(r => {
                        return Object.keys(r).filter(k => {
                            return r[k] && k.toLowerCase() === key.toLowerCase() && r[k] * 1 < value * 1
                        }).length > 0;
                    });
                }
            } else {
                results = results.filter(r => {
                    return Object.keys(r).filter(k => {
                        return r[k] && r[k].toString().toLowerCase().indexOf(this.state.filter.toLowerCase()) > -1
                    }).length > 0;
                });
            }
        }

        return results || [];
    }

    setFilter(event) {
        this.setState({
            filter: event.target.value,
            page: 0
        })
    }

    showLoading() {
        this.setState({ loading: true })
    }

    hideLoading() {
        this.setState({ loading: false })
    }

    queryForDownload = window.queryForDownload.bind(this)

    download() {
        this.queryForDownload('http://localhost:3030/excel', { data: this.getData() })
    }

    render() {

        let rows = this.getData();

        let length = rows.length;

        return <div className="flex w-full flex-wrap">
            <div className="w-full flex flex-wrap justify-between items-center h-12">
                <div className="flex">
                    <span className="text-grey-darker leading-loose pr-2">Per Page: </span>
                    <select disabled={this.props.data.length === 0} className="p-1 border bg-grey-lightest" onChange={event => this.setState({ no_of_rows: event.target.value })} value={this.state.no_of_rows} id="">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                    </select>
                </div>
                <div className="flex">
                    <span>
                        <input disabled={this.props.data.length === 0} className="w-64 p-2 bg-grey-lighter mr-2" placeholder="filter the contents" onChange={this.setFilter.bind(this)} value={this.state.filter} />
                    </span>
                    <a title="Download this table" className="block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center" href="#" onClick={this.props.data.length === 0 ? () => alert('No rows available', 'error') : this.download}>⇓</a>
                </div>
            </div>
            {rows.length > 0 && <>
                <div className="w-full overflow-x-scroll">
                    <table>
                        <thead>
                            <tr>
                                {Object.keys(rows[0]).map(e => <th key={e} onClick={()=>copy(e)} className="cursor-pointer do-not-select" onDoubleClick={() => this.setState({ orderBy: e, order: this.state.order === 'desc' ? 'asc' : 'desc' })}>{e}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.splice(this.state.page * this.state.no_of_rows, this.state.no_of_rows).map((c, i) => <tr key={i}>{Object.keys(c).map((e, i) => <td onClick={()=>copy((c[e] || '(NULL)').toString())} key={i}>{(c[e] || '(NULL)').toString()}</td>)}</tr>)}
                        </tbody>
                    </table>
                </div>
                <div className="w-full flex flex-wrap justify-between mt-2">
                    <div className="paginate-div">
                        <ReactPaginate
                            initialPage={0}
                            forcePage={this.state.page || 0}
                            onPageChange={(page) => this.setState({ page: page.selected })}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={5}
                            containerClassName={'pagination m-0 p-0'}
                            subContainerClassName={'pages pagination'}
                            activeClassName={'active'}
                            pageCount={Math.ceil(rows.length / this.state.no_of_rows) + 1}
                        />
                    </div>
                    <span className="leading-loose">Total rows: {length}</span>
                </div>
            </>}
            {length === 0 && <div className="h-8 w-full bg-red-lightest flex items-center overflow-hidden"><span className="p-4 text-red-darker">
                {'No rows matched.'}</span></div>}
        </div>
    }

}