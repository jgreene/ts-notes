import { expect } from 'chai';
import 'mocha';

import * as t from 'io-ts';
import * as tdc from 'io-ts-derive-class'
import { deriveFormState, FormState } from './form-state'
import { observable, action, runInAction, computed } from 'mobx';

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
    constructor(public state: FormState<Person>){

    }

    @computed get FullName() {
        return this.state.FirstName.value + ' ' + this.state.LastName.value;
    }
}

describe('Person formstate', () => {
    it('FirstName matches in derived state', async () => {
        let person = new Person({ FirstName: 'Test'});
        const state = deriveFormState(person);

        expect(state).to.have.property("FirstName");
        expect(state.FirstName.value).eq('Test');
    });

    it('StreetAddress1 matches in derived state', async () => {
        let address = new Address({ StreetAddress1: 'Test Street1'});
        let person = new Person({ FirstName: 'Test', Address: address});
        const state = deriveFormState(person);

        expect(state.Address.StreetAddress1.value).eq(address.StreetAddress1);
    });

    it('FullName is calculated properly', async () => {
        let person = new Person({ FirstName: 'First', LastName: 'Last'});
        const state = deriveFormState(person);
        let personFormState = new PersonFormState(state);


        expect(personFormState).to.have.property("FullName");
        expect(personFormState.FullName).eq('First Last');

        state.FirstName.onChange('NewFirst');
        expect(state.FirstName.value).eq('NewFirst');
        expect(personFormState.FullName).eq('NewFirst Last');
        const personInputState = state.inputState;
    });

    it('Can get form model', async () => {
        let person = new Person({ FirstName: 'First', LastName: 'Last'});
        const state = deriveFormState(person);
        const street1 = '123 Test St';
        state.Address.StreetAddress1.onChange(street1);
        const model = state.getFormModel();
        Object.keys(person).forEach(k => {
            expect(model).to.have.property(k);
        });
        
        expect(model.FirstName).eq('First');

        const person2 = new Person(model);

        if(!(person2.Address instanceof Address)){
            expect(true).eq(false);
        }

        expect(model.Address.StreetAddress1).eq(street1);
        expect(person2.Address.StreetAddress1).eq(street1);
    })

    it('Can get path for state', async () => {
        let address = new Address({ StreetAddress1: 'Test Street1'});
        let person = new Person({ FirstName: 'Test', Address: address});
        person.Addresses.push(address);
        person.Addresses.push(address);
        const state = deriveFormState(person);
        
        expect(state.Address.StreetAddress1.path).eq('.Address.StreetAddress1');
        expect(state.Addresses.path).eq('.Addresses');
        expect(state.Addresses.value[0].StreetAddress1.path).eq('.Addresses.value[0].StreetAddress1');
        expect(state.Addresses.value[1].StreetAddress1.path).eq('.Addresses.value[1].StreetAddress1');
    })
});