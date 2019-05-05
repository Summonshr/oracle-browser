import React from 'react';
import _ from 'lodash';
import Axios from 'axios';
import ReactLoading from 'react-loading';
import Table from './Table';

const funcs = [
    'componentDidMount',
    'load',
    'loadColumns',
    'getBody'
]

let attempt = false;

Object.prototype.toString = function () {
    return JSON.stringify(this)
}

class Schema extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            rows: [],
            metaData: [],
            schemas: [],
            tables: [],
            columns: [],
            page: 0,
            loading: false,
            order: 'asc',
            orderBy: '',
            filterTable: '',
        }

        funcs.filter(f => {
            this[f] = this[f].bind(this)
        })
    }

    componentDidMount() {

        Axios.post('http://localhost:3030/select', {
            query: "SELECT distinct owner FROM all_tab_cols"
        }).then(res => {
            console.log(res.data)
            this.setState({
                schemas: res.data.rows,
                tables: []
            });
        })
    }

    load(schema) {
        this.setState({ schema, tables: [], columns: [], loading: true, page: 0, order: '', orderBy: 'asc' })

        attempt && attempt.cancel();

        attempt = Axios.CancelToken.source();

        Axios.post('http://localhost:3030/select', {
            query: "SELECT distinct table_name FROM all_tab_cols where owner = '" + schema + "'"
        }, { cancelToken: attempt.token }).then(res => {
            this.setState({
                tables: res.data.rows,
                loading: false,
            });
        })
    }

    loadColumns(table) {
        this.setState({ table, loading: true, page: 0, order: '', orderBy: '' });

        attempt && attempt.cancel();

        attempt = Axios.CancelToken.source();

        Axios.post('http://localhost:3030/select', {
            query: "SELECT * FROM all_tab_cols where owner = '" + this.state.schema + "' and table_name = '" + table + "'"
        }, { cancelToken: attempt.token }).then(res => {
            this.setState({
                columns: res.data.rows.map(e => {
                    delete e.OWNER
                    delete e.TABLE_NAME
                    return e;
                }),
                loading: false
            });
        });
    }

    getBody() {
        let results = [...this.state.columns];

        if (this.state.orderBy.length > 0)
            results = _.orderBy(results, (e) => {
                return (e[this.state.orderBy] || '').toString().padStart(100, '0')
            }, this.state.order)

        return results || [];
    }

    render() {
        return <div className="w-full flex flex-wrap">
            {this.state.loading && <div className="w-full absolute h-screen bg-green-lightest opacity-25">
                <div className="w-64 text-center mx-auto flex justify-center">
                    <ReactLoading type='bubbles' color='red' />
                </div>
            </div>}
            <div className="w-1/3 flex" >
                <div className="w-1/3 border-r-2">
                    <ul className="list-reset  min-h-screen overflow-y-scroll">
                        <li className="w-full border-b p-2">Schemas</li>
                        {this.state.schemas.map(e => <li key={e} onClick={() => this.load(e.OWNER)} className={"w-full bg-grey-lightest hover:bg-green-lighter border-b p-2 " + (this.state.schema === e.OWNER && ' bg-green-light')}>{e.OWNER}</li>)}
                    </ul>
                </div>
                <div className="w-2/3 border-r-2 ">
                    <ul className="list-reset h-screen overflow-y-scroll">
                        <li className="w-full border-b"><input className="w-full p-2 bg-green-lightest" value={this.state.filterTable} onChange={event => this.setState({ filterTable: event.target.value })} placeholder="Filter tables" /></li>
                        {this.state.tables.filter(t => {
                            if (this.state.filterTable) {
                                return t.TABLE_NAME.toLowerCase().indexOf(this.state.filterTable.toLowerCase()) > -1
                            }
                            return true;
                        }).map(e => <li key={e} onClick={() => this.loadColumns(e.TABLE_NAME)} className={"w-full bg-grey-lightest hover:bg-green-lighter border-b p-2 " + (this.state.table === e.TABLE_NAME && ' bg-green-light')}>{e.TABLE_NAME}</li>)}
                    </ul>
                </div>
            </div>
            <div className="w-2/3 flex flex-wrap overflow-y-scroll p-2">
                {!this.state.loading && <Table data={this.state.columns} />}
            </div>
        </div>
    }
}

export default Schema;

