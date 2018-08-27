import * as React from 'react'
import * as ReactDOM from 'react-dom';

import { TestForm } from './test-form'
import { TestDeriveForm } from './test-derive'

class App extends React.Component {
    render() {
        return (
            <div>
                <TestForm />

                <TestDeriveForm />
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById('root'));