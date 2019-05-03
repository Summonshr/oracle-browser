import ReactPaginate from 'react-paginate';
import React from 'react';
import _ from 'lodash';

export default class Table extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 0,
            order: 'asc',
            orderBy: '',
            filter: '',
        }
        this.getData = this.getData.bind(this)
        this.download = this.download.bind(this)
    }

    getData() {
        let results = [...this.props.data];

        if (this.state.orderBy.length > 0) {
            results = _.orderBy(results, (e) => {
                return (e[this.state.orderBy] || '').toString().padStart(50, '0')
            }, this.state.order)
        }

        if (this.state.filter) {
            if (this.state.filter.indexOf('=') > -1 || this.state.filter.indexOf('<') > -1 || this.state.filter.indexOf('>') > -1) {
               
                if(this.state.filter.indexOf('=') > -1) {
                    let arr = this.state.filter.split('=')
                    let key = arr[0]
                    let value = arr[1]
                    results = results.filter(r => {
                        return Object.keys(r).filter(k => {
                            return r[k] && k.toLowerCase() === key.toLowerCase() && r[k].toString().toLowerCase().indexOf(value.toLowerCase()) > -1
                        }).length > 0;
                    })
                } else if (this.state.filter.indexOf('>') > -1){
                    let arr = this.state.filter.split('>')
                    let key = arr[0]
                    let value = arr[1]
                    results = results.filter(r => {
                        return Object.keys(r).filter(k => {
                            return r[k] && k.toLowerCase() === key.toLowerCase() && r[k] * 1 > value * 1
                        }).length > 0;
                    })
                } else if (this.state.filter.indexOf('<') > -1) {
                    let arr = this.state.filter.split('<')
                    let key = arr[0]
                    let value = arr[1]
                    results = results.filter(r => {
                        return Object.keys(r).filter(k => {
                            return r[k] && k.toLowerCase() === key.toLowerCase() && r[k] * 1 < value * 1
                        }).length > 0;
                    })
                }
            } else {
                results = results.filter(r => {
                    return Object.keys(r).filter(k => {
                        return r[k] && r[k].toString().toLowerCase().indexOf(this.state.filter.toLowerCase()) > -1
                    }).length > 0;
                })
            }
        }

        return results || [];
    }


    setFilter(event) {
        this.setState({
            filter: event.target.value
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
            {<div className="w-full">
                <div className="w-full flex flex-wrap justify-between items-center h-12">
                    <div className="flex">
                        <span className="text-grey-darker">Total rows: </span>
                        <span className="font-semibold text-green-darker pl-2">{length}</span>
                    </div>
                    <div className="flex">
                        <span>
                            <input className="w-64 p-2 bg-grey-lighter mr-2" placeholder="filter the contents" onChange={this.setFilter.bind(this)} value={this.state.filter} />
                        </span>
                        <a title="Download this table" className="block cursor-pointer w-8 h-8 flex flex-wrap justify-center items-center" href="#" onClick={this.download}>⇓</a>
                    </div>
                </div>
                {rows.length > 0 && <>
                    <div className="w-full overflow-x-scroll">
                        <table>
                            <thead>
                                <tr>
                                    {Object.keys(rows[0]).map(e => <th key={e} className="cursor-pointer do-not-select" onClick={() => this.setState({ orderBy: e, order: this.state.order === 'desc' ? 'asc' : 'desc' })}>{e}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.splice(this.state.page * 10, 10).map((c,i) => <tr key={i}>{Object.keys(c).map((e,i) => <td key={i}>{(c[e] || '').toString()}</td>)}</tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div className="w-full">
                         <div className="paginate-div w-full">
                            <ReactPaginate
                                initialPage={0}
                                forcePage={this.state.page || 0}
                                onPageChange={(page) => this.setState({ page: page.selected })}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={5}
                                containerClassName={'pagination'}
                                subContainerClassName={'pages pagination'}
                                activeClassName={'active'}
                                pageCount={Math.ceil(rows.length / 10) + 1}
                            />
                        </div>
                    </div>
                    </>}
                    {length == 0 && <div className="h-8 w-full bg-red-lightest flex items-center overflow-hidden"><span className="p-4 text-red-darker">
                            {this.state.error || 'No rows matched.'}</span></div>}
            </div>}
        </div>
    }
}