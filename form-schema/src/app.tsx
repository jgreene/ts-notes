import "babel-polyfill";
import * as React from 'react'
import * as ReactDOM from 'react-dom';

import { TestForm } from './test-form'
import { TestDeriveForm } from './test-derive'
import { PersonForm } from './test-form-state'

class App extends React.Component {
    render() {
        return (
            <div>
                <PersonForm />
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById('root'));