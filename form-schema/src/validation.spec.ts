import { expect } from 'chai';
import 'mocha';

import * as m from 'io-ts-derive-class';
import * as t from 'io-ts';
import moment from 'moment';
import { PathReporter } from 'io-ts/lib/PathReporter'

(moment as any).suppressDeprecationWarnings = true;

import { register, validate, required, getRequiredFieldsFor } from './validation'

const PersonAddressType = t.type({
    StreetAddress1: t.string,
    StreetAddress2: t.string,
})

class PersonAddress extends m.DeriveClass(PersonAddressType) {}

const DateTimeOrNullType = t.union([m.DateTime, t.null]);

const PersonType = t.type({
    ID: t.number,
    FirstName: t.string,
    LastName: t.string,
    Address: m.ref(PersonAddress),
    Addresses: t.array(m.ref(PersonAddress)),
    SecondaryAddresses: t.array(m.ref(PersonAddress)),
    Birthdate: t.union([m.DateTime, t.null])
})

class Person extends m.DeriveClass(PersonType) {}


register<Person>(Person, {
    FirstName: required('FirstName is required'),
    LastName: (p) => new Promise<string | null>(resolve => {
        setTimeout(() => {
            resolve((p.LastName == null || p.LastName.length < 1 ? "LastName is required" : null))
        }, 1);
    }),
    Addresses: (p) => p.Addresses == null || p.Addresses.length < 1 ? "Must have at least one address" : null,
    SecondaryAddresses: (p) => { 
        if(!p.SecondaryAddresses || p.SecondaryAddresses.length < 1)
            return null;

        var first = p.SecondaryAddresses[0];
        if(first.StreetAddress1 !== "Test")
            return "First StreetAddress1 must equal Test";

        return null;
    }
});

register<PersonAddress>(PersonAddress, {
    StreetAddress1: required("StreetAddress1 is required"),
    StreetAddress2: required("StreetAddress2 is required"),
});

describe('Can validate Person', () => {

    it('FirstName is required', async () => {
        const person = new Person();
        const result = await validate(person);
        
        expect(result).to.have.property("FirstName");
        if(result.FirstName){
            expect(result.FirstName).length(1);
            expect(result.FirstName[0]).eq("FirstName is required");
        }
    });

    it('LastName is required', async () => {
        const person = new Person();
        const result = await validate(person);
        
        expect(result).to.have.property("LastName");
        if(result.LastName){
            expect(result.LastName).length(1);
            expect(result.LastName[0]).eq("LastName is required");
        }
    });

    it('Address StreetAddress1 is required', async () => {
        const person = new Person();
        const result = await validate(person);
        
        expect(result).to.have.property("Address");
        expect(result.Address.StreetAddress1).length(1);
        expect(result.Address.StreetAddress1[0]).eq("StreetAddress1 is required");
    });

    it('Must have at least one address', async () => {
        const person = new Person();
        const result = await validate(person);
        
        expect(result).to.have.property("Addresses");
        if(result.Addresses){
            expect(result.Addresses).length(0);
            expect(result.Addresses.errors).length(1);
            expect(result.Addresses.errors[0]).eq("Must have at least one address");
        }
    });

    it('First address must have StreetAddress1', async () => {
        const person = new Person();
        person.Addresses.push(new PersonAddress());
        const result = await validate(person);
        
        expect(result).to.have.property("Addresses");
        expect(result.Addresses).length(1);
        if(result.Addresses && result.Addresses.length > 0){
            expect(result.Addresses).length(1);
            expect(result.Addresses.errors).length(0);
            const firstAddress = result.Addresses[0];
            if(firstAddress && firstAddress.StreetAddress1){
                expect(firstAddress.StreetAddress1).length(1);
                expect(firstAddress.StreetAddress1[0]).eq("StreetAddress1 is required");
            }
        }
    });

    it('First SecondaryAddress must have StreetAddress1 equal to Test', async () => {
        const person = new Person();
        person.SecondaryAddresses.push(new PersonAddress());
        const result = await validate(person);
        expect(result).to.have.property("SecondaryAddresses");
        expect(result.SecondaryAddresses).length(1);
        if(result.SecondaryAddresses){
            expect(result.SecondaryAddresses.errors).length(1);
            expect(result.SecondaryAddresses.errors[0]).eq("First StreetAddress1 must equal Test");
        }
    });

    it('Valid path has empty errors array', async () => {
        const person = new Person({ FirstName: 'Test' });
        const result = await validate(person);

        expect(result.FirstName.length).eq(0);
    });

    it('Use of validationPath only validates the given path', async () => {
        const person = new Person();
        const result = await validate(person, '.Address.StreetAddress2');
        
        expect(result).to.have.property("Address");
        expect(result.FirstName).eq(undefined);
        expect(result.Address.StreetAddress1).eq(undefined);
        expect(result.Address.StreetAddress2).length(1);
        expect(result.Address.StreetAddress2[0]).eq("StreetAddress2 is required");
    });

    it('Use of validationPath against array only validates a single entry in the array', async () => {
        const person = new Person();
        person.SecondaryAddresses.push(new PersonAddress());
        person.SecondaryAddresses.push(new PersonAddress());
        const result = await validate(person, '.SecondaryAddresses[0].StreetAddress1');
        expect(result).to.have.property("SecondaryAddresses");
        expect(result.SecondaryAddresses).length(person.SecondaryAddresses.length);
        expect(result.SecondaryAddresses.errors).length(1);
        expect(result.SecondaryAddresses.errors[0]).eq("First StreetAddress1 must equal Test");
    });

    it('primitive fields are validated with io-ts', async () => {
        let id: any = 'Not a real ID';
        const person = new Person();
        person.ID = id;
        const result = await validate(person);

        expect(result.ID.length).eq(1);
        expect(result.ID[0]).eq('Invalid value "Not a real ID" supplied to : number');
    });

    it('Can get required fields map for person', async () => {
        const fields = getRequiredFieldsFor(Person);
        
        expect(fields.FirstName).eq(true);
        expect(fields.LastName).eq(false);
    });

    it('Setting an invalid Birthdate results in a validation error', async () => {
        let person = new Person({ FirstName: 'Test' });
        let bd: any = 'Invalid datetime';
        person.Birthdate = bd;

        const result = await validate(person);
        
        expect(result.Birthdate.length).eq(2);
    });

    it('Setting an valid Birthdate results in no validation errors', async () => {
        let person = new Person({ FirstName: 'Test' });
        let bd: any = '0002-01-12T05:50:36.000Z';
        person.Birthdate = bd;

        const result = await validate(person);
        
        expect(result.Birthdate.length).eq(0);
    });

    it('Can validate moment or null', async () => {
        let bd: any = moment('0002-01-12T05:50:36.000Z');

        let decodeResult = DateTimeOrNullType.decode(bd);
        expect(decodeResult.isLeft()).eq(false);
        if(decodeResult.isLeft()){
            console.log(PathReporter.report(decodeResult));
        }
    })
});