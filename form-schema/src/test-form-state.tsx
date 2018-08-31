import * as React from 'react'

import * as t from 'io-ts';
import * as tdc from 'io-ts-derive-class'

import { deriveFormState, getFormModel, FormState, InputState } from './form-state'

import { observable, autorun, action, runInAction, computed, intercept, observe, spy } from 'mobx';
import { observer } from "mobx-react"
import { FormGroup, FormLabel, FormControlLabel, TextField, Typography, Button } from '@material-ui/core';

const CityType = t.type({
    ID: t.number,
    Name: t.string
})

class City extends tdc.DeriveClass(CityType) {}

const AddressType = t.type({
    StreetAddress1: t.string,
    StreetAddress2: t.string,
    City: tdc.ref(City)
});

class Address extends tdc.DeriveClass(AddressType) {}

const PersonType = t.type({
    ID: t.Integer,
    FirstName: t.string,
    LastName: t.string,
    MiddleName: t.union([t.string, t.null]),
    Address: tdc.ref(Address),
    Addresses: t.array(tdc.ref(Address))
});

class Person extends tdc.DeriveClass(PersonType) {}

class PersonFormState {
    @observable state: FormState<Person>;

    constructor(public fetch: Promise<Person>){
        runInAction(() => {
            fetch.then(p => {
                this.state = deriveFormState(p);
                spy((change) => {
                    console.log(change);
                    return change;
                })
            })
        })
    }

    @computed get FullName() {
        return this.state.value.FirstName.value + ' ' + this.state.value.LastName.value;
    }

    onSubmit() {
        const model = getFormModel(this.state);
        const person = new Person(model);
        console.log(person);
    }
}

type InputProps<T> = {
    label: string;
    state: InputState<T>
}

@observer
class TextInputField extends React.Component<InputProps<any>, {}> {
    render() {
        let value = this.props.state.value;
        return (<React.Fragment>
                    <TextField 
                        disabled={this.props.state.disabled} 
                        hidden={!this.props.state.visible}
                        label={this.props.label} 
                        value={value === null ? '' : value} 
                        onChange={(e: any) => this.props.state.onChange(e.target.value)}
                        error={this.props.state.errors.length > 0}
                        required={this.props.state.required}
                    />
            </React.Fragment>);
    }
}

@observer
export class PersonForm extends React.Component<{}, {}> {
    form: PersonFormState = new PersonFormState(new Promise(resolve => {
        resolve(new Person({ FirstName: 'First', LastName: 'Last' }));
    }));

    render() {
        if(this.form == undefined || this.form.state === undefined){
            return <div>Loading...</div>
        }

        return (
            <form onSubmit={this.form.onSubmit} noValidate>
                <FormGroup>
                    <Typography variant="title" gutterBottom>
                        Person Form
                    </Typography>

                    <TextInputField label="First Name" state={this.form.state.value.FirstName} />
                    <TextInputField label="Last Name" state={this.form.state.value.LastName} />

                    <FormLabel>Full Name</FormLabel>
                    <Typography  gutterBottom>
                        {this.form.FullName}
                    </Typography>

                    <TextInputField label="Street Address1" state={this.form.state.value.Address.value.StreetAddress1} />
                    <TextInputField label="Street Address2" state={this.form.state.value.Address.value.StreetAddress2} />

                    <Button variant="contained" color="primary" onClick={(e: any) => this.form.onSubmit()}>
                        Submit
                    </Button>

                </FormGroup>
            </form>
        );
    }
}