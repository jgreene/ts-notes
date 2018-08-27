
import * as t from 'io-ts'

export const PersonType = t.type({
    ID: t.Integer,
    FirstName: t.string,
    LastName: t.string
})

export interface IPerson extends t.TypeOf<typeof PersonType> {}

