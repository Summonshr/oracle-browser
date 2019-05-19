import React from 'react'
import {BarChart,CartesianGrid,XAxis,YAxis,Tooltip,Legend,Bar} from 'recharts';

export default class BarCharts extends React.Component {

    render() {
       return  <BarChart width={800} height={250} data={this.props.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={this.props.keys[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            {this.props.keys.splice(1,this.props.keys.length - 1).map(e => <Bar key={e} dataKey={e} fill="#8884d8" />)}
        </BarChart>
    }
}