import * as React from 'react'
import * as schema from './types'
import { DynamicForm } from './dynamic-form'

import { deriveFormSchema, Entity, Field } from './derive'

import { register } from './validation'

@Entity
class PersonAddress {
    @Field()
    StreetAddress1: String = '';
    @Field()
    StreetAddress2: String = '';
}

@Entity
class Person {
    @Field()
    ID: number = 0;
    @Field()
    FirstName: string = '';
    @Field()
    LastName: string = '';

    @Field()
    Address: PersonAddress = new PersonAddress();

    constructor(part: Partial<Person>) {
        Object.assign(this, part);
    }
}

const PersonSchema = deriveFormSchema(new Person({}));

export class TestDeriveForm extends React.Component<{}, {}> {
    render() {
        return (<DynamicForm schema={PersonSchema} />);
    }
}