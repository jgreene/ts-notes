import { expect } from 'chai';
import 'mocha';

import * as m from 'io-ts-derive-class'
import * as t from 'io-ts';


import { register, validate } from './validation'

const PersonAddressType = t.type({
    StreetAddress1: t.string,
    StreetAddress2: t.string,
})

class PersonAddress extends m.DeriveClass(PersonAddressType) {}

const PersonType = t.type({
    ID: t.number,
    FirstName: t.string,
    LastName: t.string,
    Address: m.ref(PersonAddress),
    Addresses: t.array(m.ref(PersonAddress)),
    SecondaryAddresses: t.array(m.ref(PersonAddress))
})

class Person extends m.DeriveClass(PersonType) {}


register<Person>(Person, {
    FirstName: (p) => p.FirstName == null || p.FirstName.length < 1 ? "FirstName is required" : null,
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
    StreetAddress1: (a) => a.StreetAddress1 == null || a.StreetAddress1.length < 1 ? "StreetAddress1 is required" : null,
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
        if(result.Address && result.Address.StreetAddress1){
            expect(result.Address.StreetAddress1).length(1);
            expect(result.Address.StreetAddress1[0]).eq("StreetAddress1 is required");
        }
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
});