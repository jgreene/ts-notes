
import * as t from 'io-ts';
import * as m from 'io-ts-derive-class'

export type FieldType = t.StringType | t.BooleanType | t.NumberType;

export const TextField = t.literal('TextField');
export const Checkbox = t.literal('Checkbox');

export type UIFieldType = t.LiteralType<'TextField'> | t.LiteralType<'Checkbox'>

export class UIField {
    constructor(
        public name: string,
        public type: FieldType,
        public ui: UIFieldType,
        public required: boolean = false,
        public disabled: boolean = false,
        public hidden: boolean = false
    ) {}
}

export class FormGroupSchema {
    constructor(
        public name: string,
        public children: Array<UIField | FormGroupSchema>
    ){}
}