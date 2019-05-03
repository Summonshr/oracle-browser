import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './tailwind.css';
import './App.css';
import './pagination.css'
import App from './App';
import Schema from './Schema';
import * as serviceWorker from './serviceWorker';
import Axios from 'axios';


const excel = (data, name) => {
    const downloadUrl = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', name + '.xlsx'); //any other extension
    document.body.appendChild(link);
    link.click();
    link.remove();
}

window.queryForDownload = function (url, data) {
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

setTimeout(() => {
    ReactDOM.render(window.location.pathname === '/schema-browser' ? <Schema /> : <App />, document.getElementById('root'));

    serviceWorker.unregister();
}, 100)
