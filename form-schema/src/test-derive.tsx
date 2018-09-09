import * as React from 'react'
import * as schema from './types'
import { DynamicForm } from './dynamic-form'

import { deriveFormSchema, Entity, Field } from './derive'

import * as t from 'io-ts'
import * as tdc from 'io-ts-derive-class'

const PersonAddressType = t.type({
    StreetAddress1: t.string,
    StreetAddress2: t.string,
})

class PersonAddress extends tdc.DeriveClass(PersonAddressType) {}

const PersonType = t.type({
    ID: t.number,
    FirstName: t.string,
    LastName: t.string,
    Address: tdc.ref(PersonAddress)
})

class Person extends tdc.DeriveClass(PersonType) {} 

const PersonSchema = deriveFormSchema(Person);

export class TestDeriveForm extends React.Component<{}, {}> {
    render() {
        return (<DynamicForm schema={PersonSchema} />);
    }
}