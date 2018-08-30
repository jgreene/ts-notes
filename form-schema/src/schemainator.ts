
import * as t from 'io-ts'
import * as tdc from 'io-ts-derive-class'

import { deriveFormState } from './form-state'

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

const TestTupleType = t.tuple([t.string, t.number])

const PersonType = t.type({
    ID: t.Integer,
    FirstName: t.string,
    LastName: t.string,
    MiddleName: t.union([t.string, t.null]),
    Address: tdc.ref(Address),
    Addresses: t.array(tdc.ref(Address)),
    Tuple: TestTupleType
});

class Person extends tdc.DeriveClass(PersonType) {}
