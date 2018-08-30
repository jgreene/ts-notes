import * as React from 'react'

import * as t from 'io-ts';
import * as schema from './types'
import { DynamicForm } from './dynamic-form'

const TestFormSchema = new schema.FormGroupSchema("Test Form", [
    new schema.UIField("ID", t.number, schema.TextField),
    new schema.UIField("FirstName", t.string, schema.TextField, true),
    new schema.UIField("LastName", t.string, schema.TextField, true),
])

export class TestForm extends React.Component<{}, {}> {
    render() {
        return (<DynamicForm schema={TestFormSchema} />);
    }
}