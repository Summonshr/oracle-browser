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
import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';
window.alert = function(message, type = 'info'){
    Alert[type](message)
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

window.copy = str => {
    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
    }
};

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
ReactDOM.render(<> {window.location.pathname === '/schema-browser' ? <Schema /> : <App /> } <Alert offset={'50px'} position={'top-right'} stack={false} /></>, document.getElementById('root'));

    serviceWorker.unregister();
}, 100)
