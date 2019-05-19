import React from 'react'
import {LineChart,CartesianGrid,XAxis,YAxis,Tooltip,Legend,Line} from 'recharts';
import colors from './colors'

export default class LineCharts extends React.Component {

    render() {
       return  <LineChart width={800} height={250} data={this.props.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={this.props.keys[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            {this.props.keys.splice(1,this.props.keys.length - 1).map((e,i) => <Line type="monotone" key={e} dataKey={e} fill={colors[i]} />)}
        </LineChart>
    }
}