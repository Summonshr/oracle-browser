import React from 'react'
import Bar from './charts/Bar';
import Pie from './charts/Pie';
import Line from './charts/Line';

let charts = {Bar, Pie, Line}

export default class Graph extends React.Component {
    state = {type: 'Bar'}

    render(){
        if(this.props.data.length === 0  || Object.keys(this.props.data[0]).length > 3){
            return <div>At lease one column and not more than 3 is required.</div>
        }

        let keys = Object.keys(this.props.data[0])

        if(keys.length === 1) {
            return <div>Display pie chart</div>
        }

        let Chart = charts[this.state.type];

        return <div className="w-full flex flex-wrap pl-8 charts">
            <div className="w-full flex flex-wrap justify-between px- 4">
                <div></div>
                <select className="p-2 border bg-grey-lighter" onChange={event=>this.setState({type: event.target.value})}>
                    <option value="Bar">Bar</option>
                    <option value="Pie">Pie</option>
                    <option value="Line">Line</option>
                </select>
            </div>
            {this.props.data.length > 0 && <Chart keys={Object.keys(this.props.data[0])} data={this.props.data} />}
        </div>

    }
}