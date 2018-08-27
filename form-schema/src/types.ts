export class IntType {}
export class NumberType {}
export class DateTimeType {}
export class DateType {}
export class GuidType {}
export class StringType {}
export class BooleanType {}

export type FieldType =
    IntType
    | StringType
    | DateTimeType
    | DateType
    | GuidType

export class TextField {}
export class DateTimeField {}
export class DateField {}
export class CheckboxField {}

export type FieldUIType =
    TextField
    | DateTimeField
    | DateField

export class DisabledStatus {}
export class HiddenStatus {}

export type FieldUIStatus = DisabledStatus | HiddenStatus

export class UIField {
    constructor(
        public name: string,
        public type: FieldType,
        public required: boolean,
        public ui_type: FieldUIType,
        public status?: FieldUIStatus
    ) {}
}

export class FormGroupSchema {
    constructor(
        public name: string,
        public children: Array<UIField | FormGroupSchema>
    ){}
}