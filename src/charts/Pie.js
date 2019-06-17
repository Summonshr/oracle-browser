import React from 'react'
import { PieChart, Cell, Tooltip,  Pie } from 'recharts';
import colors from './colors'

const CustomTooltip = ({ active, payload, label }) => {
    if (active) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label} : ${payload[0].value}`}</p>
          <p className="intro">SAMPLE</p>
          <p className="desc">Anything you want can be displayed here.</p>
        </div>
      );
    }

    return null;
  };

export default class BarCharts extends React.Component {

    render() {
        let main = this.props.keys[0];

        return <PieChart width={730} height={300}>
            {this.props.keys.splice(1, this.props.keys.length - 1).map((e, i) => {
                let data = this.props.data.map(d=>{
                    return {
                        [main]: 'Sol Id: ' + d[main],
                        [e]: d[e]
                    }
                })
                return <Pie data={data} dataKey={e} key={e} nameKey={main} cx="50%" cy="50%" outerRadius={120 + i * 10} fill={colors[i]}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`}  fill={colors[index % colors.length]} />)}
                    <Tooltip content={<CustomTooltip />} />
                </Pie>
            })}
            <Tooltip />
        </PieChart>
    }
}