import * as React from 'react'

import * as schema from './types'
import { DynamicForm } from './dynamic-form'

const TestFormSchema = new schema.FormGroupSchema("Test Form", [
    new schema.UIField("ID", new schema.IntType(), false, new schema.TextField(), new schema.DisabledStatus()),
    new schema.UIField("FirstName", new schema.StringType(), true, new schema.TextField()),
    new schema.UIField("LastName", new schema.StringType(), true, new schema.TextField()),
])

export class TestForm extends React.Component<{}, {}> {
    render() {
        return (<DynamicForm schema={TestFormSchema} />);
    }
}